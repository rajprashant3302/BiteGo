// ============================================
// DELIVERY & REVIEW RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validateRating,
  calculateDistance,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');
const { Decimal } = require('@prisma/client/runtime/library');

const deliveryAndReviewResolvers = {
  Query: {
    /**
     * Get delivery partner by ID
     */
    async getDeliveryPartnerById(_, { id }) {
      try {
        const partner = await prisma.deliveryPartner.findUnique({
          where: { DeliveryPartnerID: id },
          include: {
            user: true,
            orders: { take: 10 },
          },
        });

        if (!partner) {
          throw new NotFoundError('Delivery Partner', id);
        }

        return formatDeliveryPartnerResponse(partner);
      } catch (error) {
        handleResolverError(error, 'getDeliveryPartnerById');
      }
    },

    /**
     * Get available delivery partners near location
     */
    async getAvailableDeliveryPartners(_, { latitude, longitude, radius = 5 }) {
      try {
        const partners = await prisma.deliveryPartner.findMany({
          where: { IsAvailable: true },
          include: { user: true },
        });

        // Filter by distance
        const nearby = partners.filter((partner) => {
          if (!partner.CurrentLatitude || !partner.CurrentLongitude) return false;

          const distance = calculateDistance(
            latitude,
            longitude,
            parseFloat(partner.CurrentLatitude),
            parseFloat(partner.CurrentLongitude)
          );

          return distance <= parseFloat(radius);
        });

        return nearby.map(formatDeliveryPartnerResponse);
      } catch (error) {
        handleResolverError(error, 'getAvailableDeliveryPartners');
      }
    },

    /**
     * Get assigned orders for delivery partner
     */
    async getAssignedOrders(_, { deliveryPartnerId, status }, { userId, userRole }) {
      try {
        const whereClause = { DeliveryPartnerID: deliveryPartnerId };

        if (status) {
          whereClause.OrderStatus = status;
        }

        return await prisma.orders.findMany({
          where: whereClause,
          include: {
            user: true,
            restaurant: true,
            address: true,
            items: true,
          },
          orderBy: { OrderDateTime: 'asc' },
        });
      } catch (error) {
        handleResolverError(error, 'getAssignedOrders');
      }
    },

    /**
     * Get delivery partner statistics
     */
    async getDeliveryPartnerStats(_, { deliveryPartnerId }, { userId, userRole }) {
      try {
        const orders = await prisma.orders.findMany({
          where: { DeliveryPartnerID: deliveryPartnerId },
        });

        const reviews = await prisma.review.findMany({
          where: {
            orders: { some: { DeliveryPartnerID: deliveryPartnerId } },
          },
          select: { RatingDelivery: true },
        });

        const completedDeliveries = orders.filter((o) => o.OrderStatus === 'Delivered').length;
        const avgDeliveryTime = 45; // Placeholder - calculate from actual data

        const totalRatings = reviews.filter((r) => r.RatingDelivery !== null).length;
        const avgRating =
          totalRatings > 0
            ? reviews.reduce((sum, r) => sum + (r.RatingDelivery || 0), 0) / totalRatings
            : 0;

        const totalEarnings = orders
          .filter((o) => o.OrderStatus === 'Delivered')
          .reduce((sum, o) => sum + parseFloat(o.DeliveryPartnerEarning || 0), 0);

        return {
          totalDeliveries: orders.length,
          completedDeliveries,
          avgDeliveryTime,
          rating: new Decimal(avgRating),
          totalEarnings: new Decimal(totalEarnings),
        };
      } catch (error) {
        handleResolverError(error, 'getDeliveryPartnerStats');
      }
    },

    /**
     * Get review by ID
     */
    async getReviewById(_, { id }) {
      try {
        const review = await prisma.review.findUnique({
          where: { ReviewID: id },
          include: {
            user: true,
            restaurant: true,
            order: true,
          },
        });

        if (!review) {
          throw new NotFoundError('Review', id);
        }

        return formatReviewResponse(review);
      } catch (error) {
        handleResolverError(error, 'getReviewById');
      }
    },

    /**
     * Get restaurant reviews
     */
    async getRestaurantReviews(_, { restaurantId, page = 1, pageSize = 20 }) {
      try {
        const skip = (page - 1) * pageSize;

        return await prisma.review.findMany({
          where: { RestaurantID: restaurantId },
          skip,
          take: pageSize,
          include: {
            user: true,
            order: true,
          },
          orderBy: { ReviewID: 'desc' },
        });
      } catch (error) {
        handleResolverError(error, 'getRestaurantReviews');
      }
    },

    /**
     * Get user reviews
     */
    async getUserReviews(_, { userId }) {
      try {
        return await prisma.review.findMany({
          where: { UserID: userId },
          include: {
            restaurant: true,
            order: true,
          },
        });
      } catch (error) {
        handleResolverError(error, 'getUserReviews');
      }
    },

    /**
     * Get restaurant rating summary
     */
    async getRestaurantRating(_, { restaurantId }) {
      try {
        const reviews = await prisma.review.findMany({
          where: { RestaurantID: restaurantId },
          select: {
            RatingRestaurant: true,
            RatingDelivery: true,
          },
        });

        const restaurantRatings = reviews.filter((r) => r.RatingRestaurant !== null).map((r) => r.RatingRestaurant);
        const deliveryRatings = reviews.filter((r) => r.RatingDelivery !== null).map((r) => r.RatingDelivery);

        const avgRestaurantRating =
          restaurantRatings.length > 0
            ? restaurantRatings.reduce((a, b) => a + b, 0) / restaurantRatings.length
            : 0;

        const avgDeliveryRating =
          deliveryRatings.length > 0
            ? deliveryRatings.reduce((a, b) => a + b, 0) / deliveryRatings.length
            : 0;

        const ratingDistribution = {
          fiveStar: restaurantRatings.filter((r) => r === 5).length,
          fourStar: restaurantRatings.filter((r) => r === 4).length,
          threeStar: restaurantRatings.filter((r) => r === 3).length,
          twoStar: restaurantRatings.filter((r) => r === 2).length,
          oneStar: restaurantRatings.filter((r) => r === 1).length,
        };

        return {
          restaurantId,
          avgRestaurantRating: new Decimal(avgRestaurantRating),
          avgDeliveryRating: new Decimal(avgDeliveryRating),
          totalReviews: reviews.length,
          ratingDistribution,
        };
      } catch (error) {
        handleResolverError(error, 'getRestaurantRating');
      }
    },
  },

  Mutation: {
    /**
     * Create delivery partner
     */
    async createDeliveryPartner(_, { userId, input }, { userId: authUserId, userRole }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot create partner for other users');
        }

        const { vehicleNumber, licenseNumber } = input;

        // Verify user exists and has DeliveryPartner role
        const user = await prisma.user.findUnique({
          where: { UserID: userId },
        });

        if (!user || user.Role !== 'DeliveryPartner') {
          throw new ValidationError('User must have DeliveryPartner role');
        }

        // Check if already a delivery partner
        const existingPartner = await prisma.deliveryPartner.findUnique({
          where: { UserID: userId },
        });

        if (existingPartner) {
          throw new ValidationError('User is already a delivery partner');
        }

        const partner = await prisma.deliveryPartner.create({
          data: {
            UserID: userId,
            VehicleNumber: vehicleNumber,
            LicenseNumber: licenseNumber,
            IsAvailable: false,
          },
          include: { user: true },
        });

        return formatDeliveryPartnerResponse(partner);
      } catch (error) {
        handleResolverError(error, 'createDeliveryPartner');
      }
    },

    /**
     * Update delivery partner profile
     */
    async updateDeliveryPartnerProfile(_, { deliveryPartnerId, input }, { userId, userRole }) {
      try {
        const { vehicleNumber, licenseNumber } = input;

        const updateData = {};
        if (vehicleNumber) updateData.VehicleNumber = vehicleNumber;
        if (licenseNumber) updateData.LicenseNumber = licenseNumber;

        const updated = await prisma.deliveryPartner.update({
          where: { DeliveryPartnerID: deliveryPartnerId },
          data: updateData,
          include: { user: true },
        });

        return formatDeliveryPartnerResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateDeliveryPartnerProfile');
      }
    },

    /**
     * Toggle delivery partner availability
     */
    async toggleDeliveryPartnerAvailability(_, { deliveryPartnerId, isAvailable }, { userId }) {
      try {
        const updated = await prisma.deliveryPartner.update({
          where: { DeliveryPartnerID: deliveryPartnerId },
          data: { IsAvailable: isAvailable },
          include: { user: true },
        });

        return formatDeliveryPartnerResponse(updated);
      } catch (error) {
        handleResolverError(error, 'toggleDeliveryPartnerAvailability');
      }
    },

    /**
     * Update delivery partner location
     */
    async updateDeliveryPartnerLocation(_, { deliveryPartnerId, latitude, longitude }, { userId }) {
      try {
        const updated = await prisma.deliveryPartner.update({
          where: { DeliveryPartnerID: deliveryPartnerId },
          data: {
            CurrentLatitude: new Decimal(latitude),
            CurrentLongitude: new Decimal(longitude),
          },
          include: { user: true },
        });

        return formatDeliveryPartnerResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateDeliveryPartnerLocation');
      }
    },

    /**
     * Confirm order pickup
     */
    async confirmOrderPickup(_, { orderId, deliveryPartnerId }, { userId }) {
      try {
        const order = await prisma.orders.update({
          where: { OrderID: orderId },
          data: { OrderStatus: 'PickedUp' },
          include: {
            user: true,
            restaurant: true,
            deliveryPartner: true,
            items: { include: { item: true } },
          },
        });

        return order;
      } catch (error) {
        handleResolverError(error, 'confirmOrderPickup');
      }
    },

    /**
     * Update delivery progress
     */
    async updateDeliveryProgress(_, { orderId, latitude, longitude }, { userId }) {
      try {
        // Update delivery partner location
        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (order.DeliveryPartnerID) {
          await prisma.deliveryPartner.update({
            where: { DeliveryPartnerID: order.DeliveryPartnerID },
            data: {
              CurrentLatitude: new Decimal(latitude),
              CurrentLongitude: new Decimal(longitude),
            },
          });
        }

        return await prisma.orders.findUnique({
          where: { OrderID: orderId },
          include: {
            user: true,
            restaurant: true,
            deliveryPartner: true,
            items: true,
          },
        });
      } catch (error) {
        handleResolverError(error, 'updateDeliveryProgress');
      }
    },

    /**
     * Complete delivery
     */
    async completeDelivery(_, { orderId }, { userId }) {
      try {
        const updated = await prisma.orders.update({
          where: { OrderID: orderId },
          data: { OrderStatus: 'Delivered' },
          include: {
            user: true,
            restaurant: true,
            deliveryPartner: true,
            items: true,
          },
        });

        return updated;
      } catch (error) {
        handleResolverError(error, 'completeDelivery');
      }
    },

    /**
     * Add review
     */
    async addReview(_, { orderId, input }, { userId, userRole }) {
      try {
        const { ratingRestaurant, ratingDelivery, reviewText } = input;

        if (ratingRestaurant) {
          validateRating(ratingRestaurant);
        }
        if (ratingDelivery) {
          validateRating(ratingDelivery);
        }

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: {
            OrderID: orderId,
            UserID: userId,
          },
        });

        if (existingReview) {
          throw new ValidationError('You have already reviewed this order');
        }

        const review = await prisma.review.create({
          data: {
            OrderID: orderId,
            UserID: userId,
            RestaurantID: order.RestaurantID,
            RatingRestaurant: ratingRestaurant,
            RatingDelivery: ratingDelivery,
            ReviewText: reviewText,
          },
          include: {
            user: true,
            restaurant: true,
            order: true,
          },
        });

        // Update restaurant rating
        const allReviews = await prisma.review.findMany({
          where: { RestaurantID: order.RestaurantID },
          select: { RatingRestaurant: true },
        });

        const validRatings = allReviews.filter((r) => r.RatingRestaurant !== null);
        const avgRating =
          validRatings.length > 0
            ? validRatings.reduce((sum, r) => sum + (r.RatingRestaurant || 0), 0) / validRatings.length
            : 0;

        await prisma.restaurant.update({
          where: { RestaurantID: order.RestaurantID },
          data: { Rating: new Decimal(avgRating) },
        });

        return formatReviewResponse(review);
      } catch (error) {
        handleResolverError(error, 'addReview');
      }
    },

    /**
     * Update review
     */
    async updateReview(_, { reviewId, input }, { userId }) {
      try {
        const { ratingRestaurant, ratingDelivery, reviewText } = input;

        const review = await prisma.review.findUnique({
          where: { ReviewID: reviewId },
        });

        if (!review || review.UserID !== userId) {
          throw new UnauthorizedError('Cannot update this review');
        }

        if (ratingRestaurant) {
          validateRating(ratingRestaurant);
        }
        if (ratingDelivery) {
          validateRating(ratingDelivery);
        }

        const updated = await prisma.review.update({
          where: { ReviewID: reviewId },
          data: {
            RatingRestaurant: ratingRestaurant,
            RatingDelivery: ratingDelivery,
            ReviewText: reviewText,
          },
          include: {
            user: true,
            restaurant: true,
            order: true,
          },
        });

        return formatReviewResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateReview');
      }
    },

    /**
     * Delete review
     */
    async deleteReview(_, { reviewId }, { userId }) {
      try {
        const review = await prisma.review.findUnique({
          where: { ReviewID: reviewId },
        });

        if (!review || review.UserID !== userId) {
          throw new UnauthorizedError('Cannot delete this review');
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
     * Flag review
     */
    async flagReview(_, { reviewId, reason }, { userId, userRole }) {
      try {
        // TODO: Add admin authorization check

        // TODO: Implement review flagging system (create FlaggedReview model if needed)

        return { success: true, message: 'Review flagged successfully' };
      } catch (error) {
        handleResolverError(error, 'flagReview');
      }
    },

    /**
     * Hide review
     */
    async hideReview(_, { reviewId }, { userId, userRole }) {
      try {
        // TODO: Add admin authorization check

        // TODO: Implement review hiding system

        return { success: true, message: 'Review hidden successfully' };
      } catch (error) {
        handleResolverError(error, 'hideReview');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDeliveryPartnerResponse = (partner) => {
  return {
    id: partner.DeliveryPartnerID,
    vehicleNumber: partner.VehicleNumber,
    licenseNumber: partner.LicenseNumber,
    currentLatitude: partner.CurrentLatitude,
    currentLongitude: partner.CurrentLongitude,
    isAvailable: partner.IsAvailable,
    userId: partner.UserID,
    user: partner.user,
    assignedOrders: partner.orders,
  };
};

const formatReviewResponse = (review) => {
  return {
    id: review.ReviewID,
    ratingRestaurant: review.RatingRestaurant,
    ratingDelivery: review.RatingDelivery,
    reviewText: review.ReviewText,
    userId: review.UserID,
    user: review.user,
    restaurantId: review.RestaurantID,
    restaurant: review.restaurant,
    orderId: review.OrderID,
    order: review.order,
  };
};

module.exports = deliveryAndReviewResolvers;
