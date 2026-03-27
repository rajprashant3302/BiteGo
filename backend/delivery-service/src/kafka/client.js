const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
  clientId: "delivery-service", 
  brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

module.exports = { kafka, Partitioners };