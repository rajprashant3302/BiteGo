// kafka/consumer.js (Order Service)
const { Kafka } = require('kafkajs');
const { prisma } = require("database");

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'order-processing-group' });

const connectConsumer = async (io) => {
  await consumer.connect();
  
  // Subscribe to the topic emitted by the payment service
  await consumer.subscribe({ topic: 'payment-success', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (topic === 'payment-success') {
          const eventData = JSON.parse(message.value.toString());
          console.log(`[Kafka] Received payment success for Order: ${eventData.orderId}`);

          // 1. Update the Order Status to 'Preparing'
          const updatedOrder = await prisma.orders.update({
            where: { OrderID: eventData.orderId },
            data: { OrderStatus: 'Preparing' },
            include: { restaurant: true }
          });

          // 2. Emit real-time Socket.io updates
          if (io) {
            // Notify the user that their payment went through and food is being prepared
            io.to(`user_${eventData.userId}`).emit('order_status_update', {
              orderId: eventData.orderId,
              status: 'Preparing',
              message: `Payment successful! ${updatedOrder.restaurant.Name} is preparing your order.`
            });

            // Notify the restaurant dashboard to print the ticket/start cooking
            io.to(`restaurant_${updatedOrder.RestaurantID}`).emit('new_order_received', {
              orderId: eventData.orderId,
              message: "New paid order received!"
            });
          }
        }
      } catch (error) {
        console.error(`[Kafka] Error processing message from topic ${topic}:`, error);
        // Depending on your setup, you might want to implement a dead-letter queue here
      }
    },
  });
};

module.exports = { connectConsumer };