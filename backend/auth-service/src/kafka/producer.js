const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "auth-service",
  brokers: ["kafka:9092"],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer();

const connectProducer = async () => {
  let connected = false;

  while (!connected) {
    try {
      console.log("Trying to connect to Kafka...");
      await producer.connect();
      connected = true;
      console.log("Kafka Producer Connected");
    } catch (err) {
      console.error("Kafka not ready, retrying in 3s...");
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

const publishEvent = async (type, payload) => {
  await producer.send({
    topic: "auth-events",
    messages: [
      {
        value: JSON.stringify({
          type,
          payload,
          timestamp: new Date().toISOString()
        })
      }
    ]
  });
};

module.exports = { connectProducer, publishEvent };
