const cron = require('node-cron');
const { redisClient } = require('redis-client');
const UserLocationModel = require('../models/userLocationModel'); // Your Mongoose schema

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
    console.log("Starting 10-min User Location DB Sync...");
    try {
        // Get all user location keys from Redis
        const keys = await redisClient.keys('user:loc:*');
        if (keys.length === 0) return;

        const bulkOps = [];

        for (const key of keys) {
            const userId = key.split(':')[2];
            const locData = await redisClient.hGetAll(key);

            if (locData && locData.lat && locData.lng) {
                bulkOps.push({
                    updateOne: {
                        filter: { userId: userId },
                        update: {
                            $set: {
                                location: {
                                    type: 'Point',
                                    coordinates: [parseFloat(locData.lng), parseFloat(locData.lat)] // MongoDB needs lng first
                                },
                                lastUpdated: new Date(parseInt(locData.lastUpdated))
                            }
                        },
                        upsert: true // Insert if it doesn't exist, update if it does
                    }
                });
            }
        }

        // Execute all updates in a single database call
        if (bulkOps.length > 0) {
            await UserLocationModel.bulkWrite(bulkOps);
            console.log(`Synced ${bulkOps.length} user locations to MongoDB.`);
        }

    } catch (error) {
        console.error("Error during user location sync:", error);
    }
});