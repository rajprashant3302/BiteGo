const { prisma } = require("database");
const { publishEvent } = require("../kafka/producer");

exports.placeOrder = async (req, res) => {
  const { userId, items, addressId, useWallet, paymentMethod, restaurantId, couponCode } = req.body;

  try {
    // ── STEP 1: PRE-FETCH (OUTSIDE TRANSACTION) ──────────────────
    // Moving these out reduces the time the transaction stays open.
    const [dbItems, activeOffers, userProfile] = await Promise.all([
      prisma.menuItem.findMany({
        where: { ItemID: { in: items.map(i => i.id || i.ItemID) } }
      }),
      prisma.offer.findMany({
        where: {
          RestaurantID: restaurantId,
          IsActive: true,
          EndTime: { gte: new Date() }
        },
        include: { applicableItems: true }
      }),
      prisma.user.findUnique({ where: { UserID: userId } })
    ]);

    if (!userProfile) throw new Error("User not found");

    // ── STEP 2: CALCULATIONS (CPU LOGIC) ─────────────────────────
    let subtotal = 0;
    const processedItems = items.map(cartItem => {
      const dbItem = dbItems.find(d => d.ItemID === (cartItem.id || cartItem.ItemID));
      if (!dbItem) throw new Error(`Item ${cartItem.ItemName || 'selected'} no longer available`);

      const basePrice = Number(dbItem.Price);
      const itemOffer = activeOffers.find(o => o.applicableItems.some(ai => ai.MenuItemID === dbItem.ItemID));
      const storeOffer = activeOffers.find(o => o.applicableItems.length === 0);
      const bestOffer = itemOffer || storeOffer;

      let finalPrice = basePrice;
      if (bestOffer) {
        if (bestOffer.DiscountType === "Percentage") {
          let discount = basePrice * (Number(bestOffer.DiscountValue) / 100);
          if (bestOffer.MaxDiscount) discount = Math.min(discount, Number(bestOffer.MaxDiscount));
          finalPrice -= discount;
        } else {
          finalPrice -= Number(bestOffer.DiscountValue);
        }
      }

      const itemTotal = Math.max(0, finalPrice) * cartItem.quantity;
      subtotal += itemTotal;

      return {
        ItemID: dbItem.ItemID,
        Quantity: cartItem.quantity,
        ItemPrice: Math.max(0, finalPrice)
      };
    });

    // ── STEP 3: DATABASE TRANSACTION (WRITE ONLY) ───────────────
    const result = await prisma.$transaction(async (tx) => {
      let totalAfterCoupon = subtotal;
      let appliedCouponId = null;

      // Coupon Validation inside transaction to prevent race conditions
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { CouponCode: couponCode, IsActive: true }
        });

        if (!coupon || (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date())) {
          throw new Error("Invalid or expired coupon code");
        }

        const couponDiscount = coupon.DiscountType === "Percentage" 
          ? totalAfterCoupon * (Number(coupon.DiscountValue) / 100)
          : Number(coupon.DiscountValue);

        totalAfterCoupon = Math.max(0, totalAfterCoupon - couponDiscount);
        appliedCouponId = coupon.CouponID;
      }

      // Wallet logic
      let walletDeduction = 0;
      if (useWallet) {
        walletDeduction = Math.min(Number(userProfile.WalletBalance), totalAfterCoupon);
        if (walletDeduction > 0) {
          await tx.user.update({
            where: { UserID: userId },
            data: { WalletBalance: { decrement: walletDeduction } }
          });

          await tx.walletTransaction.create({
            data: {
              UserID: userId,
              Amount: walletDeduction,
              TransactionType: "Debit",
              Description: "Order payment split"
            }
          });
        }
      }

      const remainingAmount = totalAfterCoupon - walletDeduction;

      // Create Order
      const order = await tx.orders.create({
        data: {
          UserID: userId,
          RestaurantID: restaurantId,
          AddressID: addressId,
          TotalAmount: totalAfterCoupon,
          OrderStatus: "Placed",
          items: { create: processedItems },
          ...(appliedCouponId && {
            couponUsages: { create: { CouponID: appliedCouponId, UserID: userId } }
          })
        }
      });

      // Payment records
      if (walletDeduction > 0) {
        await tx.payment.create({
          data: {
            OrderID: order.OrderID,
            UserID: userId,
            TotalAmount: walletDeduction,
            PaymentMethod: "Wallet",
            PaymentStatus: "Success"
          }
        });
      }

      let secondaryPayment = null;
      if (remainingAmount > 0) {
        secondaryPayment = await tx.payment.create({
          data: {
            OrderID: order.OrderID,
            UserID: userId,
            TotalAmount: remainingAmount,
            PaymentMethod: paymentMethod === "online" ? "UPI" : "COD",
            PaymentStatus: "Pending"
          }
        });
      }

      return { order, secondaryPayment, remainingAmount };
    }, {
      maxWait: 5000, // Wait up to 5s for a connection
      timeout: 10000  // Allow the transaction 10s to finish
    });

    // ── STEP 4: KAFKA (POST-TRANSACTION) ─────────────────────────
    if (result.remainingAmount > 0 && paymentMethod === "online") {
      await publishEvent("payment-initiated", {
        orderId: result.order.OrderID,
        amount: result.remainingAmount,
        userId: userId,
        paymentId: result.secondaryPayment.PaymentID
      });
    }

    res.status(201).json({ success: true, orderId: result.order.OrderID });

  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ── GET ALL ORDERS FOR A USER ──────────────────────────────────
