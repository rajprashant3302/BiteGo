const { prisma } = require("database");
const { publishEvent } = require("../kafka/producer");
const { createOrderNotification } = require("./notificationController");



// ==========================================
// PLACE ORDER LOGIC
// ==========================================
exports.placeOrder = async (req, res) => {
  const {
    userId,
    items,
    addressId,
    useWallet,
    paymentMethod,
    restaurantId,
    couponCode,
  } = req.body;

  try {
    const normalizedPaymentMethod = String(paymentMethod || "").toLowerCase();

    // 1. Fetch Items, User, Restaurant, and NEW AdminOffers in parallel
    const currentDate = new Date();
    const [dbItems, userProfile, restaurant, rawOffers] = await Promise.all([
      prisma.menuItem.findMany({
        where: { ItemID: { in: items.map((i) => i.id || i.ItemID) } },
      }),
      prisma.user.findUnique({ where: { UserID: userId } }),
      prisma.restaurant.findUnique({
        where: { RestaurantID: restaurantId },
        select: { RestaurantID: true, Name: true },
      }),
      // Fetch AUTOMATIC offers OR the specific manually entered code
      prisma.adminOffer.findMany({
        where: {
          IsActive: true,
          StartTime: { lte: currentDate },
          EndTime: { gte: currentDate },
          OR: [
            { Type: 'AUTOMATIC' },
            ...(couponCode ? [{ PromoCode: couponCode.toUpperCase() }] : [])
          ]
        },
        include: { TargetedUsers: true }, // CRITICAL: Needed for PRIVATE offers whitelist
        orderBy: { Priority: 'desc' } // Highest priority evaluates first
      })
    ]);

    if (!userProfile) throw new Error("User not found");
    if (!restaurant) throw new Error("Restaurant not found");

    // 1.5 TARGETING ENGINE VERIFICATION (Backend Security Check)
    const potentialOffers = rawOffers.filter((offer) => {
      // A. Check Dynamic JSON Rules
      if (offer.TargetSegment) {
        const rules = typeof offer.TargetSegment === 'string' ? JSON.parse(offer.TargetSegment) : offer.TargetSegment;

        if (rules.is_premium && !userProfile.IsPremium) return false;
        if (rules.role && rules.role !== userProfile.Role) return false;
        if (rules.zoneId && rules.zoneId !== userProfile.ZoneID) return false;
      }

      // B. Check PRIVATE Whitelists
      if (offer.Visibility === 'PRIVATE') {
        const isWhitelisted = offer.TargetedUsers?.some((tu) => tu.UserID === userId);
        if (!isWhitelisted) return false;
      }

      return true;
    });

    // 2. Calculate Base Item Subtotal
    let subtotal = 0;
    const processedItems = items.map((cartItem) => {
      const dbItem = dbItems.find((d) => d.ItemID === (cartItem.id || cartItem.ItemID));
      if (!dbItem) throw new Error(`Item no longer available`);

      const itemTotal = Number(dbItem.Price) * cartItem.quantity;
      subtotal += itemTotal;

      return {
        ItemID: dbItem.ItemID,
        Quantity: cartItem.quantity,
        ItemPrice: Number(dbItem.Price),
      };
    });

    // 3. Stacking & Validation Engine (The Verification Step)
    let totalDiscount = 0;
    let isFreeDelivery = false;
    let currentTotal = subtotal;
    const appliedOffers = [];

    for (const offer of potentialOffers) {
      // Validate Min Order Value
      if (offer.MinOrderValue && currentTotal < Number(offer.MinOrderValue)) continue;

      // Validate Global Redemption Limits
      if (offer.TotalRedemptionLimit && offer.CurrentRedemptionCount >= offer.TotalRedemptionLimit) continue;

      if (offer.RewardType === 'FreeDelivery') {
        isFreeDelivery = true;
        appliedOffers.push({ offer, appliedAmount: 0 });
      }

      else if (offer.RewardType === 'DiscountOnOrder') {
        let discount = 0;
        if (offer.DiscountType === 'Percentage') {
          discount = currentTotal * (Number(offer.RewardValue) / 100);
          if (offer.MaxDiscount) discount = Math.min(discount, Number(offer.MaxDiscount));
        } else {
          discount = Number(offer.RewardValue);
        }

        discount = Math.min(discount, currentTotal); // Prevent negative cart

        if (discount > 0) {
          currentTotal -= discount;
          totalDiscount += discount;
          appliedOffers.push({ offer, appliedAmount: discount });
        }
      }

      // If an offer isn't stackable, halt evaluating further deals
      if (!offer.IsStackable) break;
    }

    // Add Delivery Fee if FreeDelivery wasn't granted and subtotal is below threshold
    const deliveryFee = (isFreeDelivery || subtotal >= 299) ? 0 : 50;
    let finalPayable = currentTotal + deliveryFee;

    // 4. Secure Database Transaction
    const result = await prisma.$transaction(
      async (tx) => {
        let walletDeduction = 0;

        // A. Wallet Logic
        if (useWallet) {
          walletDeduction = Math.min(Number(userProfile.WalletBalance), finalPayable);

          if (walletDeduction > 0) {
            await tx.user.update({
              where: { UserID: userId },
              data: { WalletBalance: { decrement: walletDeduction } },
            });

            await tx.walletTransaction.create({
              data: {
                UserID: userId,
                Amount: walletDeduction,
                TransactionType: "Debit",
                Description: "Order payment split",
              },
            });
          }
        }

        const remainingAmount = finalPayable - walletDeduction;

        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // B. Create the Base Order
        const order = await tx.orders.create({
          data: {
            UserID: userId,
            RestaurantID: restaurantId,
            AddressID: addressId,
            TotalAmount: finalPayable,
            DeliveryOTP: deliveryOtp,
            OrderStatus: "Placed",
            items: { create: processedItems },
          },
        });

        // C. Record Redemption History (Crucial Step)
        for (const applied of appliedOffers) {
          await tx.adminOfferRedemption.create({
            data: {
              AdminOfferID: applied.offer.OfferID,
              TargetEntityId: userId,
              TargetType: "User",
              RewardDelivered: true,
              RedemptionStatus: "Success",
              OrderID: order.OrderID,
              Metadata: {
                discountApplied: applied.appliedAmount,
                rewardType: applied.offer.RewardType
              }
            }
          });

          // Increment global usage counter
          await tx.adminOffer.update({
            where: { OfferID: applied.offer.OfferID },
            data: { CurrentRedemptionCount: { increment: 1 } }
          });
        }

        // D. Handle Payments
        if (walletDeduction > 0) {
          await tx.payment.create({
            data: {
              OrderID: order.OrderID,
              UserID: userId,
              TotalAmount: walletDeduction,
              PaymentMethod: "Wallet",
              PaymentStatus: "Success",
            },
          });
        }

        let secondaryPayment = null;
        if (remainingAmount > 0) {
          secondaryPayment = await tx.payment.create({
            data: {
              OrderID: order.OrderID,
              UserID: userId,
              TotalAmount: remainingAmount,
              PaymentMethod: normalizedPaymentMethod === "online" ? "UPI" : "COD",
              PaymentStatus: "Pending",
            },
          });
        }

        return { order, secondaryPayment, remainingAmount, appliedOffers };
      },
      { maxWait: 5000, timeout: 10000 }
    );

    // 5. Fire Domain Events via Kafka
    if (result.remainingAmount > 0 && normalizedPaymentMethod === "online") {
      await publishEvent("payment-initiated", {
        orderId: result.order.OrderID,
        amount: result.remainingAmount,
        userId,
        paymentId: result.secondaryPayment?.PaymentID,
      });
    } else if (result.remainingAmount === 0 || normalizedPaymentMethod === "cod") {
      await publishEvent("order-confirmed", {
        orderId: result.order.OrderID,
        restaurantId,
        userId,
        addressId,
        status: "Preparing",
      });
    }

    // Publish Custom Promotion Event for analytics/fraud-detection
    for (const applied of result.appliedOffers) {
      await publishEvent("offer-redeemed", {
        offerId: applied.offer.OfferID,
        userId: userId,
        orderId: result.order.OrderID,
        discountGiven: applied.appliedAmount,
        timestamp: new Date().toISOString()
      });
    }

    // 6. Notify downstream UI/Sockets
    await createOrderNotification({
      orderId: result.order.OrderID,
      customerName: userProfile.Name || "Customer",
      branch: restaurant.Name || "Restaurant",
      amount: Number(result.order.TotalAmount),
    });

    const io = req.app.get("socketio");
    if (io && restaurantId) {
      io.to(`restaurant_${restaurantId}`).emit("new_vendor_order", {
        orderId: result.order.OrderID,
        restaurantId,
        customerName: userProfile.Name || "Customer",
        amount: Number(result.order.TotalAmount),
        status: "Placed",
      });
    }

    res.status(201).json({
      success: true,
      orderId: result.order.OrderID,
      remainingAmount: result.remainingAmount,
      paymentId: result.secondaryPayment ? result.secondaryPayment.PaymentID : null,
    });

  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// exports.placeOrder = async (req, res) => {
//   const {
//     userId,
//     items,
//     addressId,
//     useWallet,
//     paymentMethod,
//     restaurantId,
//     couponCode,
//   } = req.body;

//   try {
//     const normalizedPaymentMethod = String(paymentMethod || "").toLowerCase();

//     const [dbItems, activeOffers, userProfile, restaurant] = await Promise.all([
//       prisma.menuItem.findMany({
//         where: { ItemID: { in: items.map((i) => i.id || i.ItemID) } },
//       }),
//       prisma.offer.findMany({
//         where: {
//           RestaurantID: restaurantId,
//           IsActive: true,
//           EndTime: { gte: new Date() },
//         },
//         include: { applicableItems: true },
//       }),
//       prisma.user.findUnique({ where: { UserID: userId } }),
//       prisma.restaurant.findUnique({
//         where: { RestaurantID: restaurantId },
//         select: { RestaurantID: true, Name: true },
//       }),
//     ]);

//     if (!userProfile) throw new Error("User not found");
//     if (!restaurant) throw new Error("Restaurant not found");

//     let subtotal = 0;

//     const processedItems = items.map((cartItem) => {
//       const dbItem = dbItems.find(
//         (d) => d.ItemID === (cartItem.id || cartItem.ItemID)
//       );

//       if (!dbItem) {
//         throw new Error(
//           `Item ${cartItem.ItemName || "selected"} no longer available`
//         );
//       }

//       const basePrice = Number(dbItem.Price);
//       const itemOffer = activeOffers.find((o) =>
//         o.applicableItems.some((ai) => ai.MenuItemID === dbItem.ItemID)
//       );
//       const storeOffer = activeOffers.find((o) => o.applicableItems.length === 0);
//       const bestOffer = itemOffer || storeOffer;

//       let finalPrice = basePrice;

//       if (bestOffer) {
//         if (bestOffer.DiscountType === "Percentage") {
//           let discount =
//             basePrice * (Number(bestOffer.DiscountValue) / 100);

//           if (bestOffer.MaxDiscount) {
//             discount = Math.min(discount, Number(bestOffer.MaxDiscount));
//           }

//           finalPrice -= discount;
//         } else {
//           finalPrice -= Number(bestOffer.DiscountValue);
//         }
//       }

//       const itemTotal = Math.max(0, finalPrice) * cartItem.quantity;
//       subtotal += itemTotal;

//       return {
//         ItemID: dbItem.ItemID,
//         Quantity: cartItem.quantity,
//         ItemPrice: Math.max(0, finalPrice),
//       };
//     });

//     const result = await prisma.$transaction(
//       async (tx) => {
//         let totalAfterCoupon = subtotal;
//         let appliedCouponId = null;

//         if (couponCode) {
//           const coupon = await tx.coupon.findUnique({
//             where: { CouponCode: couponCode, IsActive: true },
//           });

//           if (
//             !coupon ||
//             (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date())
//           ) {
//             throw new Error("Invalid or expired coupon code");
//           }

//           const couponDiscount =
//             coupon.DiscountType === "Percentage"
//               ? totalAfterCoupon * (Number(coupon.DiscountValue) / 100)
//               : Number(coupon.DiscountValue);

//           totalAfterCoupon = Math.max(0, totalAfterCoupon - couponDiscount);
//           appliedCouponId = coupon.CouponID;
//         }

//         let walletDeduction = 0;

//         if (useWallet) {
//           walletDeduction = Math.min(
//             Number(userProfile.WalletBalance),
//             totalAfterCoupon
//           );

//           if (walletDeduction > 0) {
//             await tx.user.update({
//               where: { UserID: userId },
//               data: { WalletBalance: { decrement: walletDeduction } },
//             });

//             await tx.walletTransaction.create({
//               data: {
//                 UserID: userId,
//                 Amount: walletDeduction,
//                 TransactionType: "Debit",
//                 Description: "Order payment split",
//               },
//             });
//           }
//         }

//         const remainingAmount = totalAfterCoupon - walletDeduction;

//         const order = await tx.orders.create({
//           data: {
//             UserID: userId,
//             RestaurantID: restaurantId,
//             AddressID: addressId,
//             TotalAmount: totalAfterCoupon,
//             OrderStatus: "Placed",
//             items: { create: processedItems },
//             ...(appliedCouponId && {
//               couponUsages: {
//                 create: {
//                   CouponID: appliedCouponId,
//                   UserID: userId,
//                 },
//               },
//             }),
//           },
//         });

//         if (walletDeduction > 0) {
//           await tx.payment.create({
//             data: {
//               OrderID: order.OrderID,
//               UserID: userId,
//               TotalAmount: walletDeduction,
//               PaymentMethod: "Wallet",
//               PaymentStatus: "Success",
//             },
//           });
//         }

//         let secondaryPayment = null;

//         if (remainingAmount > 0) {
//           secondaryPayment = await tx.payment.create({
//             data: {
//               OrderID: order.OrderID,
//               UserID: userId,
//               TotalAmount: remainingAmount,
//               PaymentMethod:
//                 normalizedPaymentMethod === "online" ? "UPI" : "COD",
//               PaymentStatus: "Pending",
//             },
//           });
//         }

//         return { order, secondaryPayment, remainingAmount };
//       },
//       {
//         maxWait: 5000,
//         timeout: 10000,
//       }
//     );

//     if (result.remainingAmount > 0 && normalizedPaymentMethod === "online") {
//       await publishEvent("payment-initiated", {
//         orderId: result.order.OrderID,
//         amount: result.remainingAmount,
//         userId,
//         paymentId: result.secondaryPayment?.PaymentID,
//       });
//     } else if (
//       result.remainingAmount === 0 ||
//       normalizedPaymentMethod === "cod"
//     ) {
//       await publishEvent("order-confirmed", {
//         orderId: result.order.OrderID,
//         restaurantId,
//         userId,
//         addressId,
//         status: "Preparing",
//       });
//     }

//     await createOrderNotification({
//       orderId: result.order.OrderID,
//       customerName: userProfile.Name || "Customer",
//       branch: restaurant.Name || "Restaurant",
//       amount: Number(result.order.TotalAmount || subtotal),
//     });

//     const io = req.app.get("socketio");
//     if (io && restaurantId) {
//       io.to(`restaurant_${restaurantId}`).emit("new_vendor_order", {
//         orderId: result.order.OrderID,
//         restaurantId,
//         customerName: userProfile.Name || "Customer",
//         amount: Number(result.order.TotalAmount || subtotal),
//         status: "Placed",
//       });
//     }

//     res.status(201).json({
//       success: true,
//       orderId: result.order.OrderID,
//       remainingAmount: result.remainingAmount,
//       paymentId: result.secondaryPayment ? result.secondaryPayment.PaymentID : null,
//     });
//   } catch (error) {
//     console.error("Order Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await prisma.orders.findMany({
      where: { UserID: userId },
      include: {
        restaurant: {
          select: { Name: true, CategoryName: true },
        },
        items: {
          include: { item: { select: { ItemName: true } } },
        },
      },
      orderBy: { OrderDateTime: "desc" },
    });
    

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getVendorOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const orders = await prisma.orders.findMany({
      where: {
        RestaurantID: restaurantId,
        OrderStatus: {
          in: ["Placed", "Preparing", "Prepared"],
        },
      },
      include: {
        user: {
          select: {
            UserID: true,
            Name: true,
            Email: true,
            Phone: true,
          },
        },
        address: true,
        payments: true,
        items: {
          include: {
            item: {
              select: {
                ItemID: true,
                ItemName: true,
              },
            },
          },
        },
        restaurant: {
          select: {
            RestaurantID: true,
            Name: true,
          },
        },
      },
      orderBy: { OrderDateTime: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
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
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("getVendorOrders error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// exports.getOrderById = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await prisma.orders.findUnique({
//       where: { OrderID: orderId },
//       include: {
//         restaurant: true,
//         items: { include: { item: true } },
//         address: true,
//         payments: true,
//         deliveryPartner: {
//           include: {
//             user: {
//               select: { Name: true, Phone: true, ProfilePicURL: true },
//             },
//           },
//         },
//       },
//     });

//     if (!order) return res.status(404).json({ message: "Order not found" });

//     const statusMap = {
//       Placed: 1,
//       Preparing: 2,
//       Prepared: 2,
//       PickedUp: 3,
//       Delivered: 4,
//       Cancelled: 0,
//     };

//     const tracking = {
//       currentStatus: order.OrderStatus,
//       step: statusMap[order.OrderStatus] || 0,
//       isCancelled: order.OrderStatus === "Cancelled",
//       steps: [
//         { label: "Confirmed", time: order.OrderDateTime },
//         {
//           label: "Kitchen is preparing",
//           isActive: statusMap[order.OrderStatus] >= 2,
//         },
//         {
//           label: "Out for delivery",
//           isActive: statusMap[order.OrderStatus] >= 3,
//         },
//         {
//           label: "Arrived",
//           isActive: statusMap[order.OrderStatus] >= 4,
//         },
//       ],
//     };

//     res.status(200).json({ ...order, tracking });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.orders.findUnique({
      where: { OrderID: orderId },
      include: {
        restaurant: true,
        items: { include: { item: true } },
        address: true,
        payments: true,
        user: { 
          select: { Name: true, Phone: true } 
        },
        deliveryPartner: {
          include: {
            user: { select: { Name: true, Phone: true, ProfilePicURL: true } },
          },
        },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // CRITICAL NEW CODE: Fetch the redemption data for this specific order
    const redemptions = await prisma.adminOfferRedemption.findMany({
      where: { OrderID: orderId },
      include: {
        adminOffer: {
          select: { Title: true, PromoCode: true, RewardType: true }
        }
      }
    });

    const statusMap = {
      Placed: 1, Preparing: 2, Prepared: 2,
      PickedUp: 3, Delivered: 4, Cancelled: 0,
    };

    const tracking = {
      currentStatus: order.OrderStatus,
      step: statusMap[order.OrderStatus] || 0,
      isCancelled: order.OrderStatus === "Cancelled",
      steps: [
        { label: "Confirmed", time: order.OrderDateTime },
        { label: "Kitchen is preparing", isActive: statusMap[order.OrderStatus] >= 2 },
        { label: "Out for delivery", isActive: statusMap[order.OrderStatus] >= 3 },
        { label: "Arrived", isActive: statusMap[order.OrderStatus] >= 4 },
      ],
    };

    // Attach redemptions to the payload sent to the frontend
    res.status(200).json({ ...order, tracking, redemptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await prisma.orders.update({
      where: { OrderID: orderId },
      data: { OrderStatus: status },
      include: { user: { select: { UserID: true } } },
    });

    const io = req.app.get("socketio");

    if (io) {
      io.to(`user_${updatedOrder.UserID}`).emit("order_status_update", {
        orderId: updatedOrder.OrderID,
        status: updatedOrder.OrderStatus,
        message: `Your order is now ${updatedOrder.OrderStatus}!`,
      });

      if (updatedOrder.RestaurantID) {
        io.to(`restaurant_${updatedOrder.RestaurantID}`).emit(
          "vendor_order_status_updated",
          {
            orderId: updatedOrder.OrderID,
            status: updatedOrder.OrderStatus,
          }
        );
      }
    }

    res.status(200).json({ success: true, status: updatedOrder.OrderStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateVendorOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, restaurantId } = req.body;

    if (!["Preparing", "Prepared"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor status",
      });
    }

    const order = await prisma.orders.findUnique({
      where: { OrderID: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (restaurantId && order.RestaurantID !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this order",
      });
    }

    const updatedOrder = await prisma.orders.update({
      where: { OrderID: orderId },
      data: { OrderStatus: status },
      include: {
        user: { select: { UserID: true, Name: true } },
        restaurant: { select: { RestaurantID: true, Name: true } },
      },
    });

    const io = req.app.get("socketio");

    if (io) {
      io.to(`restaurant_${updatedOrder.RestaurantID}`).emit(
        "vendor_order_status_updated",
        {
          orderId: updatedOrder.OrderID,
          status: updatedOrder.OrderStatus,
        }
      );

      io.to(`user_${updatedOrder.UserID}`).emit("order_status_update", {
        orderId: updatedOrder.OrderID,
        status: updatedOrder.OrderStatus,
        message: `Your order is now ${updatedOrder.OrderStatus}!`,
      });
    }

    res.status(200).json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("updateVendorOrderStatus error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getInvoiceData = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.orders.findUnique({
      where: { OrderID: orderId },
      include: {
        user: true,
        restaurant: true,
        items: { include: { item: true } },
        invoice: true,
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.invoice?.PDFUrl) {
      return res.status(200).json({ url: order.invoice.PDFUrl, exists: true });
    }

    res.status(200).json({ order, exists: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveInvoiceUrl = async (req, res) => {
  const { orderId, pdfUrl } = req.body;

  try {
    const invoice = await prisma.invoice.create({
      data: {
        OrderID: orderId,
        PDFUrl: pdfUrl,
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
