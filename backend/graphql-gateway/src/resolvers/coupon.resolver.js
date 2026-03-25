// ============================================
// COUPON & SUPPORT TICKET RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validatePagination,
  calculateDiscountAmount,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');
const { Prisma } = require('@prisma/client');
const { Decimal } = Prisma;
const { requireAuth, requireRole, requireSelfOrAdmin } = require('../middleware/authorization');
const { ADMIN_ROLES, SUPPORT_ROLES } = require('../config/constants');

const couponAndSupportResolvers = {
  Query: {
    /**
     * Get coupon by ID
     */
    async getCouponById(_, { id }) {
      try {
        const coupon = await prisma.coupon.findUnique({
          where: { CouponID: id },
          include: { usages: true },
        });

        if (!coupon) {
          throw new NotFoundError('Coupon', id);
        }

        return formatCouponResponse(coupon);
      } catch (error) {
        handleResolverError(error, 'getCouponById');
      }
    },

    /**
     * Get coupon by code
     */
    async getCouponByCode(_, { code }) {
      try {
        const coupon = await prisma.coupon.findUnique({
          where: { CouponCode: code },
          include: { usages: true },
        });

        if (!coupon) {
          throw new NotFoundError('Coupon', code);
        }

        return formatCouponResponse(coupon);
      } catch (error) {
        handleResolverError(error, 'getCouponByCode');
      }
    },

    /**
     * Get active coupons
     */
    async getActiveCoupons() {
      try {
        const now = new Date();
        return await prisma.coupon.findMany({
          where: {
            IsActive: true,
            ExpiryDate: { gte: now },
          },
        });
      } catch (error) {
        handleResolverError(error, 'getActiveCoupons');
      }
    },

    /**
     * Get user coupon usages
     */
    async getUserCouponUsages(_, { userId }, context) {
      try {
        requireSelfOrAdmin(context, userId);
        return await prisma.userCoupon.findMany({
          where: { UserID: userId },
          include: {
            coupon: true,
            order: true,
          },
        });
      } catch (error) {
        handleResolverError(error, 'getUserCouponUsages');
      }
    },

    /**
     * Validate coupon
     */
    async validateCoupon(_, { code, orderId }, { userId }) {
      try {
        const coupon = await prisma.coupon.findUnique({
          where: { CouponCode: code },
        });

        if (!coupon) {
          return {
            isValid: false,
            coupon: null,
            message: 'Coupon not found',
            applicableDiscount: new Decimal(0),
          };
        }

        if (!coupon.IsActive) {
          return {
            isValid: false,
            coupon: null,
            message: 'Coupon is not active',
            applicableDiscount: new Decimal(0),
          };
        }

        if (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date()) {
          return {
            isValid: false,
            coupon: null,
            message: 'Coupon has expired',
            applicableDiscount: new Decimal(0),
          };
        }

        // Check if user has already used this coupon
        const existingUsage = await prisma.userCoupon.findFirst({
          where: {
            UserID: userId,
            CouponID: coupon.CouponID,
          },
        });

        if (existingUsage) {
          return {
            isValid: false,
            coupon: null,
            message: 'You have already used this coupon',
            applicableDiscount: new Decimal(0),
          };
        }

        // Check order value if applicable
        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (order && order.TotalAmount < coupon.DiscountValue) {
          // This is simplified - should check min order value logic
          return {
            isValid: false,
            coupon: null,
            message: 'Order value does not meet coupon requirements',
            applicableDiscount: new Decimal(0),
          };
        }

        const applicableDiscount = coupon.DiscountValue;

        return {
          isValid: true,
          coupon: formatCouponResponse(coupon),
          message: 'Coupon is valid',
          applicableDiscount,
        };
      } catch (error) {
        handleResolverError(error, 'validateCoupon');
      }
    },

    /**
     * Get support ticket by ID
     */
    async getTicketById(_, { id }, { userId }) {
      try {
        requireAuth({ userId });
        const ticket = await prisma.supportTicket.findUnique({
          where: { TicketID: id },
          include: {
            user: true,
            order: true,
          },
        });

        if (!ticket) {
          throw new NotFoundError('Support Ticket', id);
        }

        if (ticket.UserID !== userId) {
          throw new UnauthorizedError('Cannot access this support ticket');
        }

        return formatTicketResponse(ticket);
      } catch (error) {
        handleResolverError(error, 'getTicketById');
      }
    },

    /**
     * Get user tickets
     */
    async getUserTickets(_, { userId: queryUserId, page = 1, pageSize = 20 }, { userId: authUserId }) {
      try {
        validatePagination(page, pageSize);
        requireSelfOrAdmin({ userId: authUserId }, queryUserId);

        const skip = (page - 1) * pageSize;

        return await prisma.supportTicket.findMany({
          where: { UserID: queryUserId },
          skip,
          take: pageSize,
          include: {
            user: true,
            order: true,
          },
          orderBy: { CreatedAt: 'desc' },
        });
      } catch (error) {
        handleResolverError(error, 'getUserTickets');
      }
    },

    /**
     * Get tickets by order
     */
    async getTicketsByOrder(_, { orderId }) {
      try {
        return await prisma.supportTicket.findMany({
          where: { OrderID: orderId },
          include: {
            user: true,
          },
        });
      } catch (error) {
        handleResolverError(error, 'getTicketsByOrder');
      }
    },

    /**
     * Get support statistics
     */
    async getSupportStats(_, __, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, [...ADMIN_ROLES, ...SUPPORT_ROLES]);

        const totalTickets = await prisma.supportTicket.count();
        const openTickets = await prisma.supportTicket.count({
          where: { Status: 'Open' },
        });
        const inProgressTickets = await prisma.supportTicket.count({
          where: { Status: 'InProgress' },
        });
        const resolvedTickets = await prisma.supportTicket.count({
          where: { Status: 'Resolved' },
        });

        // TODO: Calculate avg resolution time from actual data
        const avgResolutionTime = 24; // hours - placeholder

        return {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          avgResolutionTime,
        };
      } catch (error) {
        handleResolverError(error, 'getSupportStats');
      }
    },
  },

  Mutation: {
    /**
     * Create coupon
     */
    async createCoupon(_, { input }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);

        const { couponCode, discountType, discountValue, expiryDate, minOrderValue } = input;

        if (!couponCode || !discountType || !discountValue) {
          throw new ValidationError('Coupon code, discount type and value are required');
        }

        // Check if coupon already exists
        const existing = await prisma.coupon.findUnique({
          where: { CouponCode: couponCode },
        });

        if (existing) {
          throw new ValidationError('Coupon code already exists');
        }

        const coupon = await prisma.coupon.create({
          data: {
            CouponCode: couponCode,
            DiscountType: discountType,
            DiscountValue: new Decimal(discountValue),
            ExpiryDate: expiryDate ? new Date(expiryDate) : null,
            IsActive: true,
          },
        });

        return formatCouponResponse(coupon);
      } catch (error) {
        handleResolverError(error, 'createCoupon');
      }
    },

    /**
     * Update coupon
     */
    async updateCoupon(_, { couponId, input }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);

        const { discountValue, expiryDate, isActive } = input;

        const updateData = {};
        if (discountValue) updateData.DiscountValue = new Decimal(discountValue);
        if (expiryDate) updateData.ExpiryDate = new Date(expiryDate);
        if (isActive !== undefined) updateData.IsActive = isActive;

        const updated = await prisma.coupon.update({
          where: { CouponID: couponId },
          data: updateData,
          include: { usages: true },
        });

        return formatCouponResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateCoupon');
      }
    },

    /**
     * Deactivate coupon
     */
    async deactivateCoupon(_, { couponId }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);

        await prisma.coupon.update({
          where: { CouponID: couponId },
          data: { IsActive: false },
        });

        return { success: true, message: 'Coupon deactivated successfully' };
      } catch (error) {
        handleResolverError(error, 'deactivateCoupon');
      }
    },

    /**
     * Apply coupon
     */
    async applyCoupon(_, { userId, couponCode, orderId }, { userId: authUserId }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot apply coupon for other users');
        }

        const coupon = await prisma.coupon.findUnique({
          where: { CouponCode: couponCode },
        });

        if (!coupon) {
          throw new NotFoundError('Coupon', couponCode);
        }

        if (!coupon.IsActive) {
          throw new ValidationError('Coupon is not active');
        }

        if (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date()) {
          throw new ValidationError('Coupon has expired');
        }

        // Check existing usage
        const existingUsage = await prisma.userCoupon.findFirst({
          where: {
            UserID: userId,
            CouponID: coupon.CouponID,
          },
        });

        if (existingUsage) {
          throw new ValidationError('You have already used this coupon');
        }

        const usage = await prisma.userCoupon.create({
          data: {
            UserID: userId,
            CouponID: coupon.CouponID,
            OrderID: orderId,
            UsedAt: new Date(),
          },
          include: {
            coupon: true,
            user: true,
            order: true,
          },
        });

        return formatCouponUsageResponse(usage);
      } catch (error) {
        handleResolverError(error, 'applyCoupon');
      }
    },

    /**
     * Remove coupon
     */
    async removeCoupon(_, { usageId }, { userId }) {
      try {
        const usage = await prisma.userCoupon.findUnique({
          where: { UsageID: usageId },
        });

        if (!usage || usage.UserID !== userId) {
          throw new UnauthorizedError('Cannot remove this coupon usage');
        }

        await prisma.userCoupon.delete({
          where: { UsageID: usageId },
        });

        return { success: true, message: 'Coupon removed successfully' };
      } catch (error) {
        handleResolverError(error, 'removeCoupon');
      }
    },

    /**
     * Create support ticket
     */
    async createSupportTicket(_, { userId, input }, { userId: authUserId }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot create ticket for other users');
        }

        const { issueType, description, orderId } = input;

        if (!issueType || !description) {
          throw new ValidationError('Issue type and description are required');
        }

        const ticket = await prisma.supportTicket.create({
          data: {
            UserID: userId,
            IssueType: issueType,
            Description: description,
            OrderID: orderId,
            Status: 'Open',
            CreatedAt: new Date(),
          },
          include: {
            user: true,
            order: true,
          },
        });

        return formatTicketResponse(ticket);
      } catch (error) {
        handleResolverError(error, 'createSupportTicket');
      }
    },

    /**
     * Update ticket status
     */
    async updateTicketStatus(_, { ticketId, status }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, [...SUPPORT_ROLES, ...ADMIN_ROLES]);

        const ticket = await prisma.supportTicket.findUnique({
          where: { TicketID: ticketId },
        });

        if (!ticket) {
          throw new NotFoundError('Support Ticket', ticketId);
        }

        const updated = await prisma.supportTicket.update({
          where: { TicketID: ticketId },
          data: { Status: status },
          include: {
            user: true,
            order: true,
          },
        });

        return formatTicketResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateTicketStatus');
      }
    },

    /**
     * Close ticket
     */
    async closeTicket(_, { ticketId, resolution }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, [...SUPPORT_ROLES, ...ADMIN_ROLES]);

        const ticket = await prisma.supportTicket.findUnique({
          where: { TicketID: ticketId },
        });

        if (!ticket) {
          throw new NotFoundError('Support Ticket', ticketId);
        }

        // TODO: Store resolution in ticket or separate Resolution model

        const updated = await prisma.supportTicket.update({
          where: { TicketID: ticketId },
          data: { Status: 'Resolved' },
          include: {
            user: true,
            order: true,
          },
        });

        return formatTicketResponse(updated);
      } catch (error) {
        handleResolverError(error, 'closeTicket');
      }
    },

    /**
     * Assign ticket to agent
     */
    async assignTicketToAgent(_, { ticketId, agentId }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);
        // TODO: Store agent assignment

        const ticket = await prisma.supportTicket.findUnique({
          where: { TicketID: ticketId },
        });

        if (!ticket) {
          throw new NotFoundError('Support Ticket', ticketId);
        }

        const updated = await prisma.supportTicket.update({
          where: { TicketID: ticketId },
          data: { Status: 'InProgress' },
          include: {
            user: true,
            order: true,
          },
        });

        return formatTicketResponse(updated);
      } catch (error) {
        handleResolverError(error, 'assignTicketToAgent');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCouponResponse = (coupon) => {
  return {
    id: coupon.CouponID,
    couponCode: coupon.CouponCode,
    discountType: coupon.DiscountType,
    discountValue: coupon.DiscountValue,
    expiryDate: coupon.ExpiryDate,
    isActive: coupon.IsActive,
    usages: coupon.usages,
  };
};

const formatCouponUsageResponse = (usage) => {
  return {
    id: usage.UsageID,
    usedAt: usage.UsedAt,
    userId: usage.UserID,
    user: usage.user,
    couponId: usage.CouponID,
    coupon: usage.coupon,
    orderId: usage.OrderID,
    order: usage.order,
  };
};

const formatTicketResponse = (ticket) => {
  return {
    id: ticket.TicketID,
    issueType: ticket.IssueType,
    description: ticket.Description,
    status: ticket.Status,
    createdAt: ticket.CreatedAt,
    userId: ticket.UserID,
    user: ticket.user,
    orderId: ticket.OrderID,
    order: ticket.order,
  };
};

module.exports = couponAndSupportResolvers;
