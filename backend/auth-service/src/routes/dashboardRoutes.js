const express = require("express");
const dashboardController = require("../controller/dashboardController");

const router = express.Router();

router.get("/:userId/overview", dashboardController.getOverview);
router.get("/:userId/restaurants", dashboardController.getRestaurants);
router.get("/:userId/orders", dashboardController.getOrders);
router.get("/:userId/reviews", dashboardController.getReviews);
router.get("/:userId/analytics", dashboardController.getAnalytics);
router.get("/:userId/payouts", dashboardController.getPayouts);

module.exports = router;
