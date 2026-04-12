require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { prisma } = require("database");
const { redisClient } = require("redis-client");
const cartRoutes = require("./routes/cartRoutes");
const offerRoutes = require("./routes/offerRoutes");
const { connectProducer } = require("./kafka/producer");
const { connectConsumer } = require("./kafka/consumer");
const menuRoutes = require("./routes/menuRoutes");
const resRoutes = require("./routes/resRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on("leave_room", (roomName) => {
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Order Service is Running");
});

app.use("/api/notifications", notificationRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/restaurants", resRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);

app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany(); // Make sure your Prisma model is 'order' or 'orders' based on your schema
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


(async () => {
  try {
    try {
      await connectProducer();
      console.log("✅ Kafka Producer connected");
    } catch (e) {
      console.warn("⚠️ Kafka Producer not ready, skipping...", e.message);
    }

    try {
      await connectConsumer(io);
      console.log("✅ Kafka Consumer connected");
    } catch (e) {
      console.warn("⚠️ Kafka Consumer not ready, skipping...", e.message);
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Order Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();