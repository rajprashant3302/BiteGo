const express = require("express");
const { verifyToken } = require('../middlewares/authMiddleware'); 
const driverController = require("../controllers/completeDetails");
const { updateOrderStatus } = require("../controllers/driverController");

const router = express.Router();
router.use(verifyToken);

router.get('/details', driverController.getDetails);
router.put('/details', driverController.updateDetails);
router.post('/details', driverController.createDetails);

router.patch("/:driverId/orders/:orderId/status", updateOrderStatus);

module.exports = router;