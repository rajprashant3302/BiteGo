const {prisma} = require('database');

// GET /api/driver/details
exports.getDetails = async (req, res) => {
  try {
    // Find the delivery partner associated with the logged-in UserID
    console.log("UserId ",req.user?.id)
    const driver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user?.id } 
    });
    
    // Map DB fields to frontend's expected properties
    res.json({ 
      details: { 
        dlNumber: driver?.LicenseNumber || '',
        registrationNumber: driver?.VehicleNumber || '' 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

// POST /api/driver/details
exports.createDetails = async (req, res) => {
  try {
    const { dlNumber, registrationNumber } = req.body; 

    // Find if the driver profile already exists
    const existingDriver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user.id }
    });

    if (existingDriver) {
      return res.status(400).json({ error: "Driver profile already exists. Use PUT to update." });
    }

    // Create new driver profile
    const newDriver = await prisma.deliveryPartner.create({
      data: {
        UserID: req.user?.id,
        LicenseNumber: dlNumber,
        VehicleNumber: registrationNumber
      }
    });

    return res.status(201).json({ 
      success: true, 
      details: { 
        dlNumber: newDriver.LicenseNumber,
        registrationNumber: newDriver.VehicleNumber 
      } 
    });
  } catch (error) {
    console.error(error);
    // Handle Prisma's unique constraint violation for LicenseNumber or VehicleNumber
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "This Driving License or Vehicle Registration is already registered to another user." });
    }
    res.status(500).json({ error: "Failed to create driver details." });
  }
};

// PUT /api/driver/details
exports.updateDetails = async (req, res) => {
  try {
    const { dlNumber, registrationNumber } = req.body; 

    console.log("Dl Number ",dlNumber);
    console.log("registration Number ", registrationNumber);

    // Find if the driver profile already exists
    const existingDriver = await prisma.deliveryPartner.findFirst({
      where: { UserID: req.user?.id }
    });

    if (existingDriver) {
      // Update existing driver's license and vehicle number
      const updated = await prisma.deliveryPartner.update({
        where: { DeliveryPartnerID: existingDriver.DeliveryPartnerID },
        data: { 
          LicenseNumber: dlNumber,
          VehicleNumber: registrationNumber 
        } 
      });
      return res.json({ 
        success: true, 
        details: { 
          dlNumber: updated.LicenseNumber,
          registrationNumber: updated.VehicleNumber 
        } 
      });
    } else {
      // Fallback: Create new driver profile if it doesn't exist (Upsert behavior)
      const newDriver = await prisma.deliveryPartner.create({
        data: {
          UserID: req.user?.id,
          LicenseNumber: dlNumber,
          VehicleNumber: registrationNumber
        }
      });
      return res.status(201).json({ 
        success: true, 
        details: { 
          dlNumber: newDriver.LicenseNumber,
          registrationNumber: newDriver.VehicleNumber 
        } 
      });
    }
  } catch (error) {
    console.error(error);
    // Handle Prisma's unique constraint violation for LicenseNumber or VehicleNumber
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "This Driving License or Vehicle Registration is already registered to another user." });
    }
    res.status(500).json({ error: "Failed to update driver details." });
  }
};