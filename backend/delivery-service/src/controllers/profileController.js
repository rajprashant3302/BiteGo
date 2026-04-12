const { prisma } = require("database");

// GET /driver/profile-summary
exports.getDriverProfileSummary = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized user." });
    }

    const driver = await prisma.deliveryPartner.findFirst({
      where: { UserID: userId },
      include: {
        user: true,
        orders: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: "Driver profile not found." });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrders = (driver.orders || []).filter((order) => {
      const orderDate = new Date(order.OrderDateTime);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });

    const deliveredOrders = (driver.orders || []).filter(
      (order) => order.OrderStatus === "Delivered"
    );

    const activeOrders = (driver.orders || []).filter(
      (order) =>
        order.OrderStatus !== "Delivered" &&
        order.OrderStatus !== "Cancelled"
    );

    const todayDelivered = todayOrders.filter(
      (order) => order.OrderStatus === "Delivered"
    );

    const todayEarnings = todayDelivered.reduce((sum, order) => {
      return sum + Number(order.DeliveryPartnerEarning || 0);
    }, 0);

    const totalEarnings = deliveredOrders.reduce((sum, order) => {
      return sum + Number(order.DeliveryPartnerEarning || 0);
    }, 0);

    return res.status(200).json({
      success: true,
      profile: {
        id: driver.DeliveryPartnerID,
        userId: driver.UserID,
        name: driver.user?.Name || "BiteGo Partner",
        email: driver.user?.Email || "",
        phone: driver.user?.Phone || "",
        role: driver.user?.Role || "DeliveryPartner",
        profilePic: driver.user?.ProfilePicURL || "",
        isAvailable: driver.IsAvailable || false,
        vehicleNumber: driver.VehicleNumber || "",
        licenseNumber: driver.LicenseNumber || "",
        currentLatitude: driver.CurrentLatitude || null,
        currentLongitude: driver.CurrentLongitude || null,
      },
      stats: {
        todayDeliveries: todayDelivered.length,
        activeOrders: activeOrders.length,
        totalDeliveries: deliveredOrders.length,
        todayEarnings,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error("getDriverProfileSummary error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

// PATCH /driver/availability
exports.updateDriverAvailability = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ error: "isAvailable must be true or false." });
    }

    const existingDriver = await prisma.deliveryPartner.findFirst({
      where: { UserID: userId },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver profile not found." });
    }

    const updatedDriver = await prisma.deliveryPartner.update({
      where: { DeliveryPartnerID: existingDriver.DeliveryPartnerID },
      data: { IsAvailable: isAvailable },
    });

    return res.status(200).json({
      success: true,
      message: `Driver is now ${updatedDriver.IsAvailable ? "online" : "offline"}`,
      isAvailable: updatedDriver.IsAvailable,
    });
  } catch (error) {
    console.error("updateDriverAvailability error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};