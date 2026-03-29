const { Server } = require("socket.io");
const { redisClient } = require("redis-client");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 New Socket Connection: ${socket.id}`);

        // --- DRIVER LOGIC ---
        socket.on("driver_online", async (data) => {
            const { driverId } = data;
            // Store online status in Redis (super fast lookups for random assignment)
            await redisClient.hSet("online_drivers", driverId, socket.id);
            console.log(`🚚 Driver ${driverId} is online.`);
        });

        socket.on("driver_offline", async (data) => {
            const { driverId } = data;
            await redisClient.hDel("online_drivers", driverId);
        });

        // Driver accepts the broadcasted order
        socket.on("accept_order", async (data) => {
            const { orderId, driverId } = data;
            const { handleDriverAcceptance } = require('../services/assignmentManager');
            await handleDriverAcceptance(orderId, driverId, socket.id);
        });

        // Driver app continuously sends location here
        socket.on("driver_location_update", async (data) => {
            const { orderId, driverId, lat, lng } = data;

            console.log(`📍 Loc Update for Room: track_${orderId} | Lat: ${lat} Lng: ${lng}`);

            // 1. Broadcast ONLY to the user tracking this specific order (Ultra-fast UI update)
            io.to(`track_${orderId}`).emit("location_update", {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                driverId: driverId
            });

            // 2. 🔥 NEW: Save to Redis & Kafka for your background worker!
            if (driverId) {
                try {
                    const timestamp = Date.now();

                    // Instantly update Redis (replaces your locationController logic)
                    await redisClient.hSet(`driver:loc:${driverId}`, {
                        lat: lat.toString(),
                        lng: lng.toString(),
                        lastUpdated: timestamp.toString()
                    });

                    // Fire and forget to Kafka for the 30s MongoDB flush
                    const { publishEvent } = require('../kafka/producer');
                    publishEvent("driver-location-updates", {
                        driverId,
                        lat,
                        lng,
                        timestamp
                    }).catch(err => console.error("Kafka location publish failed", err));

                } catch (error) {
                    console.error("Failed to log driver location via socket:", error);
                }
            }
        });

        // --- USER LOGIC ---
        socket.on("join_tracking_room", (data) => {
            const { orderId } = data;
            socket.join(`track_${orderId}`);
            console.log(`👤 User joined tracking room: track_${orderId}`);
        });

        socket.on("disconnect", () => {
            console.log(`❌ Socket Disconnected: ${socket.id}`);
            // Note: You'd ideally clean up the Redis 'online_drivers' here if it was a driver
        });
    });

    return io;
};

const getIo = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

module.exports = { initSocket, getIo };