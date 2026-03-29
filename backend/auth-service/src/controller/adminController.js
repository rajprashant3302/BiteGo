// controllers/userController.js
const { prisma } = require("database");

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || undefined;
    const skip = (page - 1) * limit;

    // Build dynamic where clause (Removed TypeScript types)
    const whereClause = {};

    if (role) {
      whereClause.Role = role; 
    }

    if (search) {
      // Flexible Search: Looks through Name, Email, and Phone
      whereClause.OR = [
        { Name: { contains: search, mode: 'insensitive' } },
        { Email: { contains: search, mode: 'insensitive' } },
        { Phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Run count and data fetch in parallel for optimization
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        // Only select what's needed for the list view to save bandwidth
        select: {
          UserID: true,
          Name: true,
          Email: true,
          Phone: true,
          Role: true,
          IsActive: true,
          CreatedAt: true,
        },
        orderBy: { CreatedAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      include: {
        addresses: true,
        orders: {
          take: 5, // Show last 5 orders
          orderBy: { OrderDateTime: 'desc' },
          include: { restaurant: { select: { Name: true } } }
        },
        walletTxns: { take: 5, orderBy: { CreatedAt: 'desc' } },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user details", error: error.message });
  }
};

const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body; // Pass true to unblock, false to block

    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: { IsActive: isActive },
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status", error: error.message });
  }
};

// Export all controller functions
module.exports = {
  getUsers,
  getUserDetails,
  toggleUserBlock
};