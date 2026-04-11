import { Kafka } from 'kafkajs';

const kafka = new Kafka({ 
  clientId: 'promotion-service-producer', 
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] 
});

const producer = kafka.producer();

export const publishPromotionEvent = async (topic: string, message: any) => {
  try {
    await producer.connect();
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`[Kafka] Published event to ${topic}`);
  } catch (error) {
    console.error(`[Kafka] Failed to publish to ${topic}:`, error);
  } finally {
    await producer.disconnect();
  }
};