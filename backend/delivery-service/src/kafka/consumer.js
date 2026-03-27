const { kafka } = require("./client");

const consumers = [];

/**
 * Start a Kafka consumer for specific topics
 * @param {string} groupId - The consumer group ID
 * @param {string[]} topics - Array of topics to subscribe to
 * @param {function} messageHandler - Callback function(topic, parsedMessage)
 */
const startConsumer = async (groupId, topics, messageHandler) => {
  const consumer = kafka.consumer({ groupId });

  try {
    await consumer.connect();
    console.log(`✅ Kafka Consumer connected (Group: ${groupId})`);

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`📡 Subscribed to topic: ${topic}`);
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = JSON.parse(message.value.toString());
          // Pass the data back to wherever this consumer was initialized
          await messageHandler(topic, value);
        } catch (err) {
          console.error(`❌ Error processing message from ${topic}:`, err);
        }
      },
    });

    consumers.push(consumer);
  } catch (error) {
    console.error(`❌ Kafka Consumer setup failed for group ${groupId}:`, error);
  }
};

const disconnectConsumers = async () => {
  for (const consumer of consumers) {
    await consumer.disconnect();
  }
  console.log("🛑 All Kafka Consumers disconnected");
};

module.exports = { startConsumer, disconnectConsumers };