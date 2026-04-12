// controllers/adminController.js
const { prisma } = require("database");

// ==========================================
// USER MANAGEMENT
// ==========================================

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || undefined;
    const skip = (page - 1) * limit;

    const whereClause = {};

    if (role) {
      whereClause.Role = role; 
    }

    if (search) {
      whereClause.OR = [
        { Name: { contains: search, mode: 'insensitive' } },
        { Email: { contains: search, mode: 'insensitive' } },
        { Phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
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
        totalPages: Math.ceil(totalCount / limit) || 1,
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
    const { isActive } = req.body; 

    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: { IsActive: isActive },
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status", error: error.message });
  }
};


// ==========================================
// RESTAURANT MANAGEMENT
// ==========================================

const getRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const skip = (page - 1) * limit;
    let whereClause = {};

    if (search) {
      whereClause.Name = { contains: search, mode: 'insensitive' };
    }

    if (status === 'active') whereClause.IsActive = true;
    if (status === 'suspended') whereClause.IsActive = false;

    const [restaurants, totalCount] = await Promise.all([
      prisma.restaurant.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        include: {
          owner: {
            include: {
              // 1. Fetch Email and Phone from the User table
              user: { select: { Email: true, Phone: true } }
            }
          },
          // 2. Fetch the earnings from orders to calculate the total
          orders: {
            where: { OrderStatus: 'Delivered' }, // Only count completed orders
            select: { RestaurantEarning: true }
          }
        },
        orderBy: { Name: 'asc' }
      }),
      prisma.restaurant.count({ where: whereClause })
    ]);

    // 3. Map through the results to calculate TotalEarnings for the list
    const formattedRestaurants = restaurants.map(r => {
      const totalEarnings = r.orders.reduce((sum, order) => sum + Number(order.RestaurantEarning || 0), 0);
      return {
        ...r,
        TotalEarnings: totalEarnings,
        orders: undefined 
      };
    });

    res.status(200).json({
      success: true,
      data: formattedRestaurants,
      meta: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
      }
    });
  } catch (error) {
    console.error("ADMIN FETCH RESTAURANTS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch restaurants" });
  }
};

