const { prisma } = require("database");

exports.getBusinessDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const businessDetails = await prisma.restaurantOwner.findUnique({
      where: { UserID: userId },
      select: {
        PANNumber: true,
        BankAccountNo: true,
        IFSC: true,
      }
    });

    if (!businessDetails) {
      return res.status(204).send();
    }

    res.status(200).json(businessDetails);

  } catch (error) {
    console.error("❌ GET BUSINESS DETAILS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch business details." });
  }
};

// (Create or Update) business details
exports.saveBusinessDetails = async (req, res) => {
  try {
    const { userId, panNumber, bankAccountNo, ifsc } = req.body;

    if (!userId || !panNumber || !bankAccountNo || !ifsc) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const formattedPAN = panNumber.toUpperCase();
    const formattedIFSC = ifsc.toUpperCase();

    const savedDetails = await prisma.restaurantOwner.upsert({
      where: { UserID: userId },
      update: {
        PANNumber: formattedPAN,
        BankAccountNo: bankAccountNo,
        IFSC: formattedIFSC,
      },
      create: {
        UserID: userId,
        PANNumber: formattedPAN,
        BankAccountNo: bankAccountNo,
        IFSC: formattedIFSC,
      }
    });

    console.log(`✅ Business details saved for User ${userId}`);
    await prisma.user.update({
      where: { UserID: userId },
      data: { Role: 'RestaurantOwner' }
    });

    res.status(200).json({
      message: "Business details saved successfully.",
      data: savedDetails
    });

  } catch (error) {
    console.error("❌ SAVE BUSINESS DETAILS ERROR:", error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "These business details are already associated with another account." });
    }

    res.status(500).json({ message: "Failed to save business details." });
  }
};