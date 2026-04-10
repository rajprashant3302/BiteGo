const { Kafka, Partitioners } = require('kafkajs'); // FIXED: Imported Partitioners

// Initialize the Kafka broker connection
const kafka = new Kafka({
  clientId: 'graphql-gateway', 
  // FIXED: Changed fallback from localhost to kafka
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'], 
});

// FIXED: Passed legacy partitioner to silence the warning
const kafkaProducer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// Connect the producer once when the file loads
(async () => {
  try {
    await kafkaProducer.connect();
    console.log('✅ Kafka Producer Connected');
  } catch (err) {
    console.error('❌ Failed to connect Kafka Producer:', err);
  }
})();

module.exports = kafkaProducer;