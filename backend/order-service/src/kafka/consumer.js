// kafka/consumer.js (Order Service)
const { Kafka } = require('kafkajs');
const { prisma } = require("database");

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'order-processing-group' });

const connectConsumer = async (io) => {
  await consumer.connect();
  
  // 📡 Subscribe to topics
  await consumer.subscribe({ topic: 'payment-success', fromBeginning: false });
  // ✨ NEW: Subscribe to order assignments from the delivery service
  await consumer.subscribe({ topic: 'order-assigned', fromBeginning: false });
  await consumer.subscribe({ topic: 'order-status-changed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const eventData = JSON.parse(message.value.toString());

        // ─── SCENARIO 1: PAYMENT SUCCESS ─────────────────────────────
        if (topic === 'payment-success') {
          console.log(`[Kafka] Received payment success for Order: ${eventData.orderId}`);

          const updatedOrder = await prisma.orders.update({
            where: { OrderID: eventData.orderId },
            data: { OrderStatus: 'Preparing' }, // Restaurant starts cooking!
            include: { restaurant: true }
          });

          if (io) {
            io.to(`user_${eventData.userId}`).emit('order_status_update', {
              orderId: eventData.orderId,
              status: 'Preparing',
              message: `Payment successful! ${updatedOrder.restaurant.Name} is preparing your order.`
            });

            io.to(`restaurant_${updatedOrder.RestaurantID}`).emit('new_order_received', {
              orderId: eventData.orderId,
              message: "New paid order received!"
            });
          }
        }

        // ─── SCENARIO 2: DRIVER ASSIGNED ─────────────────────────────
        else if (topic === 'order-assigned') {
          console.log(`[Kafka] Order ${eventData.orderId} assigned to Driver ${eventData.driverId}`);

          let partner = await prisma.deliveryPartner.findUnique({
    where: { UserID: eventData.driverId } // eventData.driverId is actually a UserID!
});

          // ✨ Update the database with the Driver's ID, but leave status as 'Preparing'
          const updatedOrder = await prisma.orders.update({
            where: { OrderID: eventData.orderId },
            data: { 
              DeliveryPartnerID: partner.DeliveryPartnerID
              // Notice we DO NOT change OrderStatus here. It stays 'Preparing'
            }
          });

          // Optional: You can emit a generic socket event to the user's main app here 
          // (They are likely already getting the direct socket update on the Tracking Page)
          if (io) {
            io.to(`user_${updatedOrder.UserID}`).emit('order_status_update', {
              orderId: eventData.orderId,
              status: 'Driver Assigned',
              message: 'A delivery partner is heading to the restaurant!'
            });
          }
        }

        // Add this inside your consumer.run({ eachMessage: async ... }) block:

        // ─── SCENARIO 3: DRIVER UPDATES STATUS ───────────────────────
        else if (topic === 'order-status-changed') {
          console.log(`[Kafka] Order ${eventData.orderId} status changed to ${eventData.status}`);

          if (eventData.status === 'Delivered') {
            // --- THE PAYDAY LOGIC ---
            // You can make this dynamic based on distance later, but let's use a flat ₹45 fee for now
            const deliveryEarning = 45.00; 

            // We use a Prisma Transaction to ensure if one thing fails, everything rolls back
            await prisma.$transaction(async (tx) => {
              // 1. Update Order Status and log the earning on the order
              const finalOrder = await tx.orders.update({
                where: { OrderID: eventData.orderId },
                data: { 
                  OrderStatus: 'Delivered',
                  DeliveryPartnerEarning: deliveryEarning
                }
              });

              // 2. Add the money to the Driver's Wallet!
              await tx.user.update({
                where: { UserID: eventData.driverId },
                data: { WalletBalance: { increment: deliveryEarning } }
              });

              // 3. Create a Wallet Transaction Receipt
              await tx.walletTransaction.create({
                data: {
                  UserID: eventData.driverId,
                  Amount: deliveryEarning,
                  TransactionType: 'Credit',
                  Description: `Delivery Earning for Order #${eventData.orderId.slice(-6)}`
                }
              });

              // 4. Alert the User via WebSockets
              if (io) {
                io.to(`user_${finalOrder.UserID}`).emit('order_status_update', {
                  orderId: eventData.orderId,
                  status: 'Delivered',
                  message: 'Your food has arrived! Enjoy your meal.'
                });
              }
            });

            console.log(`💰 Driver ${eventData.driverId} earned ₹${deliveryEarning} for Order ${eventData.orderId}`);

          } else {
            // For 'PickedUp' or any other intermediate status
            await prisma.orders.update({
              where: { OrderID: eventData.orderId },
              data: { OrderStatus: eventData.status } 
            });
          }
        }

      } catch (error) {
        console.error(`[Kafka] Error processing message from topic ${topic}:`, error);
      }
    },
  });
};

module.exports = { connectConsumer };