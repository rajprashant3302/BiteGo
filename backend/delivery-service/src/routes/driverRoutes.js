const express = require("express");
const { verifyToken } = require('../middlewares/authMiddleware'); 
const driverController = require("../controllers/completeDetails");

const router = express.Router();
router.use(verifyToken);

router.get('/details', driverController.getDetails);
router.put('/details', driverController.updateDetails);
router.post('/details', driverController.createDetails);

module.exports = router;