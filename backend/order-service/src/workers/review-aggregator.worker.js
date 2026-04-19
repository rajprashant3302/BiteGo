// backend/order-service/src/workers/review-aggregator.worker.js

const { Kafka } = require('kafkajs');
const { prisma } = require('database'); // Your shared database package
const redis = require('redis-client'); // Adjust if you use a different redis client

// Initialize Connections
const kafka = new Kafka({
  clientId: 'bitego-review-worker', 
  brokers: [process.env.KAFKA_BROKERS || "kafka:9092"], 
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const consumer = kafka.consumer({ groupId: 'review-aggregation-group' });

async function runReviewAggregator() {
  try {
    await consumer.connect();
    console.log('[WORKER] Connected to Kafka successfully.');

    // Subscribe to the exact topic your GraphQL gateway is producing to
    await consumer.subscribe({ topic: 'REVIEW_EVENTS', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());

          if (event.type === 'REVIEW_CREATED') {
            console.log(`[WORKER] Processing new review for Order: ${message.key.toString()}`);
            await processNewReview(event.data);
          }
        } catch (err) {
          console.error('[WORKER] Error parsing Kafka message:', err);
        }
      },
    });
  } catch (error) {
    console.error('[WORKER] Fatal error in Kafka Consumer:', error);
  }
}

/**
 * Core Logic: Calculate new averages and update DB + Redis
 */
async function processNewReview(data) {
  const { restaurantId, deliveryPartnerId } = data;

  // ==========================================
  // 1. UPDATE RESTAURANT RATING
  // ==========================================
  if (restaurantId) {
    // Let PostgreSQL do the heavy math
    const restaurantAgg = await prisma.review.aggregate({
      _avg: { RatingRestaurant: true },
      where: { RestaurantID: restaurantId }
    });

    const newRestaurantRating = restaurantAgg._avg.RatingRestaurant || 0;

    // Save permanently to the Restaurant table
    await prisma.restaurant.update({
      where: { RestaurantID: restaurantId },
      data: { Rating: newRestaurantRating }
    });

    // Cache in Redis for lightning-fast frontend reads
    // The Next.js app will read this key when rendering the RestaurantCard
    await redis.set(`restaurant:${restaurantId}:rating`, newRestaurantRating, 'EX', 3600); // Expires in 1 hour
    
    console.log(`[WORKER] Updated Restaurant ${restaurantId} rating to ${newRestaurantRating}`);
  }

  // ==========================================
  // 2. UPDATE DELIVERY PARTNER RATING
  // ==========================================
  if (deliveryPartnerId) {
    // Wait for the delivery partner average
    const driverAgg = await prisma.review.aggregate({
      _avg: { RatingDelivery: true },
      where: { DeliveryPartnerID: deliveryPartnerId }
    });

    const newDriverRating = driverAgg._avg.RatingDelivery || 0;

    // Note: You may need to add a `Rating` or `AverageRating` column to your 
    // DeliveryPartner Prisma model if you haven't already!
    
    /* await prisma.deliveryPartner.update({
      where: { DeliveryPartnerID: deliveryPartnerId },
      data: { AverageRating: newDriverRating }
    });
    */

    await redis.set(`driver:${deliveryPartnerId}:rating`, newDriverRating, 'EX', 3600);
    console.log(`[WORKER] Updated Driver ${deliveryPartnerId} rating to ${newDriverRating}`);
  }
}

// Start the worker
runReviewAggregator().catch(console.error);

module.exports = { runReviewAggregator };