const express = require("express");
const router = express.Router();
const menuController = require("../controller/menuController");

router.get("/:restaurantId", menuController.getMenu);
router.post("/add", menuController.addMenuItem);
router.put("/edit/:itemId", menuController.updateMenuItem);
router.delete("/:itemId", menuController.deleteMenuItem);

module.exports = router;