const { getIo } = require('../socket/socket');
const { redisClient } = require('redis-client');
const { publishEvent } = require('../kafka/producer');

// Store active intervals in memory so we can cancel them if a driver accepts
const activeAssignmentIntervals = new Map();

const broadcastNewOrder = async (orderData) => {
    const io = getIo();
    const { orderId } = orderData;

    console.log(`📢 Initial Broadcast: Order ${orderId} to all online drivers`);
    
    // 1. Immediate first alert
    io.emit("new_delivery_request", orderData);

    let ticks = 0;
    const maxTicks = 8; // 8 ticks * 30 seconds = 240 seconds (4 minutes)

    // 2. Set the 30-second repeating loop
    const intervalId = setInterval(async () => {
        ticks++;

        if (ticks >= maxTicks) {
            // --- TIME'S UP (4 Minutes) ---
            console.log(`⏰ 4 mins passed for ${orderId}. Assigning randomly...`);
            
            // Clear the loop and remove from memory
            clearInterval(intervalId);
            activeAssignmentIntervals.delete(orderId);

            // Get all online drivers from Redis
            const onlineDriversMap = await redisClient.hGetAll("online_drivers");
            const driverIds = Object.keys(onlineDriversMap);

            if (driverIds.length > 0) {
                // Pick a random driver
                const randomDriverId = driverIds[Math.floor(Math.random() * driverIds.length)];
                const driverSocketId = onlineDriversMap[randomDriverId];

                await assignOrderToDriver(orderId, randomDriverId);
                
                // Notify the unlucky (or lucky!) driver directly
                io.to(driverSocketId).emit("forced_assignment", { orderId });
            } else {
                console.log(`🚨 No online drivers available for Order ${orderId}!`);
                // Here you'd trigger a refund or alert ops
            }
        } else {
            // --- NAG THEM AGAIN ---
            console.log(`📢 Re-broadcasting Order ${orderId} (Attempt ${ticks + 1}/${maxTicks})`);
            io.emit("new_delivery_request", orderData);
        }
    }, 30000); // 30,000 ms = 30 seconds

    // Save the interval ID so we can stop it when someone accepts
    activeAssignmentIntervals.set(orderId, intervalId);
};

const handleDriverAcceptance = async (orderId, driverId, socketId) => {
    // 1. Check if order is still available (the interval is still running)
    if (activeAssignmentIntervals.has(orderId)) {
        
        // STOP THE BEEPING! Clear the interval
        clearInterval(activeAssignmentIntervals.get(orderId));
        activeAssignmentIntervals.delete(orderId);

        await assignOrderToDriver(orderId, driverId);

        // Tell this driver they got it
        getIo().to(socketId).emit("assignment_success", { orderId });
        
        // Tell everyone else it's gone so their UI can remove the popup
        getIo().emit("order_taken", { orderId });
    } else {
        // If they clicked accept but the interval is gone, they were too late
        getIo().to(socketId).emit("assignment_failed", { reason: "Too late, already taken!" });
    }
};

const assignOrderToDriver = async (orderId, driverId) => {
    console.log(`✅ Order ${orderId} assigned to Driver ${driverId}`);
    
    // Update DB (via Kafka so Order Service knows too)
    await publishEvent("order-assigned", { orderId, driverId});

    // Tell the User on the tracking page that a driver was found!
    getIo().to(`track_${orderId}`).emit("status_update", { 
        status: "Driver Assigned", 
        driverId 
    });
};

module.exports = { broadcastNewOrder, handleDriverAcceptance };