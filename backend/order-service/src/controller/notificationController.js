const notificationsStore = global.__vendorNotificationsStore || [];
global.__vendorNotificationsStore = notificationsStore;

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseRestaurantIds(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

exports.getNotifications = async (req, res) => {
  try {
    const restaurantIds = parseRestaurantIds(req.query.restaurantIds);
    const rows = notificationsStore
      .filter((item) => {
        if (!restaurantIds.length) return true;
        return !item.restaurantId || restaurantIds.includes(String(item.restaurantId));
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ notifications: rows });
  } catch (error) {
    console.error("❌ GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ message: "Failed to load notifications." });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = notificationsStore.find((item) => item.id === id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.isRead = true;

    res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("❌ MARK NOTIFICATION READ ERROR:", error);
    res.status(500).json({ message: "Failed to update notification." });
  }
};

exports.createOrderNotification = async ({
  orderId,
  customerName,
  branch,
  amount,
  restaurantId,
}) => {
  notificationsStore.unshift({
    id: buildId(),
    title: "New order received",
    text: `${customerName} placed an order at ${branch} for ₹${amount}.`,
    type: "success",
    isRead: false,
    createdAt: new Date().toISOString(),
    orderId,
    restaurantId: restaurantId ? String(restaurantId) : null,
    actionUrl: "/dashboard/orders",
  });

  if (notificationsStore.length > 100) {
    notificationsStore.length = 100;
  }
};
