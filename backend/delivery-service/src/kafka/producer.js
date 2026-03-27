const { kafka, Partitioners } = require("./client");

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

let isConnected = false;

const connectProducer = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log("✅ Kafka Producer (Delivery-Service) Connected");
  } catch (error) {
    console.error("❌ Kafka Producer Connection Failed:", error);
    isConnected = false;
  }
};

/**
 * Publish an event to any Kafka topic
 * @param {string} topic - The Kafka topic (e.g., 'driver-location-updates')
 * @param {object} payload - The data to send
 */
const publishEvent = async (topic, payload) => {
  if (!isConnected) {
    console.warn(`⚠️ Skipping Event [${topic}]: Kafka Producer not connected`);
    return;
  }

  try {
    await producer.send({
      topic: topic,
      messages: [
        {
          // Key ensures messages for the same driver/user go to the same partition for ordering
          key: payload.driverId || payload.userId || payload.orderId || "default-key",
          value: JSON.stringify(payload)
        }
      ]
    });
    // Optional: console.log(`📤 Event Published to Kafka topic: ${topic}`);
  } catch (err) {
    console.error(`❌ Failed to publish event to ${topic}:`, err);
  }
};

const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log("🛑 Kafka Producer disconnected");
  }
};

module.exports = { connectProducer, publishEvent, disconnectProducer };