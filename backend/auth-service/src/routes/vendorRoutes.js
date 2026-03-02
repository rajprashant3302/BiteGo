const express = require("express");
const router = express.Router();
const restaurantController = require("../controller/restaurantController")

router.get("/restaurants/:userId", restaurantController.getOwnerRestaurants);
router.post("/restaurants/add", restaurantController.addRestaurant);

module.exports = router;