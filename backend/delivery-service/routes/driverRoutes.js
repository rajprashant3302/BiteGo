import express from 'express';
import { PrismaClient } from '@prisma/client';
// Assuming you have an auth middleware that sets req.user.id from the JWT
import { verifyToken } from '../middlewares/authMiddleware'; 

const prisma = new PrismaClient();
const router = express.Router();

router.use(verifyToken);

// ==========================================
// 1. VEHICLE DETAILS API
// ==========================================

// GET /api/driver/vehicle
router.get('/vehicle', async (req, res) => {
  try {
    // Find the delivery partner associated with the logged-in UserID [cite: 197]
    const driver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user.id } 
    });
    
    // Map DB's VehicleNumber to frontend's expected registrationNumber [cite: 198]
    res.json({ 
      vehicle: { 
        registrationNumber: driver?.VehicleNumber || '' 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// PUT /api/driver/vehicle
router.put('/vehicle', async (req, res) => {
  try {
    const { registrationNumber } = req.body; 

    // Find if the driver profile already exists
    const existingDriver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user.id }
    });

    if (existingDriver) {
      // Update existing driver's vehicle number [cite: 198]
      const updated = await prisma.deliveryPartner.update({
        where: { DeliveryPartnerID: existingDriver.DeliveryPartnerID }, // [cite: 196]
        data: { VehicleNumber: registrationNumber } 
      });
      res.json({ success: true, vehicle: { registrationNumber: updated.VehicleNumber } });
    } else {
      // Create new driver profile if it doesn't exist
      const newDriver = await prisma.deliveryPartner.create({
        data: {
          UserID: req.user.id, // [cite: 197]
          VehicleNumber: registrationNumber // [cite: 198]
        }
      });
      res.json({ success: true, vehicle: { registrationNumber: newDriver.VehicleNumber } });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update vehicle details" });
  }
});

// ==========================================
// 2. DOCUMENTS API
// ==========================================

// GET /api/driver/documents
router.get('/documents', async (req, res) => {
  try {
    const driver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user.id }
    });
    
    // Map DB's LicenseNumber to frontend's expected dlNumber [cite: 199]
    res.json({ 
      documents: { 
        dlNumber: driver?.LicenseNumber || '' 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// PUT /api/driver/documents
router.put('/documents', async (req, res) => {
  try {
    const { dlNumber } = req.body;

    const existingDriver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user.id }
    });

    if (existingDriver) {
      // Update existing driver's license number [cite: 199]
      const updated = await prisma.deliveryPartner.update({
        where: { DeliveryPartnerID: existingDriver.DeliveryPartnerID },
        data: { LicenseNumber: dlNumber } 
      });
      res.json({ success: true, documents: { dlNumber: updated.LicenseNumber } });
    } else {
      // Create new driver profile
      const newDriver = await prisma.deliveryPartner.create({
        data: {
          UserID: req.user.id, // [cite: 197]
          LicenseNumber: dlNumber // [cite: 199]
        }
      });
      res.json({ success: true, documents: { dlNumber: newDriver.LicenseNumber } });
    }
  } catch (error) {
    console.error(error);
    // Note: LicenseNumber has a UNIQUE constraint in the DB [cite: 199]
    // If a driver inputs a DL that exists, Prisma will throw a unique constraint error here.
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "This Driving License is already registered." });
    }
    res.status(500).json({ error: "Failed to update documents" });
  }
});

export default router;  