import { Kafka } from 'kafkajs';
const prisma = require('database');

const kafka = new Kafka({ clientId: 'promotion-service', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'promotion-group' });

export const startOrderCompletedConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-completed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      console.log(`[Kafka] Order completed event received for Order: ${data.orderId}`);
      
      // If order had offers, increment their usage counts
    //   if (data.appliedOffers && data.appliedOffers.length > 0) {
    //     for (const offer of data.appliedOffers) {
    //       await prisma.adminOffer.update({
    //         where: { OfferID: offer.offerId },
    //         data: { CurrentRedemptionCount: { increment: 1 } }
    //       });
    //     }
    //   }
    },
  });
};