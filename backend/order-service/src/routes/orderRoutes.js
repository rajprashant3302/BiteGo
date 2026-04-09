const express = require("express");
const {
  placeOrder,
  getOrders,
  getVendorOrders,
  getOrderById,
  updateOrderStatus,
  updateVendorOrderStatus,
  getInvoiceData,
  saveInvoiceUrl
} = require("../controller/orderController");
const { validateCoupon } = require("../controller/couponController");

const router = express.Router();

router.post("/place-order", placeOrder);

router.get("/user/:userId", getOrders);
router.get("/vendor/:restaurantId", getVendorOrders);

router.get("/:orderId", getOrderById);

router.patch("/:orderId/status", updateOrderStatus);
router.patch("/:orderId/vendor-status", updateVendorOrderStatus);

router.get("/:orderId/invoice-check", getInvoiceData);
router.post("/invoice/save", saveInvoiceUrl);

router.post("/coupons/validate", validateCoupon);

module.exports = router;