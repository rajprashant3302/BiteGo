// src/index.js
require("dotenv").config();
const { Kafka } = require("kafkajs");
const fs = require("fs");

// Import Handlers
const {handleAuthEvent} = require("./handlers/authHandler");
const handleOrderEvent = require("./handlers/orderHandler");
const handleInvoiceEvent = require("./handlers/invoiceHandler");

const HEALTH_FILE = "/tmp/mailer-service.healthy";
const TOPICS = ["auth-events", "send-invite-email", "order-events", "payment-events"];

const markHealthy = () => {
  try {
    fs.writeFileSync(HEALTH_FILE, new Date().toISOString());
  } catch (err) {
    console.error("Failed to write mailer health file:", err.message);
  }
};

const kafka = new Kafka({
  clientId: "mailer-service",
  brokers: ["kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "mailer-group" });

const start = async () => {
  try {
    console.log("⏳ Connecting to Kafka...");
    await consumer.connect();
    
    for (const topic of TOPICS) {
      await consumer.subscribe({
        topic,
        fromBeginning: false,
      });
      console.log(`📡 Mailer subscribed to ${topic}`);
    }

    console.log("Mailer Service Listening...");
    markHealthy();
    setInterval(markHealthy, 30000);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log(` Received ${topic}: ${event.type || event.event || "unknown"}`);

        // ROUTING LOGIC
        switch (topic) {
          case "auth-events":
          case "send-invite-email":
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
    process.exit(1);
  }
};

start();
