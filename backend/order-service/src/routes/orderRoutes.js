const express = require('express');
const { placeOrder ,getOrders, getOrderById ,updateOrderStatus ,getInvoiceData,saveInvoiceUrl} = require('../controller/orderController');
const { validateCoupon  } = require('../controller/couponController');

const router = express.Router();

router.post('/place-order', placeOrder);
router.get('/user/:userId', getOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);

router.get('/:orderId/invoice-check',getInvoiceData);
router.post('/invoice/save',saveInvoiceUrl)

router.post('/coupons/validate', validateCoupon);

module.exports = router;