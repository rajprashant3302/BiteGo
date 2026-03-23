require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectProducer } = require("./kafka/producer");

const driverRoutes = require("./routes/driverRoutes");

const app = express();
const PORT = process.env.DELIVERY_PORT || 5004;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Delivery Service is Running");
});

app.use("/driver", driverRoutes);

app.get("/driver", async (req, res) => {
  try {
    console.log("Healthy Check...")
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


(async () => {
  try {
     try {
       await connectProducer();
     } catch(e) {
       console.warn("⚠️ Kafka not ready, skipping...");
     }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Delivery Service running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();