const { startConsumer } = require('../kafka/consumer');
const { broadcastNewOrder } = require('../services/assignmentManager'); // The file we made in Step 3

const handleNewOrders = async (topic, messageData) => {
    if (topic === 'order-confirmed') {
        console.log(`🍔 Delivery Service: Order ${messageData.orderId} confirmed! Searching for drivers...`);
        
        // Trigger the Socket.io broadcast to all online drivers!
        await broadcastNewOrder({
            orderId: messageData.orderId,
            restaurantId: messageData.restaurantId,
            userId: messageData.userId
        });
    }
};

const setupOrderConsumer = async () => {
    await startConsumer(
        'delivery-order-assignment-group', // New group ID
        ['order-confirmed'],               // Listen to confirmed orders
        handleNewOrders
    );
    console.log("🎯 Order Assignment Consumer Initialized.");
};

module.exports = { setupOrderConsumer };