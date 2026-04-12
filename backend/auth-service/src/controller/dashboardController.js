const { prisma } = require("database");

function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

function normalizeOrderStatus(status) {
  if (!status) return "Unknown";
  return status;
}

function getRestaurantStatus(restaurant, orderCount) {
  if (!restaurant.IsOpen) return "Closed";
  if (orderCount >= 10) return "Busy";
  return "Open";
}

function buildTrend(orders) {
  const now = new Date();
  const labels = [];
  const daily = new Map();

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    labels.push({ key, label });
    daily.set(key, 0);
  }

  orders.forEach((order) => {
    const key = new Date(order.OrderDateTime).toISOString().slice(0, 10);
    if (daily.has(key)) {
      daily.set(key, daily.get(key) + toNumber(order.TotalAmount));
    }
  });

  return labels.map(({ key, label }) => ({
    label,
    revenue: Math.round(daily.get(key) || 0),
  }));
}

async function getVendorDataset(userId) {
  const owner = await prisma.restaurantOwner.findUnique({
    where: { UserID: userId },
    include: {
      restaurants: {
        include: {
          orders: {
            include: {
              user: { select: { Name: true } },
              payments: true,
            },
            orderBy: { OrderDateTime: "desc" },
          },
        },
        orderBy: { Name: "asc" },
      },
    },
  });

  if (!owner) {
    return {
      restaurants: [],
      orders: [],
      payouts: [],
      summary: {
        totalRestaurants: 0,
        openRestaurants: 0,
        busyRestaurants: 0,
        closedRestaurants: 0,
        avgRating: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        inProgressOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        repeatCustomersRate: 0,
        totalSettled: 0,
        pendingPayouts: 0,
        payoutHealth: 0,
        underReviewPayouts: 0,
      },
      revenueTrend: [],
      analytics: {
        statusBreakdown: [],
        topRestaurants: [],
      },
    };
  }

  const restaurants = owner.restaurants;

  const allOrders = restaurants.flatMap((restaurant) =>
    restaurant.orders.map((order) => ({
      ...order,
      restaurantName: restaurant.Name,
      restaurantId: restaurant.RestaurantID,
    }))
  );

  const allPayments = allOrders.flatMap((order) =>
    order.payments.map((payment) => ({
      ...payment,
      restaurantName: order.restaurantName,
    }))
  );

  const totalRevenue = allOrders.reduce(
    (sum, order) => sum + toNumber(order.TotalAmount),
    0
  );

  const totalOrders = allOrders.length;

  const deliveredOrders = allOrders.filter(
    (order) => order.OrderStatus === "Delivered"
  ).length;

  const inProgressOrders = allOrders.filter((order) =>
    ["Placed", "Preparing", "PickedUp"].includes(order.OrderStatus)
  ).length;

  const cancelledOrders = allOrders.filter(
    (order) => order.OrderStatus === "Cancelled"
  ).length;

  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

  const uniqueCustomers = new Set(allOrders.map((order) => order.UserID));

  const repeatCustomers = new Set(
    Object.entries(
      allOrders.reduce((acc, order) => {
        acc[order.UserID] = (acc[order.UserID] || 0) + 1;
        return acc;
      }, {})
    )
      .filter(([, count]) => count > 1)
      .map(([user]) => user)
  );

  const repeatCustomersRate = uniqueCustomers.size
    ? Math.round((repeatCustomers.size / uniqueCustomers.size) * 100)
    : 0;

  const restaurantRows = restaurants
    .map((restaurant) => {
      const restaurantOrders = allOrders.filter(
        (order) => order.restaurantId === restaurant.RestaurantID
      );

      const restaurantRevenue = restaurantOrders.reduce(
        (sum, order) => sum + toNumber(order.TotalAmount),
        0
      );

      const orderCount = restaurantOrders.length;
      const rating = Number(toNumber(restaurant.Rating).toFixed(1));
      const status = getRestaurantStatus(restaurant, orderCount);

      return {
        id: restaurant.RestaurantID,
        name: restaurant.Name,
        categoryName: restaurant.CategoryName,
        isOpen: restaurant.IsOpen,
        rating,
        totalOrders: orderCount,
        totalRevenue: Math.round(restaurantRevenue),
        averageOrderValue: orderCount ? Math.round(restaurantRevenue / orderCount) : 0,
        latestOrderAt: restaurantOrders[0]?.OrderDateTime || null,
        status,
        health:
          cancelledOrders > deliveredOrders && orderCount ? "Needs attention" : "Stable",
        momentum:
          restaurantRevenue >= 10000
            ? "Strong"
            : restaurantRevenue >= 3000
            ? "Moderate"
            : "Low",
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const openRestaurants = restaurantRows.filter(
    (restaurant) => restaurant.status === "Open"
  ).length;

  const busyRestaurants = restaurantRows.filter(
    (restaurant) => restaurant.status === "Busy"
  ).length;

  const closedRestaurants = restaurantRows.filter(
    (restaurant) => restaurant.status === "Closed"
  ).length;

  const avgRating = restaurantRows.length
    ? Number(
        (
          restaurantRows.reduce((sum, restaurant) => sum + restaurant.rating, 0) /
          restaurantRows.length
        ).toFixed(1)
      )
    : 0;

  const orderRows = allOrders.map((order) => {
    const primaryPayment = order.payments[0];

    return {
      id: order.OrderID,
      customer: order.user?.Name || "Customer",
      branch: order.restaurantName,
      amount: Math.round(toNumber(order.TotalAmount)),
      status: normalizeOrderStatus(order.OrderStatus),
      createdAt: order.OrderDateTime,
      paymentStatus: primaryPayment?.PaymentStatus || "Pending",
      paymentMethod: primaryPayment?.PaymentMethod || "N/A",
    };
  });

  const payoutRows = allPayments
    .map((payment) => {
      const amount = Math.round(toNumber(payment.TotalAmount));
      let status = "Under Review";

      if (payment.PaymentStatus === "Success") status = "Settled";
      if (payment.PaymentStatus === "Pending") status = "Pending";

      return {
        branch: payment.restaurantName,
        amount,
        status,
        date: payment.PaymentDate,
        paymentMethod: payment.PaymentMethod || "N/A",
        reference: payment.TransactionReference || payment.PaymentID.slice(0, 8),
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalSettled = payoutRows
    .filter((item) => item.status === "Settled")
    .reduce((sum, item) => sum + item.amount, 0);

  const pendingPayouts = payoutRows
    .filter((item) => item.status === "Pending")
    .reduce((sum, item) => sum + item.amount, 0);

  const underReviewPayouts = payoutRows
    .filter((item) => item.status === "Under Review")
    .reduce((sum, item) => sum + item.amount, 0);

  const payoutHealth = payoutRows.length
    ? Math.round(
        (payoutRows.filter((item) => item.status === "Settled").length /
          payoutRows.length) *
          100
      )
    : 0;

  const revenueTrend = buildTrend(allOrders);

  return {
    restaurants: restaurantRows,
    orders: orderRows,
    payouts: payoutRows,
    summary: {
      totalRestaurants: restaurantRows.length,
      openRestaurants,
      busyRestaurants,
      closedRestaurants,
      avgRating,
      totalOrders,
      deliveredOrders,
      inProgressOrders,
      cancelledOrders,
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue,
      repeatCustomersRate,
      totalSettled,
      pendingPayouts,
      payoutHealth,
      underReviewPayouts,
    },
    revenueTrend,
    analytics: {
      statusBreakdown: [
        { label: "Delivered", value: deliveredOrders },
        { label: "In Progress", value: inProgressOrders },
        { label: "Cancelled", value: cancelledOrders },
      ],
      topRestaurants: restaurantRows.slice(0, 5).map((restaurant) => ({
        name: restaurant.name,
        revenue: restaurant.totalRevenue,
        orders: restaurant.totalOrders,
      })),
    },
  };
}

exports.getOverview = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await getVendorDataset(userId);

    res.status(200).json({
      summary: data.summary,
      restaurants: data.restaurants,
      recentOrders: data.orders.slice(0, 10),
      payouts: data.payouts.slice(0, 10),
      revenueTrend: data.revenueTrend,
    });
  } catch (error) {
    console.error("❌ DASHBOARD OVERVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to load vendor overview." });
  }
};

exports.getRestaurants = async (req, res) => {
  try {
    const data = await getVendorDataset(req.params.userId);
    res.status(200).json({
      restaurants: data.restaurants,
      summary: data.summary,
    });
  } catch (error) {
    console.error("❌ DASHBOARD RESTAURANTS ERROR:", error);
    res.status(500).json({ message: "Failed to load vendor restaurants." });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const data = await getVendorDataset(req.params.userId);
    res.status(200).json({
      stats: {
        totalOrders: data.summary.totalOrders,
        deliveredOrders: data.summary.deliveredOrders,
        inProgressOrders: data.summary.inProgressOrders,
        cancelledOrders: data.summary.cancelledOrders,
      },
      orders: data.orders,
    });
  } catch (error) {
    console.error("❌ DASHBOARD ORDERS ERROR:", error);
    res.status(500).json({ message: "Failed to load vendor orders." });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const data = await getVendorDataset(req.params.userId);
    res.status(200).json({
      metrics: {
        revenue: data.summary.totalRevenue,
        sales: data.summary.totalRevenue,
        averageOrderValue: data.summary.avgOrderValue,
        repeatCustomersRate: data.summary.repeatCustomersRate,
      },
      revenueTrend: data.revenueTrend,
      statusBreakdown: data.analytics.statusBreakdown,
      topRestaurants: data.analytics.topRestaurants,
    });
  } catch (error) {
    console.error("❌ DASHBOARD ANALYTICS ERROR:", error);
    res.status(500).json({ message: "Failed to load vendor analytics." });
  }
};

exports.getPayouts = async (req, res) => {
  try {
    const data = await getVendorDataset(req.params.userId);
    res.status(200).json({
      summary: {
        totalSettled: data.summary.totalSettled,
        pendingPayouts: data.summary.pendingPayouts,
        underReviewPayouts: data.summary.underReviewPayouts,
        payoutHealth: data.summary.payoutHealth,
      },
      payouts: data.payouts,
    });
  } catch (error) {
    console.error("❌ DASHBOARD PAYOUTS ERROR:", error);
    res.status(500).json({ message: "Failed to load vendor payouts." });
  }
};