const express = require('express');
const {createRazorpayOrder,verifyPayment}=require('../controllers/paymentController')
const router = express.Router();

router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/verify', verifyPayment);


module.exports = router;