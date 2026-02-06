// backend/order-service/src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { prisma } = require("database"); // Shared DB package

const app = express();
const PORT = process.env.PORT || 5001; // Runs on 5001 internally

app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("✅ Order Service is Running");
});

// Example: Get All Orders (Test DB Connection)
app.get("/chats", async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Chat Service running on port ${PORT}`);
});