// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const {
    getUsers,
    getUserDetails,
    toggleUserBlock,
    // Add the new restaurant controllers here:
    getRestaurants,
    getRestaurantDetails,
    toggleRestaurantBlock,
    getOrders,
    getOrderDetails,
    updateOrderStatus
} = require('../controller/adminController');

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================
router.get('/', getUsers);
router.get('/:userId', authMiddleware, authorizeRoles("SuperAdmin"), getUserDetails);
router.patch('/:userId/toggle-status', authMiddleware, authorizeRoles("SuperAdmin"), toggleUserBlock);

// ==========================================
// RESTAURANT MANAGEMENT ROUTES 
// (For the Admin Dashboard)
// ==========================================

// 1. Get all restaurants for the admin table
// Note: The path here will be /api/users/restaurants/all (assuming this router is mounted at /api/users)
router.get('/restaurants/all', authMiddleware, authorizeRoles("SuperAdmin"), getRestaurants);

// 2. Get specific restaurant details for the slide-over panel
router.get('/restaurants/:restaurantId', authMiddleware, authorizeRoles("SuperAdmin"), getRestaurantDetails);

// 3. Toggle restaurant Active/Suspended status
router.patch('/restaurants/:restaurantId/toggle-status', authMiddleware, authorizeRoles("SuperAdmin"), toggleRestaurantBlock);


// ==========================================
// ORDER MANAGEMENT ROUTES (Admin)
// ==========================================
router.get('/orders/all', authMiddleware, authorizeRoles("SuperAdmin"), getOrders);
router.get('/orders/:orderId', authMiddleware, authorizeRoles("SuperAdmin"), getOrderDetails);
router.patch('/orders/:orderId/status', authMiddleware, authorizeRoles("SuperAdmin"), updateOrderStatus);

module.exports = router;

