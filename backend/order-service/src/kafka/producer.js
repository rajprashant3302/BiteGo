// backend/order-service/src/kafka/producer.js
const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
  clientId: "order-service", 
  brokers: [process.env.KAFKA_BROKERS || "kafka:9092"], 
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner 
});

let isConnected = false;

const connectProducer = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    console.log("✅ Kafka Producer (Order-Service) Connected");
  } catch (error) {
    console.error("❌ Kafka Producer Connection Failed:", error);
    isConnected = false;
  }
};

/**
 * @param {string} topic - e.g., 'payment-initiated' or 'order-events'
 * @param {object} message - The payload
 */
const publishEvent = async (topic, message) => {
  if (!isConnected) {
    console.warn(`⚠️ Kafka not connected. Re-attempting connection...`);
    await connectProducer();
  }

  try {
    await producer.send({
      topic: topic,
      messages: [
        {
          key: message.orderId || message.userId || "unknown",
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    console.log(`📤 Event Published to [${topic}]`);
  } catch (err) {
    console.error(`❌ Failed to publish to ${topic}:`, err);
  }
};

module.exports = { connectProducer, publishEvent };



// const { Kafka, Partitioners } = require("kafkajs");

// const kafka = new Kafka({
//   // Changed to 'auth-service' to differentiate from 'order-service' in logs
//   clientId: "auth-service", 
//   // Ensure "kafka:9092" is reachable (this works within the Docker network)
//   brokers: [process.env.KAFKA_BROKERS || "kafka:9092"], 
//   retry: {
//     initialRetryTime: 300,
//     retries: 10
//   }
// });

// // Legacy partitioner is recommended for consistency unless you specifically need the new one
// const producer = kafka.producer({
//   createPartitioner: Partitioners.LegacyPartitioner 
// });

// let isConnected = false;

// const connectProducer = async () => {
//   try {
//     await producer.connect();
//     isConnected = true;
//     console.log("✅ Kafka Producer (Auth-Service) Connected");
//   } catch (error) {
//     console.error("❌ Kafka Producer Connection Failed:", error);
//     // Don't exit process; allow the service to run even if Kafka is down
//     isConnected = false;
//   }
// };

// /**
//  * Publish an event to a Kafka topic
//  * @param {string} type - Event type (e.g., 'USER_REGISTERED', 'USER_LOGIN')
//  * @param {object} payload - The data to send
//  */
// const publishEvent = async (type, payload) => {
//   if (!isConnected) {
//     console.warn(`⚠️ Skipping Event [${type}]: Kafka Producer not connected`);
//     return;
//   }

//   try {
//     await producer.send({
//       topic: "auth-events", // Recommended to use service-specific topics
//       messages: [
//         {
//           // Key helps Kafka keep messages for the same user in the same partition
//           key: payload.userId || payload.email || "unknown", 
//           value: JSON.stringify({
//             type,
//             payload,
//             timestamp: new Date().toISOString()
//           })
//         }
//       ]
//     });
//     console.log(`📤 Event Published to Kafka: ${type}`);
//   } catch (err) {
//     console.error("❌ Failed to publish event:", err);
//   }
// };

// module.exports = { connectProducer, publishEvent };