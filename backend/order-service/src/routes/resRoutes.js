const express = require("express");
const router = express.Router();
const resController = require("../controller/restaurantController");

router.get("/", resController.getAllRestaurants);


module.exports = router;