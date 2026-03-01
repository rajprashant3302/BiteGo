const bcrypt = require("bcryptjs");
const { prisma } = require("database");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";


exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, profilePic } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required to update profile." });
    }

    if (!name) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    if (phone) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          Phone: phone,
          NOT: { UserID: userId },
        },
      });

      if (existingPhoneUser) {
        return res.status(400).json({ message: "This phone number is already registered to another account." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        Name: name,
        Phone: phone ? phone : null,
        ...(profilePic && { ProfilePicURL: profilePic }),
      },
      select: {
        UserID: true,
        Name: true,
        Email: true,
        Phone: true,
        ProfilePicURL: true,
        Role: true,
      }
    });

    console.log(`✅ User ${updatedUser.Email} updated their profile.`);
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ PROFILE UPDATE ERROR:", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "User not found in the database." });
    }

    res.status(500).json({ message: "Internal server error while updating profile." });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const userProfile = await prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        UserID: true,
        Name: true,
        Email: true,
        Phone: true,
        ProfilePicURL: true,
        Role: true,
        WalletBalance: true,
      }
    });

    if (!userProfile) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(userProfile);

  } catch (error) {
    console.error("❌ GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Internal server error while fetching profile." });
  }
};