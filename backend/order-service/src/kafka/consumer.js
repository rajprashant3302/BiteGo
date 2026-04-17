const { Kafka } = require("kafkajs");
const { prisma } = require("database");

const kafka = new Kafka({
  clientId: "order-service",
  brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "order-processing-group" });

const emitVendorOrderPayload = async (io, orderId) => {
  const order = await prisma.orders.findUnique({
    where: { OrderID: orderId },
    include: {
      restaurant: true,
      user: true,
      address: true,
      items: {
        include: {
          item: true,
        },
      },
      payments: true,
    },
  });

  if (!order) {
    console.log(`[Kafka] Order not found for vendor emit: ${orderId}`);
    return;
  }

  // Create notification here, where `order` actually exists
  await prisma.notification.create({
    data: {
      RestaurantID: order.RestaurantID,
      Title: "New order received",
      Message: `Order ${order.OrderID} was placed for ${order.restaurant?.Name || "your restaurant"}`,
      Type: "ORDER",
      IsRead: false,
    },
  });

  const payload = {
    orderId: order.OrderID,
    status: order.OrderStatus,
    orderDateTime: order.OrderDateTime,
    totalAmount: order.TotalAmount,
    restaurantId: order.RestaurantID,
    restaurantName: order.restaurant?.Name || "",
    customer: order.user
      ? {
        userId: order.user.UserID,
        name: order.user.Name,
        email: order.user.Email,
        phone: order.user.Phone,
      }
      : null,
    address: order.address
      ? {
        addressId: order.address.AddressID,
        addressLine: order.address.AddressLine,
        city: order.address.City,
        pincode: order.address.Pincode,
      }
      : null,
    items: order.items.map((orderItem) => ({
      itemId: orderItem.ItemID,
      itemName: orderItem.item?.ItemName || "Unknown Item",
      quantity: orderItem.Quantity,
      price: orderItem.ItemPrice,
    })),
    payments: order.payments.map((payment) => ({
      paymentId: payment.PaymentID,
      method: payment.PaymentMethod,
      status: payment.PaymentStatus,
      amount: payment.TotalAmount,
    })),
  };

  if (io) {
    io.to(`restaurant_${order.RestaurantID}`).emit("vendor_new_order", payload);
  }
};

const connectConsumer = async (io) => {
  await consumer.connect();

  await consumer.subscribe({ topic: "payment-success", fromBeginning: false });
  await consumer.subscribe({ topic: "order-confirmed", fromBeginning: false });
  await consumer.subscribe({ topic: "order-assigned", fromBeginning: false });
  await consumer.subscribe({ topic: "order-status-changed", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const eventData = JSON.parse(message.value.toString());

        if (topic === "payment-success") {
          console.log(`[Kafka] Received payment success for Order: ${eventData.orderId}`);

          const updatedOrder = await prisma.orders.update({
            where: { OrderID: eventData.orderId },
            data: { OrderStatus: "Preparing" },
            include: { restaurant: true },
          });

          if (io) {
            io.to(`user_${eventData.userId}`).emit("order_status_update", {
              orderId: eventData.orderId,
              status: "Preparing",
              message: `Payment successful! ${updatedOrder.restaurant.Name} is preparing your order.`,
            });
          }

          await emitVendorOrderPayload(io, eventData.orderId);
        } else if (topic === "order-confirmed") {
          console.log(`[Kafka] Order confirmed for vendor dashboard: ${eventData.orderId}`);

          const updatedOrder = await prisma.orders.update({
            where: { OrderID: eventData.orderId },
            data: { OrderStatus: "Preparing" },
          });

          if (io) {
            io.to(`user_${eventData.userId}`).emit("order_status_update", {
              orderId: updatedOrder.OrderID,
              status: "Preparing",
              message: "Your order has been confirmed and sent to the restaurant.",
            });
          }

          await emitVendorOrderPayload(io, eventData.orderId);
        } else if (topic === "order-assigned") {
          console.log(`[Kafka] Order ${eventData.orderId} assigned to Driver ${eventData.driverId}`);

          const partner = await prisma.deliveryPartner.findUnique({
            where: { UserID: eventData.driverId },
          });

          if (!partner) {
            console.warn(`[Kafka] Delivery partner not found for UserID ${eventData.driverId}`);
            return;
          }

          const updatedOrder = await prisma.orders.update({
            where: { OrderID: eventData.orderId },
            data: {
              DeliveryPartnerID: partner.DeliveryPartnerID,
            },
          });

          if (io) {
            io.to(`user_${updatedOrder.UserID}`).emit("order_status_update", {
              orderId: eventData.orderId,
              status: "Driver Assigned",
              message: "A delivery partner is heading to the restaurant!",
            });
          }
        } else if (topic === "order-status-changed") {
          console.log(`[Kafka] Order ${eventData.orderId} status changed to ${eventData.status}`);

          if (eventData.status === "Delivered") {
            const deliveryEarning = 45.0;

              const finalOrder = await prisma.orders.update({
                where: { OrderID: eventData.orderId },
                data: {
                  OrderStatus: "Delivered",
                  DeliveryPartnerEarning: deliveryEarning,
                },
              });

              // await tx.user.update({
              //   where: { UserID: eventData.driverId },
              //   data: { WalletBalance: { increment: deliveryEarning } },
              // });

              // await tx.walletTransaction.create({
              //   data: {
              //     UserID: eventData.driverId,
              //     Amount: deliveryEarning,
              //     TransactionType: "Credit",
              //     Description: `Delivery Earning for Order #${eventData.orderId.slice(-6)}`,
              //   },
              // });

              if (io) {
                io.to(`user_${finalOrder.UserID}`).emit("order_status_update", {
                  orderId: eventData.orderId,
                  status: "Delivered",
                  message: "Your food has arrived! Enjoy your meal.",
                });

                io.to(`restaurant_${finalOrder.RestaurantID}`).emit("vendor_order_status_updated", {
                  orderId: finalOrder.OrderID,
                  status: "Delivered",
                });
              };

            console.log(`💰 Driver ${eventData.driverId} earned ₹${deliveryEarning} for Order ${eventData.orderId}`);
          } else {
            const updatedOrder = await prisma.orders.update({
              where: { OrderID: eventData.orderId },
              data: { OrderStatus: eventData.status },
            });

            if (io) {
              io.to(`restaurant_${updatedOrder.RestaurantID}`).emit("vendor_order_status_updated", {
                orderId: updatedOrder.OrderID,
                status: updatedOrder.OrderStatus,
              });

              io.to(`user_${updatedOrder.UserID}`).emit("order_status_update", {
                orderId: updatedOrder.OrderID,
                status: updatedOrder.OrderStatus,
                message: `Your order is now ${updatedOrder.OrderStatus}!`,
              });
            }
          }
        }
      } catch (error) {
        console.error(`[Kafka] Error processing message from topic ${topic}:`, error);
      }
    },
  });
};

module.exports = { connectConsumer };