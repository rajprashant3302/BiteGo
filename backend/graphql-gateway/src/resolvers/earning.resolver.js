// ============================================
// EARNING RESOLVERS (for Delivery Partners & Restaurant Owners)
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');
const { Decimal } = require('@prisma/client/runtime/library');

const earningResolvers = {
  Query: {
    /**
     * Get restaurant owner earnings
     */
    async getRestaurantOwnerEarnings(
      _,
      { ownerId, startDate, endDate },
      { userId, userRole }
    ) {
      try {
        // TODO: Add authorization check

        const whereClause = {
          restaurant: { OwnerID: ownerId },
          OrderStatus: 'Delivered',
        };

        if (startDate) {
          whereClause.OrderDateTime = { gte: new Date(startDate) };
        }
        if (endDate) {
          if (whereClause.OrderDateTime) {
            whereClause.OrderDateTime.lte = new Date(endDate);
          } else {
            whereClause.OrderDateTime = { lte: new Date(endDate) };
          }
        }

        const orders = await prisma.orders.findMany({
          where: whereClause,
          select: { RestaurantEarning: true },
        });

        const totalEarnings = orders.reduce(
          (sum, order) => sum + parseFloat(order.RestaurantEarning || 0),
          0
        );

        return {
          restaurantOwnerId: ownerId,
          totalEarnings: new Decimal(totalEarnings),
          totalOrders: orders.length,
          avgOrderEarning: orders.length > 0
            ? new Decimal(totalEarnings / orders.length)
            : new Decimal(0),
        };
      } catch (error) {
        handleResolverError(error, 'getRestaurantOwnerEarnings');
      }
    },

    /**
     * Get delivery partner earnings
     */
    async getDeliveryPartnerEarnings(
      _,
      { deliveryPartnerId, startDate, endDate },
      { userId, userRole }
    ) {
      try {
        // TODO: Add authorization check

        const whereClause = {
          DeliveryPartnerID: deliveryPartnerId,
          OrderStatus: 'Delivered',
        };

        if (startDate) {
          whereClause.OrderDateTime = { gte: new Date(startDate) };
        }
        if (endDate) {
          if (whereClause.OrderDateTime) {
            whereClause.OrderDateTime.lte = new Date(endDate);
          } else {
            whereClause.OrderDateTime = { lte: new Date(endDate) };
          }
        }

        const orders = await prisma.orders.findMany({
          where: whereClause,
          select: { DeliveryPartnerEarning: true },
        });

        const totalEarnings = orders.reduce(
          (sum, order) => sum + parseFloat(order.DeliveryPartnerEarning || 0),
          0
        );

        return {
          deliveryPartnerId,
          totalEarnings: new Decimal(totalEarnings),
          totalDeliveries: orders.length,
          avgDeliveryEarning: orders.length > 0
            ? new Decimal(totalEarnings / orders.length)
            : new Decimal(0),
        };
      } catch (error) {
        handleResolverError(error, 'getDeliveryPartnerEarnings');
      }
    },

    /**
     * Get platform earnings
     */
    async getPlatformEarnings(
      _,
      { startDate, endDate },
      { userId, userRole }
    ) {
      try {
        // TODO: Add admin authorization check

        const whereClause = { OrderStatus: 'Delivered' };

        if (startDate) {
          whereClause.OrderDateTime = { gte: new Date(startDate) };
        }
        if (endDate) {
          if (whereClause.OrderDateTime) {
            whereClause.OrderDateTime.lte = new Date(endDate);
          } else {
            whereClause.OrderDateTime = { lte: new Date(endDate) };
          }
        }

        const orders = await prisma.orders.findMany({
          where: whereClause,
          select: {
            TotalAmount: true,
            RestaurantEarning: true,
            DeliveryPartnerEarning: true,
          },
        });

        const totalRevenue = orders.reduce(
          (sum, order) => sum + parseFloat(order.TotalAmount || 0),
          0
        );

        const restaurantEarnings = orders.reduce(
          (sum, order) => sum + parseFloat(order.RestaurantEarning || 0),
          0
        );

        const deliveryEarnings = orders.reduce(
          (sum, order) => sum + parseFloat(order.DeliveryPartnerEarning || 0),
          0
        );

        const platformEarnings = totalRevenue - restaurantEarnings - deliveryEarnings;

        return {
          totalRevenue: new Decimal(totalRevenue),
          restaurantEarnings: new Decimal(restaurantEarnings),
          deliveryEarnings: new Decimal(deliveryEarnings),
          platformEarnings: new Decimal(platformEarnings),
          totalOrders: orders.length,
          platformCommissionPercentage: new Decimal(
            orders.length > 0 ? (platformEarnings / totalRevenue) * 100 : 0
          ),
        };
      } catch (error) {
        handleResolverError(error, 'getPlatformEarnings');
      }
    },
  },

  Mutation: {
    /**
     * Withdraw earnings (for restaurant owner or delivery partner)
     */
    async withdrawEarnings(
      _,
      { userId, amount, bankAccountId },
      { userId: authUserId }
    ) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Can only withdraw your own earnings');
        }

        // TODO: Verify bank account
        // TODO: Process withdrawal through payment gateway
        // TODO: Create WithdrawalRecord to track

        const user = await prisma.user.findUnique({
          where: { UserID: userId },
        });

        if (!user) {
          throw new NotFoundError('User', userId);
        }

        if (user.WalletBalance < new Decimal(amount)) {
          throw new ValidationError('Insufficient balance for withdrawal');
        }

        // Deduct from wallet
        await prisma.user.update({
          where: { UserID: userId },
          data: {
            WalletBalance: user.WalletBalance - new Decimal(amount),
          },
        });

        // Create wallet transaction record
        await prisma.walletTransaction.create({
          data: {
            UserID: userId,
            TransactionType: 'Debit',
            Amount: new Decimal(amount),
            Description: `Withdrawal to bank account ending in ...`,
          },
        });

        return {
          success: true,
          message: 'Withdrawal initiated successfully',
          amount: new Decimal(amount),
        };
      } catch (error) {
        handleResolverError(error, 'withdrawEarnings');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

module.exports = earningResolvers;
