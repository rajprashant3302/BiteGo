// ============================================
// PAYMENT RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validatePaymentMethod,
  validatePagination,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');
const { Decimal } = require('@prisma/client/runtime/library');

const paymentResolvers = {
  Query: {
    /**
     * Get payment by ID
     */
    async getPaymentById(_, { id }, { userId }) {
      try {
        const payment = await prisma.payment.findUnique({
          where: { PaymentID: id },
          include: {
            user: true,
            order: true,
          },
        });

        if (!payment) {
          throw new NotFoundError('Payment', id);
        }

        // TODO: Add authorization check

        return formatPaymentResponse(payment);
      } catch (error) {
        handleResolverError(error, 'getPaymentById');
      }
    },

    /**
     * Get payments by order
     */
    async getPaymentsByOrder(_, { orderId }, { userId }) {
      try {
        return await prisma.payment.findMany({
          where: { OrderID: orderId },
          include: {
            user: true,
          },
        });
      } catch (error) {
        handleResolverError(error, 'getPaymentsByOrder');
      }
    },

    /**
     * Get payments by user
     */
    async getPaymentsByUser(_, { userId: queryUserId, page = 1, pageSize = 20 }, { userId: authUserId }) {
      try {
        validatePagination(page, pageSize);

        // TODO: Add authorization check

        const skip = (page - 1) * pageSize;

        return await prisma.payment.findMany({
          where: { UserID: queryUserId },
          skip,
          take: pageSize,
          orderBy: { PaymentDate: 'desc' },
          include: { order: true },
        });
      } catch (error) {
        handleResolverError(error, 'getPaymentsByUser');
      }
    },

    /**
     * Get payment statistics
     */
    async getPaymentStats(_, { startDate, endDate }, { userId, userRole }) {
      try {
        // TODO: Add authorization check - admin only

        const whereClause = {};
        if (startDate) {
          whereClause.PaymentDate = { gte: new Date(startDate) };
        }
        if (endDate) {
          if (whereClause.PaymentDate) {
            whereClause.PaymentDate.lte = new Date(endDate);
          } else {
            whereClause.PaymentDate = { lte: new Date(endDate) };
          }
        }

        const payments = await prisma.payment.findMany({
          where: whereClause,
          select: { TotalAmount: true, PaymentStatus: true },
        });

        const totalPayments = payments.length;
        const successfulPayments = payments.filter((p) => p.PaymentStatus === 'Success').length;
        const failedPayments = payments.filter((p) => p.PaymentStatus === 'Failed').length;
        const pendingPayments = payments.filter((p) => p.PaymentStatus === 'Pending').length;

        const totalRevenue = payments
          .filter((p) => p.PaymentStatus === 'Success')
          .reduce((sum, p) => sum + parseFloat(p.TotalAmount || 0), 0);

        const avgPaymentValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

        return {
          totalPayments,
          totalRevenue: new Decimal(totalRevenue),
          successfulPayments,
          failedPayments,
          pendingPayments,
          avgPaymentValue: new Decimal(avgPaymentValue),
        };
      } catch (error) {
        handleResolverError(error, 'getPaymentStats');
      }
    },
  },

  Mutation: {
    /**
     * Make payment
     */
    async makePayment(_, { orderId, input }, { userId, userRole }) {
      try {
        const { paymentMethod, transactionReference, amount } = input;

        validatePaymentMethod(paymentMethod);

        // TODO: Add authorization check

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
          include: { user: true },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        if (paymentMethod === 'Wallet') {
          // Check wallet balance
          if (order.user.WalletBalance < new Decimal(amount)) {
            throw new ValidationError('Insufficient wallet balance');
          }

          // Deduct from wallet
          await prisma.user.update({
            where: { UserID: order.UserID },
            data: {
              WalletBalance: order.user.WalletBalance - new Decimal(amount),
            },
          });
        }

        const payment = await prisma.payment.create({
          data: {
            OrderID: orderId,
            UserID: order.UserID,
            TotalAmount: new Decimal(amount),
            PaymentMethod: paymentMethod,
            PaymentStatus: paymentMethod === 'Wallet' ? 'Success' : 'Pending',
            TransactionReference: transactionReference,
            PaymentDate: new Date(),
          },
          include: {
            user: true,
            order: true,
          },
        });

        return formatPaymentResponse(payment);
      } catch (error) {
        handleResolverError(error, 'makePayment');
      }
    },

    /**
     * Initiate payment
     */
    async initiatePayment(_, { orderId, paymentMethod }, { userId, userRole }) {
      try {
        validatePaymentMethod(paymentMethod);

        // TODO: Add authorization check

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        // TODO: Integrate with payment gateway (Razorpay, Stripe, etc.)
        // This is a placeholder

        const paymentId = `PAY_${orderId}_${Date.now()}`;
        const paymentUrl = `https://payment-gateway.example.com/pay/${paymentId}`;

        return {
          paymentId,
          orderId,
          amount: order.TotalAmount,
          paymentUrl,
          transactionId: paymentId,
        };
      } catch (error) {
        handleResolverError(error, 'initiatePayment');
      }
    },

    /**
     * Confirm payment
     */
    async confirmPayment(_, { paymentId, transactionReference }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const payment = await prisma.payment.findUnique({
          where: { PaymentID: paymentId },
        });

        if (!payment) {
          throw new NotFoundError('Payment', paymentId);
        }

        // TODO: Verify payment with payment gateway

        const updated = await prisma.payment.update({
          where: { PaymentID: paymentId },
          data: {
            PaymentStatus: 'Success',
            TransactionReference: transactionReference,
          },
          include: {
            user: true,
            order: true,
          },
        });

        // Update order status to Preparing
        await prisma.orders.update({
          where: { OrderID: payment.OrderID },
          data: { OrderStatus: 'Preparing' },
        });

        return formatPaymentResponse(updated);
      } catch (error) {
        handleResolverError(error, 'confirmPayment');
      }
    },

    /**
     * Refund payment
     */
    async refundPayment(_, { paymentId, reason }, { userId, userRole }) {
      try {
        // TODO: Add authorization check - admin/ops only

        const payment = await prisma.payment.findUnique({
          where: { PaymentID: paymentId },
          include: { order: true },
        });

        if (!payment) {
          throw new NotFoundError('Payment', paymentId);
        }

        if (payment.PaymentStatus !== 'Success') {
          throw new ValidationError('Can only refund successful payments');
        }

        // TODO: Call payment gateway refund API

        const updated = await prisma.payment.update({
          where: { PaymentID: paymentId },
          data: { PaymentStatus: 'Failed' }, // Or create separate refund status
        });

        // Add refund to wallet
        const user = await prisma.user.findUnique({
          where: { UserID: payment.UserID },
        });

        await prisma.user.update({
          where: { UserID: payment.UserID },
          data: {
            WalletBalance: user.WalletBalance + payment.TotalAmount,
          },
        });

        return formatPaymentResponse(updated);
      } catch (error) {
        handleResolverError(error, 'refundPayment');
      }
    },

    /**
     * Refund order
     */
    async refundOrder(_, { orderId, reason }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
          include: { payments: true, user: true },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        const successfulPayment = order.payments.find((p) => p.PaymentStatus === 'Success');

        if (!successfulPayment) {
          throw new ValidationError('No successful payment found for this order');
        }

        // Add refund to wallet
        await prisma.user.update({
          where: { UserID: order.UserID },
          data: {
            WalletBalance: order.user.WalletBalance + successfulPayment.TotalAmount,
          },
        });

        return { success: true, message: 'Order refunded successfully' };
      } catch (error) {
        handleResolverError(error, 'refundOrder');
      }
    },

    /**
     * Pay with wallet
     */
    async payWithWallet(_, { orderId }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
          include: { user: true },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        if (order.user.WalletBalance < order.TotalAmount) {
          throw new ValidationError('Insufficient wallet balance');
        }

        // Deduct from wallet
        const updatedUser = await prisma.user.update({
          where: { UserID: order.UserID },
          data: {
            WalletBalance: order.user.WalletBalance - order.TotalAmount,
          },
        });

        // Create wallet payment
        const payment = await prisma.payment.create({
          data: {
            OrderID: orderId,
            UserID: order.UserID,
            TotalAmount: order.TotalAmount,
            PaymentMethod: 'Wallet',
            PaymentStatus: 'Success',
            TransactionReference: `WALLET_${orderId}_${Date.now()}`,
            PaymentDate: new Date(),
          },
          include: {
            user: true,
            order: true,
          },
        });

        // Update order status
        await prisma.orders.update({
          where: { OrderID: orderId },
          data: { OrderStatus: 'Preparing' },
        });

        return formatPaymentResponse(payment);
      } catch (error) {
        handleResolverError(error, 'payWithWallet');
      }
    },

    /**
     * Verify payment
     */
    async verifyPayment(_, { paymentId, transactionReference }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const payment = await prisma.payment.findUnique({
          where: { PaymentID: paymentId },
          include: {
            user: true,
            order: true,
          },
        });

        if (!payment) {
          throw new NotFoundError('Payment', paymentId);
        }

        // TODO: Verify with payment gateway if transactionReference provided

        // Check if payment already verified
        if (payment.PaymentStatus === 'Success') {
          return formatPaymentResponse(payment);
        }

        // Verify and update
        const verified = await prisma.payment.update({
          where: { PaymentID: paymentId },
          data: { PaymentStatus: 'Success' },
          include: {
            user: true,
            order: true,
          },
        });

        return formatPaymentResponse(verified);
      } catch (error) {
        handleResolverError(error, 'verifyPayment');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatPaymentResponse = (payment) => {
  return {
    id: payment.PaymentID,
    totalAmount: payment.TotalAmount,
    paymentMethod: payment.PaymentMethod,
    paymentStatus: payment.PaymentStatus,
    transactionReference: payment.TransactionReference,
    paymentDate: payment.PaymentDate,
    userId: payment.UserID,
    user: payment.user,
    orderId: payment.OrderID,
    order: payment.order,
  };
};

module.exports = paymentResolvers;
