require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http"); // <-- 1. Import http
const { Server } = require("socket.io"); // <-- 2. Import Socket.io
const { prisma } = require("database");
const { redisClient } = require("redis-client");
const cartRoutes = require("./routes/cartRoutes"); 
const offerRoutes = require("./routes/offerRoutes"); 
const { connectProducer } = require("./kafka/producer");
const { connectConsumer } = require('./kafka/consumer');

const menuRoutes = require("./routes/menuRoutes");
const resRoutes = require("./routes/resRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// <-- 3. Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Update this to your frontend URL in production
});

// Make `io` accessible inside your routes/controllers via req.app.get('socketio')
app.set('socketio', io);

// <-- 4. Handle Socket connections and rooms
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  
  // Clients will emit this to join a room specific to their UserID or RestaurantID
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Order Service is Running");
});

app.use("/api/menu", menuRoutes);
app.use("/api/restaurants", resRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);

app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany(); 
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

(async () => {
  try {
     // Ensure Kafka doesn't crash app if not ready
     try {
       await connectProducer();
     } catch(e) {
       console.warn("⚠️ Kafka Producer not ready, skipping...");
     }

     // <-- 5. Start Kafka Consumer and pass the Socket.io instance
     try {
       await connectConsumer(io);
       console.log("✅ Kafka Consumer connected");
     } catch(e) {
       console.warn("⚠️ Kafka Consumer not ready, skipping...", e.message);
     }

    // <-- 6. Use server.listen instead of app.listen
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Order Service running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();