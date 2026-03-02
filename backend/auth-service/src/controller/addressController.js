const { prisma } = require("database");
exports.getAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const addresses = await prisma.address.findMany({
      where: { UserID: userId },
      orderBy: [
        { IsDefault: 'desc' }, 
        { AddressLine: 'asc' }
      ]
    });

    res.status(200).json(addresses);

  } catch (error) {
    console.error("❌ GET ADDRESSES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch addresses." });
  }
};

// add address
exports.addAddress = async (req, res) => {
  try {
    const { userId, addressLine, city, pincode, latitude, longitude, isDefault } = req.body;

    if (!userId || !addressLine) {
      return res.status(400).json({ message: "User ID and Address Line are required." });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { UserID: userId },
        data: { IsDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        UserID: userId,
        AddressLine: addressLine,
        City: city || null,
        Pincode: pincode || null,
        Latitude: latitude || null,
        Longitude: longitude || null,
        IsDefault: isDefault || false,
      }
    });

    console.log(`New address added for User ${userId}`);

    res.status(201).json({
      message: "Address saved successfully",
      address: newAddress
    });

  } catch (error) {
    console.error("❌ ADD ADDRESS ERROR:", error);
    res.status(500).json({ message: "Failed to save address." });
  }
};


//  Edit/Update an existing address
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { userId, addressLine, city, pincode, latitude, longitude, isDefault } = req.body;

    if (!addressId || !userId) {
      return res.status(400).json({ message: "Address ID and User ID are required." });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { UserID: userId },
        data: { IsDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { AddressID: addressId },
      data: {
        AddressLine: addressLine,
        City: city || null,
        Pincode: pincode || null,
        Latitude: latitude || null,
        Longitude: longitude || null,
        IsDefault: isDefault || false,
      }
    });

    console.log(` Address ${addressId} updated for User ${userId}`);
    res.status(200).json({ message: "Address updated successfully", address: updatedAddress });

  } catch (error) {
    console.error("❌ UPDATE ADDRESS ERROR:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Address not found." });
    }
    res.status(500).json({ message: "Failed to update address." });
  }
};

//  Remove an address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required." });
    }

    await prisma.address.delete({
      where: { AddressID: addressId }
    });

    console.log(`🗑️ Address ${addressId} deleted.`);
    res.status(200).json({ message: "Address deleted successfully." });

  } catch (error) {
    console.error("❌ DELETE ADDRESS ERROR:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Address not found." });
    }
    res.status(500).json({ message: "Failed to delete address." });
  }
};