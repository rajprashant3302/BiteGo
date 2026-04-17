const { publishEvent } = require("../kafka/producer");
const { getIo } = require("../socket/socket");
const {prisma} = require("database");

exports.updateOrderStatus = async (req, res) => {
    try {
        const { driverId, orderId } = req.params;
        const { status } = req.body; // Expecting 'PickedUp' or 'Delivered'

        if (!['PickedUp', 'Delivered'].includes(status)) {
            return res.status(400).json({ error: "Invalid status update" });
        }

        console.log(`🚚 Driver ${driverId} marked Order ${orderId} as ${status}`);

        // 1. Instantly update the User's tracking screen via WebSockets!
        const io = getIo();
        io.to(`track_${orderId}`).emit("status_update", { 
            status: status === 'PickedUp' ? 'On the Way' : 'Delivered',
            driverId 
        });

        // 2. Publish to Kafka so the Order Service can save it to NeonDB
        await publishEvent("order-status-changed", {
            orderId,
            driverId,
            status,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({ success: true, message: `Order marked as ${status}` });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Express example

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ error: "User ID missing in token" });
    }

    // ✅ 1. Find Delivery Partner
    const partner = await prisma.deliveryPartner.findUnique({
      where: { UserID: userId },
    });

    if (!partner) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // ✅ 2. Fetch ACTIVE orders only
    const orders = await prisma.orders.findMany({
      where: {
        DeliveryPartnerID: partner.DeliveryPartnerID,

        // 🔥 IMPORTANT FILTER
        OrderStatus: {
          in: ["Preparing", "Prepared", "PickedUp"], // only active
        },
      },

      orderBy: {
        OrderDateTime: "desc",
      },

      include: {
        address: true,
        restaurant: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    return res.json(orders);

  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};