// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");

const {
    getUsers,
    getUserDetails,
    toggleUserBlock
} = require('../controller/adminController');


router.get('/', getUsers);

router.get('/:userId', authMiddleware,authorizeRoles("SuperAdmin"), getUserDetails);

router.patch('/:userId/toggle-status', authMiddleware,
    authorizeRoles("SuperAdmin"), toggleUserBlock);

module.exports = router;