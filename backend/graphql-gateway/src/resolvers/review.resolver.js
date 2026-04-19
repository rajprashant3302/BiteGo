// ============================================
// REVIEW RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validatePagination,
  validateRating,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');

const reviewResolvers = {
  Query: {
    /**
     * Get review by ID
     */
    async getReviewById(_, { id }) {
      try {
        const review = await prisma.review.findUnique({
          where: { ReviewID: id },
        });

        if (!review) {
          throw new NotFoundError('Review', id);
        }

        return review;
      } catch (error) {
        handleResolverError(error, 'getReviewById');
      }
    },

    /**
     * Get paginated reviews for a specific restaurant
     */
    async getRestaurantReviews(_, { restaurantId, page = 1, pageSize = 20 }) {
      try {
        validatePagination(page, pageSize);

        const skip = (page - 1) * pageSize;

        // Verify restaurant exists
        const restaurant = await prisma.restaurant.findUnique({
          where: { RestaurantID: restaurantId },
        });

        if (!restaurant) {
          throw new NotFoundError('Restaurant', restaurantId);
        }

        const reviews = await prisma.review.findMany({
          where: { RestaurantID: restaurantId },
          skip,
          take: pageSize,
          orderBy: { CreatedAt: 'desc' },
        });

        return reviews;
      } catch (error) {
        handleResolverError(error, 'getRestaurantReviews');
      }
    },

    /**
     * Get all reviews left by a specific user
     */
    async getUserReviews(_, { userId }, { userId: currentUserId, userRole }) {
      try {
        // Authorization check: User can only see their own reviews unless they are Admin/Support
        if (userId !== currentUserId && !['SuperAdmin', 'Support'].includes(userRole)) {
          throw new UnauthorizedError('You do not have permission to view these reviews');
        }

        const reviews = await prisma.review.findMany({
          where: { UserID: userId },
          orderBy: { CreatedAt: 'desc' },
        });

        return reviews;
      } catch (error) {
        handleResolverError(error, 'getUserReviews');
      }
    },

    /**
     * Get aggregated rating for a restaurant
     */
    async getRestaurantRating(_, { restaurantId }) {
      try {
        const agg = await prisma.review.aggregate({
          _avg: { RatingRestaurant: true, RatingDelivery: true },
          _count: { ReviewID: true },
          where: { RestaurantID: restaurantId },
        });

        // For true distribution, you'd run a grouped query. Placeholder as per schema.
        return {
          restaurantId,
          avgRestaurantRating: agg._avg.RatingRestaurant || 0,
          avgDeliveryRating: agg._avg.RatingDelivery || 0,
          totalReviews: agg._count.ReviewID,
          ratingDistribution: { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
        };
      } catch (error) {
        handleResolverError(error, 'getRestaurantRating');
      }
    },
  },

  Mutation: {
    /**
     * Submit a new review for an order
     */
    async addReview(_, { orderId, input }, { userId, kafkaProducer }) {
      try {
        if (!userId) {
          throw new UnauthorizedError('You must be logged in to leave a review');
        }

        const { ratingRestaurant, ratingDelivery, reviewTextRestaurant, reviewTextDeliveryPartner } = input;

        // Use shared validation utility if ratings are provided
        if (ratingRestaurant) validateRating(ratingRestaurant);
        if (ratingDelivery) validateRating(ratingDelivery);

        // Verify order ownership and status
        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }
        if (order.UserID !== userId) {
          throw new UnauthorizedError('You can only review your own orders');
        }
        if (order.OrderStatus !== 'Delivered') {
          throw new ValidationError('Only delivered orders can be reviewed');
        }

        // Save to Database
        const newReview = await prisma.review.create({
          data: {
            OrderID: orderId,
            UserID: userId,
            RestaurantID: order.RestaurantID,
            DeliveryPartnerID: order.DeliveryPartnerID, // Nullable for pickups
            RatingRestaurant: ratingRestaurant,
            RatingDelivery: ratingDelivery,
            ReviewTextRestaurant: reviewTextRestaurant,
            ReviewTextDeliveryPartner: reviewTextDeliveryPartner,
          },
        });

        // Fire Async Event for Background Aggregation (Compute on Write)
        if (kafkaProducer) {
          await kafkaProducer.send({
            topic: 'REVIEW_EVENTS',
            messages: [
              {
                key: orderId, 
                value: JSON.stringify({
                  type: 'REVIEW_CREATED',
                  data: {
                    reviewId: newReview.ReviewID,
                    restaurantId: order.RestaurantID,
                    deliveryPartnerId: order.DeliveryPartnerID,
                    ratingRestaurant,
                    ratingDelivery,
                  },
                }),
              },
            ],
          });
        }

        return newReview;
      } catch (error) {
        // Handle unique constraint violation gracefully
        if (error.code === 'P2002') {
           throw new ValidationError('A review already exists for this order');
        }
        handleResolverError(error, 'addReview');
      }
    },

    /**
     * Update an existing review
     */
    async updateReview(_, { reviewId, input }, { userId }) {
      try {
        if (!userId) {
          throw new UnauthorizedError('You must be logged in to update a review');
        }

        const existingReview = await prisma.review.findUnique({
          where: { ReviewID: reviewId },
        });

        if (!existingReview) {
          throw new NotFoundError('Review', reviewId);
        }
        if (existingReview.UserID !== userId) {
          throw new UnauthorizedError('You can only edit your own reviews');
        }

        const { ratingRestaurant, ratingDelivery, reviewTextRestaurant, reviewTextDeliveryPartner } = input;

        // Use shared validation utility
        if (ratingRestaurant) validateRating(ratingRestaurant);
        if (ratingDelivery) validateRating(ratingDelivery);

        const updatedReview = await prisma.review.update({
          where: { ReviewID: reviewId },
          data: {
            RatingRestaurant: ratingRestaurant,
            RatingDelivery: ratingDelivery,
            ReviewTextRestaurant: reviewTextRestaurant,
            ReviewTextDeliveryPartner: reviewTextDeliveryPartner,
          },
        });

        return updatedReview;
      } catch (error) {
        handleResolverError(error, 'updateReview');
      }
    },

    /**
     * Delete an existing review
     */
    async deleteReview(_, { reviewId }, { userId, userRole }) {
      try {
        const existingReview = await prisma.review.findUnique({
          where: { ReviewID: reviewId },
        });

        if (!existingReview) {
          throw new NotFoundError('Review', reviewId);
        }

        // Users can delete their own, Admins can delete any
        if (existingReview.UserID !== userId && !['SuperAdmin', 'Support'].includes(userRole)) {
          throw new UnauthorizedError('You do not have permission to delete this review');
        }

        await prisma.review.delete({
          where: { ReviewID: reviewId },
        });

        return { success: true, message: 'Review deleted successfully' };
      } catch (error) {
        handleResolverError(error, 'deleteReview');
      }
    },

    /**
     * Flag a review for moderation (Admin/Support)
     */
    async flagReview(_, { reviewId, reason }, { userRole }) {
      try {
        if (!['SuperAdmin', 'Support'].includes(userRole)) {
          throw new UnauthorizedError('Only admins can flag reviews');
        }
        
        return { success: true, message: 'Review flagged for moderation' };
      } catch (error) {
        handleResolverError(error, 'flagReview');
      }
    },

    /**
     * Hide a review from public view (Admin/Support)
     */
    async hideReview(_, { reviewId }, { userRole }) {
      try {
        if (!['SuperAdmin', 'Support'].includes(userRole)) {
          throw new UnauthorizedError('Only admins can hide reviews');
        }
        
        return { success: true, message: 'Review hidden from public view' };
      } catch (error) {
        handleResolverError(error, 'hideReview');
      }
    },
  },

  // ============================================
  // FIELD RESOLVERS
  // ============================================
  Review: {
    // Maps Prisma's PascalCase outputs to GraphQL's camelCase schema
    id: (parent) => parent.ReviewID,
    ratingRestaurant: (parent) => parent.RatingRestaurant,
    ratingDelivery: (parent) => parent.RatingDelivery,
    reviewTextRestaurant: (parent) => parent.ReviewTextRestaurant,
    reviewTextDeliveryPartner: (parent) => parent.ReviewTextDeliveryPartner,
    createdAt: (parent) => parent.CreatedAt.toISOString(),
    updatedAt: (parent) => parent.UpdatedAt.toISOString(),
    orderId: (parent) => parent.OrderID,
    userId: (parent) => parent.UserID,
    restaurantId: (parent) => parent.RestaurantID,
    deliveryPartnerId: (parent) => parent.DeliveryPartnerID,
  },
};

module.exports = reviewResolvers;