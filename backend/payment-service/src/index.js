require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { prisma } = require("database");
const { redisClient } = require("redis-client");
const { connectProducer } = require("./kafka/producer");

const paymentRoutes = require("./routes/paymentRoutes");


const app = express();
const PORT = process.env.PAYMENT_PORT || 5005;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Payment Service is Running");
});


app.use("/api/payments", paymentRoutes);

app.get("/payments", async (req, res) => {
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
       console.warn("⚠️ Kafka not ready, skipping...");
     }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Payment Service running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();