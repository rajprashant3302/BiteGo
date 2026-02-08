// src/index.js
require("dotenv").config();
const { Kafka } = require("kafkajs");

// Import Handlers
const handleAuthEvent = require("./handlers/authHandler");
const handleOrderEvent = require("./handlers/orderHandler");
const handleInvoiceEvent = require("./handlers/invoiceHandler");

const kafka = new Kafka({
  clientId: "mailer-service",
  brokers: ["kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "mailer-group" });

const start = async () => {
  try {
    console.log("⏳ Connecting to Kafka...");
    await consumer.connect();
    
    // Subscribe to all relevant topics
    await consumer.subscribe({ 
      topics: ["auth-events", "order-events", "payment-events"], 
      fromBeginning: true 
    });

    console.log("Mailer Service Listening...");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log(` Received ${topic}: ${event.type}`);

        // ROUTING LOGIC
        switch (topic) {
          case "auth-events":
            await handleAuthEvent(event);
            break;
            
          case "order-events":
            await handleOrderEvent(event);
            break;
            
          case "payment-events": // Usually where invoices come from
            await handleInvoiceEvent(event);
            break;
            
          default:
            console.warn(`❓ No handler for topic: ${topic}`);
        }
      },
    });
  } catch (err) {
    console.error("❌ Kafka Consumer Error:", err);
  }
};

start();