// URL: /api/orders/user/:userId
exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await prisma.orders.findMany({
      where: { UserID: userId },
      include: {
        restaurant: {
          select: { Name: true, CategoryName: true }
        },
        items: {
          include: { item: { select: { ItemName: true } } }
        }
      },
      orderBy: { OrderDateTime: 'desc' }
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── GET ORDER DETAILS & TRACKING ───────────────────────────────
// URL: /api/orders/:orderId
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.orders.findUnique({
      where: { OrderID: orderId },
      include: {
        restaurant: true,
        items: { include: { item: true } },
        address: true,
        payments: true, // Returns the array of payments (Wallet + UPI etc)
        deliveryPartner: {
          include: { user: { select: { Name: true, Phone: true, ProfilePicURL: true } } }
        }
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // --- TRACKING LOGIC ---
    // Mapping the Enum to progress steps for the frontend
    const statusMap = {
      'Placed': 1,
      'Preparing': 2,
      'PickedUp': 3,
      'Delivered': 4,
      'Cancelled': 0
    };

    const tracking = {
      currentStatus: order.OrderStatus,
      step: statusMap[order.OrderStatus] || 0,
      isCancelled: order.OrderStatus === 'Cancelled',
      // UI labels for the tracking stepper
      steps: [
        { label: "Confirmed", time: order.OrderDateTime },
        { label: "Kitchen is preparing", isActive: statusMap[order.OrderStatus] >= 2 },
        { label: "Out for delivery", isActive: statusMap[order.OrderStatus] >= 3 },
        { label: "Arrived", isActive: statusMap[order.OrderStatus] >= 4 }
      ]
    };

    res.status(200).json({ ...order, tracking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── UPDATE ORDER STATUS ────────────────────────────────────────
// URL: PATCH /api/orders/:orderId/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // e.g., "Preparing", "PickedUp", "Delivered"

    const updatedOrder = await prisma.orders.update({
      where: { OrderID: orderId },
      data: { OrderStatus: status },
      include: { user: { select: { UserID: true } } }
    });

    // --- SOCKET EMIT ---
    // Assuming 'io' is attached to the 'req' object in index.js
    const io = req.app.get('socketio');
    io.to(`user_${updatedOrder.UserID}`).emit('order_status_update', {
      orderId: updatedOrder.OrderID,
      status: updatedOrder.OrderStatus,
      message: `Your order is now ${updatedOrder.OrderStatus}!`
    });

    res.status(200).json({ success: true, status: updatedOrder.OrderStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
        invoice: true, // Check if invoice record exists
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // If invoice exists in DB, return the URL immediately
    if (order.invoice?.PDFUrl) {
      return res.status(200).json({ url: order.invoice.PDFUrl, exists: true });
    }

    // If no invoice, return order details so frontend can generate and upload
    res.status(200).json({ order, exists: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// After frontend uploads to Cloudinary, it calls this to save the URL
exports.saveInvoiceUrl = async (req, res) => {
  const { orderId, pdfUrl } = req.body;
  try {
    const invoice = await prisma.invoice.create({
      data: {
        OrderID: orderId,
        PDFUrl: pdfUrl,
      }
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};