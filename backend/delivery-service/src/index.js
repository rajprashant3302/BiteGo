require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectProducer } = require("./kafka/producer");
const { setupDriverLocationWorker } = require("./workers/driverLocationConsumer");
const { setupOrderConsumer } = require("./workers/orderConsumer");
const http = require("http");
const { initSocket } = require("./socket/socket");
const { connectMongoDB} = require("./config/connectDB");

const driverRoutes = require("./routes/driverRoutes");
const locationRoutes = require('./routes/locationRoutes');
const app = express();
const PORT = process.env.DELIVERY_PORT || 5004;

app.use(cors());
app.use(express.json());


const server = http.createServer(app);
initSocket(server); // Initialize our socket setup

app.get("/", (req, res) => {
  res.send("✅ Delivery Service is Running");
});

app.use("/driver", driverRoutes);
app.use('/api/location', locationRoutes);

// Health check route
app.get("/driver", async (req, res) => {
  try {
    console.log("Healthy Check...");
    res.status(200).json({ status: "ok" }); // Added this so the request actually completes!
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

(async () => {
  try {
    // 1. ALWAYS Connect Databases FIRST
    await connectMongoDB();
    console.log("✅ MongoDB Connected successfully.");

    // 2. Start the HTTP & Socket Server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Delivery Service & Sockets running on port ${PORT}`);
    });

    // 3. Connect Kafka LAST (So if it instantly receives a message, the DB is ready)
    try {
       await connectProducer();
       await setupDriverLocationWorker();
       await setupOrderConsumer();
    } catch(e) {
       console.warn("⚠️ Kafka not ready or connection failed, skipping...", e.message);
    }

  } catch (err) {
    console.error("❌ Fatal Startup Error:", err);
    process.exit(1);
  }
})();