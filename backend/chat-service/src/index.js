require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { connectMongoDB, prisma } = require("./config/connectDB");
const setupChatSocket = require("./socket/chatSocket");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const PORT = process.env.CHAT_PORT || 5003;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Chat & AI Recommendation Service is Running");
});

app.use("/api/chat", chatRoutes);

app.get("/chats-sync", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Prisma Database error" });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

connectMongoDB().then(() => {
    setupChatSocket(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});