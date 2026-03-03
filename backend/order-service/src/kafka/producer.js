// backend/auth-service/src/kafka/producer.js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["kafka:9092"], 
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log("✅ Kafka Producer Connected");
};

const publishEvent = async (type, payload) => {
  try {
    await producer.send({
      topic: "order-events",
      messages: [
        {
          key: payload.email || "unknown", 
          value: JSON.stringify({
            type,
            payload,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    console.log(`📤 Event Published: ${type}`);
  } catch (err) {
    console.error("❌ Failed to publish event:", err);
  }
};

module.exports = { connectProducer, publishEvent };