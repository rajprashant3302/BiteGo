require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { connectMongoDB, prisma } = require("./config/connectDB");
const setupChatSocket = require("./socket/chatSocket");

const app = express();
const PORT = process.env.CHAT_PORT || 5003;

// 1. Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// 2. HTTP Routes
app.get("/", (req, res) => {
  res.send("✅ Chat & AI Recommendation Service is Running");
});

// Example Prisma Route (NeonDB)
app.get("/chats-sync", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany(); // Testing shared DB package
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Prisma Database error" });
  }
});

// 3. Create Server & Initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// 4. Connect Databases & Start Socket Listeners
connectMongoDB().then(() => {
    setupChatSocket(io); // This activates all the logic we wrote in chatSocket.js
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});