const getRestaurantDetails = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // 1. Get the true Total Earnings using an aggregate function
    const earningsAgg = await prisma.orders.aggregate({
      where: { RestaurantID: restaurantId, OrderStatus: 'Delivered' },
      _sum: { RestaurantEarning: true }
    });
    const realTotalEarnings = earningsAgg._sum.RestaurantEarning || 0;

    // 2. Fetch the restaurant details and the 5 most recent orders
    const restaurant = await prisma.restaurant.findUnique({
      where: { RestaurantID: restaurantId },
      include: {
        owner: {
          include: {
            user: { select: { Email: true, Phone: true } }
          }
        },
        orders: {
          take: 5,
          orderBy: { OrderDateTime: 'desc' },
          include: {
            user: { select: { Name: true } }
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const formattedRestaurant = {
      ...restaurant,
      TotalEarnings: realTotalEarnings, // Inject the real calculated earnings
      orders: restaurant.orders.map(o => ({
        ...o,
        customer: { Name: o.user?.Name || 'Guest User' }
      }))
    };

    res.status(200).json({ success: true, data: formattedRestaurant });
  } catch (error) {
    console.error("ADMIN RESTAURANT DETAILS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch details" });
  }
};

const toggleRestaurantBlock = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isActive } = req.body;

    const updatedRestaurant = await prisma.restaurant.update({
      where: { RestaurantID: restaurantId },
      data: { IsActive: isActive }
    });

    res.status(200).json({ success: true, data: updatedRestaurant });
  } catch (error) {
    console.error("ADMIN TOGGLE RESTAURANT ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

// ==========================================
// ORDER MANAGEMENT (Admin)
// ==========================================

// backend/auth-service/src/controller/adminController.js

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').trim(); // Trim spaces to prevent false triggers
    const status = req.query.status || '';

    const skip = (page - 1) * limit;
    let whereClause = {};

    if (status) {
      whereClause.OrderStatus = status;
    }

    if (search) {
      // 1. Search text columns safely
      whereClause.OR = [
        { user: { Name: { contains: search, mode: 'insensitive' } } },
        { restaurant: { Name: { contains: search, mode: 'insensitive' } } },
      ];

      // 2. CRITICAL FIX: Only search OrderID if the string is actually a valid UUID!
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(search)) {
        whereClause.OR.push({ OrderID: search }); // Exact match required for UUIDs
      }
    }

    const [orders, totalCount] = await Promise.all([
      prisma.orders.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        include: {
          user: { select: { Name: true, Phone: true } },
          restaurant: { select: { Name: true } }
        },
        orderBy: { OrderDateTime: 'desc' }
      }),
      prisma.orders.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      meta: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
      }
    });
  } catch (error) {
    console.error("ADMIN FETCH ORDERS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.orders.findUnique({
      where: { OrderID: orderId },
      include: {
        user: { select: { Name: true, Phone: true, Email: true } },
        restaurant: { select: { Name: true, Rating: true } },
        address: true,
        payments: true,
        items: {
          include: {
            item: { select: { ItemName: true, ItemImageURL: true } }
          }
        },
        deliveryPartner: {
          include: { user: { select: { Name: true, Phone: true } } }
        }
      }
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("ADMIN ORDER DETAILS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order details" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // e.g., "Preparing", "Delivered", "Cancelled"

    const validStatuses = ['Placed', 'Preparing', 'PickedUp', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updatedOrder = await prisma.orders.update({
      where: { OrderID: orderId },
      data: { OrderStatus: status }
    });

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("ADMIN UPDATE ORDER STATUS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};


// ==========================================
// DASHBOARD STATS (Admin)
// ==========================================

// backend/auth-service/src/controller/adminController.js

const getDashboardStats = async (req, res) => {
  try {
    const period = req.query.period || 'month'; // 'week', 'month', 'year', 'custom'
    const customMonth = parseInt(req.query.month) || new Date().getMonth();
    const customYear = parseInt(req.query.year) || new Date().getFullYear();

    let startDate, endDate;
    const now = new Date();

    // --- 1. DETERMINE DATE RANGES ---
    if (period === 'week') {
      const day = now.getDay() || 7; 
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (period === 'custom') {
      startDate = new Date(customYear, customMonth, 1);
      endDate = new Date(customYear, customMonth + 1, 0, 23, 59, 59);
    } else {
      // Default: This Month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    console.log(`[Stats API] Period: ${period} | Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // --- 2. FETCH ORDERS FOR THE PERIOD ---
    const orders = await prisma.orders.findMany({
      where: {
        OrderStatus: 'Delivered',
        OrderDateTime: { gte: startDate, lte: endDate }
      },
      select: { OrderDateTime: true, TotalAmount: true }
    });

    console.log(`[Stats API] Found ${orders.length} delivered orders.`);

    // --- 3. FORMAT DATA FOR THE CHART ---
    let chartData = [];

    if (period === 'week') {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      chartData = days.map(d => ({ label: d, isLabelVisible: true, tooltipLabel: d, value: 0, revenue: 0 }));
      orders.forEach(o => {
        let dayIdx = o.OrderDateTime.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; 
        const amt = Number(o.TotalAmount || 0);
        chartData[dayIdx].value += amt;
        chartData[dayIdx].revenue += amt;
      });
    } else if (period === 'year') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      chartData = months.map(m => ({ label: m, isLabelVisible: true, tooltipLabel: m, value: 0, revenue: 0 }));
      orders.forEach(o => {
        const mIdx = o.OrderDateTime.getMonth();
        const amt = Number(o.TotalAmount || 0);
        chartData[mIdx].value += amt;
        chartData[mIdx].revenue += amt;
      });
    } else {
      // Month & Custom (Daily breakdown)
      const daysInMonth = endDate.getDate();
      chartData = Array.from({ length: daysInMonth }, (_, i) => ({
        label: `${i + 1}`,
        isLabelVisible: i === 0 || i === 4 || i === 9 || i === 14 || i === 19 || i === 24 || i === daysInMonth - 1,
        tooltipLabel: `Day ${i + 1}`,
        value: 0,
        revenue: 0
      }));
      orders.forEach(o => {
        const dayIdx = o.OrderDateTime.getDate() - 1;
        const amt = Number(o.TotalAmount || 0);
        chartData[dayIdx].value += amt;
        chartData[dayIdx].revenue += amt;
      });
    }

    // --- 4. GET LIVE ORDER STATUS COUNTS (For the selected period) ---
    const statusCounts = await prisma.orders.groupBy({
      by: ['OrderStatus'],
      where: { OrderDateTime: { gte: startDate, lte: endDate } ,
    OrderStatus: { in: ['Placed', 'Preparing', 'PickedUp', 'Delivered', 'Cancelled'] }
    }, 
      _count: { OrderID: true }
    });

    const orderCounts = { Delivered: 0, Preparing: 0, Placed: 0, Cancelled: 0, PickedUp: 0 };
    statusCounts.forEach(s => { orderCounts[s.OrderStatus] = s._count.OrderID; });

    console.log(`[Stats API] Grouped Data Ready. Sending to client...`);

    res.status(200).json({
      success: true,
      data: {
        chartData,
        orderCounts
      }
    });

  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

// ==========================================
// DASHBOARD SUMMARY (Stat Cards & Top Restaurants)
// ==========================================

const getDashboardSummary = async (req, res) => {
  try {
    // --- 1. STAT CARDS DATA ---
    const [
      revenueAgg, 
      ordersCount, 
      activeUsers,
      restaurantsCount, 
      avgRatingAgg, 
      deliveryPartnersCount
    ] = await Promise.all([
      prisma.orders.aggregate({ where: { OrderStatus: 'Delivered' }, _sum: { TotalAmount: true } }),
      prisma.orders.count(),
      prisma.user.count({ where: { Role: 'User', IsActive: true } }),
      prisma.restaurant.count(),
      prisma.restaurant.aggregate({ _avg: { Rating: true } }),
      prisma.deliveryPartner.count()
    ]);

    const statCards = {
      totalRevenue: revenueAgg._sum.TotalAmount || 0,
      totalOrders: ordersCount,
      activeUsers: activeUsers,
      totalRestaurants: restaurantsCount,
      avgRating: avgRatingAgg._avg.Rating ? avgRatingAgg._avg.Rating.toFixed(1) : "0.0",
      totalDeliveryPartners: deliveryPartnersCount
    };

    // --- 2. TOP RESTAURANTS DATA ---
    // Group orders by restaurant, sum the revenue, and take the top 5
    const topRestRaw = await prisma.orders.groupBy({
      by: ['RestaurantID'],
      where: { OrderStatus: 'Delivered' },
      _sum: { TotalAmount: true },
      _count: { OrderID: true },
      orderBy: { _sum: { TotalAmount: 'desc' } },
      take: 5
    });

    // Fetch the actual names and ratings for those top 5 restaurants
    const restIds = topRestRaw.map(r => r.RestaurantID).filter(Boolean);
    const restaurantsData = await prisma.restaurant.findMany({
      where: { RestaurantID: { in: restIds } },
      select: { RestaurantID: true, Name: true, Rating: true }
    });

    // Merge the data together
    const topRestaurants = topRestRaw.map(r => {
      const details = restaurantsData.find(d => d.RestaurantID === r.RestaurantID);
      return {
        id: r.RestaurantID,
        name: details?.Name || "Unknown Restaurant",
        revenue: r._sum.TotalAmount || 0,
        orders: r._count.OrderID || 0,
        rating: details?.Rating ? Number(details.Rating).toFixed(1) : "0.0",
      };
    });

    res.status(200).json({
      success: true,
      data: { statCards, topRestaurants }
    });
  } catch (error) {
    console.error("DASHBOARD SUMMARY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard summary" });
  }
};

// Ensure you export it at the bottom!
// module.exports = { ..., getDashboardSummary };

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  getUsers,
  getUserDetails,
  toggleUserBlock,
  
  getRestaurants,
  getRestaurantDetails,
  toggleRestaurantBlock,

  getOrders, 
  getOrderDetails, 
  updateOrderStatus, 

  getDashboardStats,
  getDashboardSummary
};