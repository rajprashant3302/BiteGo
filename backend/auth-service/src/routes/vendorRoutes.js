const express = require("express");
const router = express.Router();
const restaurantController = require("../controller/restaurantController");
const dashboardRoutes = require("./dashboardRoutes");

router.get("/restaurants/:userId", restaurantController.getOwnerRestaurants);
router.post("/restaurants/add", restaurantController.addRestaurant);
router.use("/dashboard", dashboardRoutes);

module.exports = router;