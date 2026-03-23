// payment.controller.js (in Payment Service)
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { prisma } = require("database");
const { publishEvent } = require("../kafka/producer"); 

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-razorpay-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, paymentId } = req.body;

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (smallest currency unit)
      currency: "INR",
      receipt: paymentId, 
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/payments/verify

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, orderId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // 1. Update Payment Status to Success in Payment DB
      const updatedPayment = await prisma.payment.update({
        where: { PaymentID: paymentId },
        data: { 
          PaymentStatus: 'Success', 
          TransactionReference: razorpay_payment_id 
        },
        include: { user: true } // Include user if you need their details for the event
      });

      // 2. Publish Kafka Event to notify the Order Service
      await publishEvent("payment-success", {
        orderId: orderId,
        paymentId: paymentId,
        userId: updatedPayment.UserID,
        amount: updatedPayment.TotalAmount,
        transactionRef: razorpay_payment_id,
        timestamp: new Date().toISOString()
      });
      
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      await prisma.payment.update({
        where: { PaymentID: paymentId },
        data: { PaymentStatus: 'Failed' }
      });
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};