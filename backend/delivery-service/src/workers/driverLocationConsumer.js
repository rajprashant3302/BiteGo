const { startConsumer } = require('../kafka/consumer');
const DriverLocationHistoryModel = require('../models/driverLocationHistoryModel');

let locationBuffer = [];

// The callback that runs every time a Kafka message is received
const handleLocationMessages = async (topic, messageData) => {
    if (topic === 'driver-location-updates') {
        locationBuffer.push({
            driverId: messageData.driverId,
            location: {
                type: 'Point',
                coordinates: [parseFloat(messageData.lng), parseFloat(messageData.lat)]
            },
            timestamp: new Date(messageData.timestamp)
        });
    }
};

// Wrapper function to initialize the consumer
const setupDriverLocationWorker = async () => {
    await startConsumer(
        'delivery-service-group',       // Group ID
        ['driver-location-updates'],    // Topics array
        handleLocationMessages          // The callback function
    );
    console.log("🚚 Driver Location Background Worker Initialized.");
};

// 30-second interval to flush buffer to DB
setInterval(async () => {
    if (locationBuffer.length > 0) {
        const batchToInsert = [...locationBuffer];
        locationBuffer = []; // Clear buffer for next batch immediately

        try {
            // Highly optimized bulk insert for history tracking
            await DriverLocationHistoryModel.insertMany(batchToInsert);
            console.log(`💾 Flushed ${batchToInsert.length} driver locations to DB.`);
        } catch (error) {
            console.error("Failed to insert driver locations:", error);
            // Optional: push failed batch back to buffer if you don't want to lose data
            // locationBuffer.push(...batchToInsert); 
        }
    }
}, 30000); // 30 seconds

module.exports = { setupDriverLocationWorker };