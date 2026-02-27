const bcrypt = require("bcryptjs");
const { prisma } = require("database");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";


exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, profilePic } = req.body;

    // 1. Validate required fields
    if (!userId) {
      return res.status(400).json({ message: "User ID is required to update profile." });
    }

    if (!name) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    // 2. Check if the phone number is already taken by ANOTHER user (if phone is provided)
    if (phone) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          Phone: phone,
          NOT: { UserID: userId }, // Exclude the current user from the check
        },
      });

      if (existingPhoneUser) {
        return res.status(400).json({ message: "This phone number is already registered to another account." });
      }
    }

    // 3. Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        Name: name,
        // If phone is an empty string, set it to null in the DB
        Phone: phone ? phone : null,
        // Only update the profile pic if a new one was sent from the frontend
        ...(profilePic && { ProfilePicURL: profilePic }),
      },
      // Exclude PasswordHash from the return data for security
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

    // 4. Send success response back to frontend
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ PROFILE UPDATE ERROR:", error);
    
    // Handle Prisma specific errors (e.g., Record Not Found)
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "User not found in the database." });
    }

    res.status(500).json({ message: "Internal server error while updating profile." });
  }
};