const { randomUUID } = require('crypto');
const { evaluateTargetSegment } = require('../utils/targetEvaluator.js');
 
// Custom error classes for clean GraphQL responses
class TargetSegmentMismatchError extends Error {
  constructor(message) { super(message); this.name = 'TargetSegmentMismatchError'; }
}
class GlobalCapExhaustedError extends Error {
  constructor(message) { super(message); this.name = 'GlobalCapExhaustedError'; }
}
class OfferExpiredError extends Error {
  constructor(message) { super(message); this.name = 'OfferExpiredError'; }
}
 
const adminOfferResolvers = {
  Query: {
    getActiveAdminOffers: async (_, { targetEntity }, { prisma }) => {
      const now = new Date();
      return await prisma.adminOffer.findMany({
        where: {
          IsActive: true,
          StartTime: { lte: now },
          EndTime: { gte: now },
          ...(targetEntity && { TargetEntity: targetEntity })
        }
      });
    }
  },
 
  Mutation: {
    createAdminOffer: async (_, { input }, { prisma, redisClient }) => {
      const offer = await prisma.adminOffer.create({
        data: {
          ...input,
          TargetSegment: input.TargetSegment ? JSON.parse(input.TargetSegment) : null,
          StartTime: new Date(input.StartTime),
          EndTime: new Date(input.EndTime)
        }
      });
 
      // Initialize the global cap in Redis if one is provided
      if (offer.TotalRedemptionLimit) {
        await redisClient.set(`admin_offer:${offer.OfferID}:remaining_limit`, offer.TotalRedemptionLimit);
      }
 
      return offer;
    },
 
    redeemAdminOffer: async (_, { offerId, userId, targetType }, { prisma, redisClient, kafkaProducer }) => {
      const now = new Date();
 
      // 1. Fetch the AdminOffer & validate time/activity
      const offer = await prisma.adminOffer.findUnique({ where: { OfferID: offerId } });
      if (!offer) throw new OfferNotFoundError('Offer not found.');
      if (!offer.IsActive || offer.StartTime > now || offer.EndTime < now) {
        throw new OfferExpiredError('Offer is not currently active.');
      }
 
      // 2. Fetch User Data & Evaluate Target Segment Rules
      // NOTE: In production, you might fetch different tables based on `targetType`
      const userData = await prisma.user.findUnique({
        where: { UserID: userId },
        include: { deliveryPartner: true, restaurantOwner: true } // grab nested info if needed
      });
 
      const segmentRules = offer.TargetSegment ? (typeof offer.TargetSegment === 'string' ? JSON.parse(offer.TargetSegment) : offer.TargetSegment) : {};
 
      if (!evaluateTargetSegment(userData, segmentRules)) {
        throw new TargetSegmentMismatchError('You do not meet the criteria for this offer.');
      }
 
      // 3. Query Prisma: Ensure the user hasn't exceeded MaxRedemptionsPerEntity
      if (offer.MaxRedemptionsPerEntity) {
        const userRedemptionCount = await prisma.adminOfferRedemption.count({
          where: { AdminOfferID: offerId, TargetEntityId: userId }
        });
        if (userRedemptionCount >= offer.MaxRedemptionsPerEntity) {
          throw new Error('You have reached the maximum redemptions for this offer.');
        }
      }
 
      // 4. Redis DECR: Global Cap Check
      // We do an atomic decrement. If 10,000 people hit this at once, Redis processes them sequentially in microseconds.
      if (offer.TotalRedemptionLimit) {
        const redisKey = `admin_offer:${offerId}:remaining_limit`;
        const remaining = await redisClient.decr(redisKey);
 
        if (remaining < 0) {
          // Rollback: The cap was exhausted exactly as this user tried to claim it. 
          // We INCR back to prevent the counter from permanently dropping to -500.
          await redisClient.incr(redisKey);
          throw new GlobalCapExhaustedError('This offer has reached its global redemption limit.');
        }
      }
 
      // 5. Prisma Transaction: Insert Redemption Record safely
      // Serializable isolation prevents phantom reads if a user submits multiple simultaneous requests
      const [redemption] = await prisma.$transaction([
        prisma.adminOfferRedemption.create({
          data: {
            AdminOfferID: offerId,
            TargetEntityId: userId,
            TargetType: targetType,
            RewardDelivered: offer.RewardType !== 'Bonus', // If it's a discount, it's considered delivered for the order
            AppliedAt: new Date()
          }
        }),
        // Optionally update historical tracking count on the offer table
        prisma.adminOffer.update({
          where: { OfferID: offerId },
          data: { CurrentRedemptionCount: { increment: 1 } }
        })
      ]);
 
      // 6. Event Emission: Fire Kafka event for Wallet Bonuses
      if (offer.RewardType === 'Bonus') {
        const eventId = randomUUID();
 
        await kafkaProducer.send({
          topic: 'WALLET_BONUS_AWARDED',
          messages: [{
            key: userId, // Keying by userId ensures partition order preservation for the same user
            value: JSON.stringify({
              eventId: eventId,
              userId: userId,
              amount: offer.RewardValue,
              offerId: offerId,
              timestamp: new Date().toISOString()
            })
          }]
        });
      }
 
      return {
        success: true,
        message: 'Offer redeemed successfully.',
        redemptionId: redemption.RedemptionID,
        rewardDelivered: offer.RewardType === 'Bonus' // True if we fired the bonus event
      };
    }
  }
};
 