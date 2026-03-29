const express = require('express');
const router = express.Router();
const { updateUserLocation, updateDriverLocation } = require('../controllers/locationController');

router.post('/user', updateUserLocation);
router.post('/driver', updateDriverLocation);

module.exports = router;