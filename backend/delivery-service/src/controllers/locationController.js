const { redisClient } = require("redis-client"); // Adjust your path
const { publishEvent } = require("../kafka/producer"); // Adjust your path

// STEP 1: User Location
const updateUserLocation = async (req, res) => {
    try {
        const { userId, lat, lng } = req.body;
        if (!userId || !lat || !lng) {
            return res.status(400).json({ error: "Missing location data" });
        }

        // Store in Redis (overwrites previous location, fast read/write)
        // Storing as a hash for easy retrieval
        await redisClient.hSet(`user:loc:${userId}`, {
            lat: lat.toString(),
            lng: lng.toString(),
            lastUpdated: Date.now().toString()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("User location error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// STEP 2: Driver Location
const updateDriverLocation = async (req, res) => {
    try {
        const { driverId, lat, lng } = req.body;
        if (!driverId || !lat || !lng) {
            return res.status(400).json({ error: "Missing location data" });
        }

        const timestamp = Date.now();

        // 1. Instantly update Redis for real-time tracking (Prepping for Step 4)
        await redisClient.hSet(`driver:loc:${driverId}`, {
            lat: lat.toString(),
            lng: lng.toString(),
            lastUpdated: timestamp.toString()
        });

        // 2. Push to Kafka for the 30s optimized batch write to DB (History)
        await publishEvent("driver-location-updates", {
            driverId,
            lat,
            lng,
            timestamp
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Driver location error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    updateUserLocation,
    updateDriverLocation
};