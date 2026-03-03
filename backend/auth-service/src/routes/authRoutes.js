// backend/auth-service/src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const profile = require("../controller/completeProfile");
const reset = require("../controller/resetPassword");
const addressController = require("../controller/addressController");
const vendorController = require("../controller/vendorController")

router.post("/register", authController.initiateRegistration);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

router.post("/reset-password", reset.resetPassword);                 
router.get("/reset-password", reset.showResetPasswordPage);          
router.post("/reset-password/confirm", reset.confirmResetPassword);

router.put("/update-profile", profile.updateProfile);
router.get("/profile/:userId", profile.getProfile);


router.get("/addresses/:userId", addressController.getAddresses);
router.post("/addresses/add", addressController.addAddress);
router.put("/addresses/:addressId", addressController.updateAddress);
router.delete("/addresses/:addressId", addressController.deleteAddress);


router.get("/partner/business-details/:userId", vendorController.getBusinessDetails);
router.post("/partner/business-details",vendorController.saveBusinessDetails);

module.exports = router;