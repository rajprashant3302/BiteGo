require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { prisma } = require("database");
const { redisClient } = require("redis-client");

const menuRoutes = require("./routes/menuRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Order Service is Running");
});

app.use("/api/menu", menuRoutes);

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
     // Ensure Kafka doesn't crash app if not ready
     try {
       await connectProducer();
     } catch(e) {
       console.warn("⚠️ Kafka not ready, skipping...");
     }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Order Service running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();