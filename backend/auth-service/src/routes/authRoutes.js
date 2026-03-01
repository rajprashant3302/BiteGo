// backend/auth-service/src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const profile = require("../controller/completeProfile");
const reset = require("../controller/resetPassword");

router.post("/register", authController.initiateRegistration);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

router.post("/reset-password", reset.resetPassword);                 
router.get("/reset-password", reset.showResetPasswordPage);          
router.post("/reset-password/confirm", reset.confirmResetPassword);

router.put("/update-profile", profile.updateProfile); // <-- Add this line

module.exports = router;