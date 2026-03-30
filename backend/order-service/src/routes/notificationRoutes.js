const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markNotificationAsRead);

module.exports = router;