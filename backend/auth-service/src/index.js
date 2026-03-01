require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const { connectProducer } = require("./kafka/producer");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/partner", vendorRoutes);

(async () => {
  try {
     
     try {
       await connectProducer();
     } catch(e) {
       console.warn("⚠️ Kafka not ready, skipping...");
     }

    app.listen(5000, "0.0.0.0", () => {
      console.log("✅ Auth Service running on port 5000");
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();