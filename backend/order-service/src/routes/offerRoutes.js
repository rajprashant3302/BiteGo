// routes/offer.routes.js
const express = require('express');
const router = express.Router();
const offerController = require('../controller/offerController');

// POST /api/offers/add
router.post('/add', offerController.createOffer);

// GET /api/offers/restaurant/:restaurantId
router.get('/restaurant/:restaurantId', offerController.getRestaurantOffers);

// PUT /api/offers/:offerId
router.put('/:offerId', offerController.updateOffer);

// DELETE /api/offers/:offerId
router.delete('/:offerId', offerController.deleteOffer);

module.exports = router;