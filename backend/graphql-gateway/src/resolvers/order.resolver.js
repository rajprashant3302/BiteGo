// ============================================
// ORDER RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validateOrderStatus,
  validatePagination,
  calculateOrderTotal,
  calculateDiscountAmount,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');
const { Prisma } = require('@prisma/client');
const { Decimal } = Prisma;
const { requireAuth, requireRole, requireSelfOrAdmin } = require('../middleware/authorization');
const { ADMIN_ROLES, RESTAURANT_ROLES, DELIVERY_ROLES } = require('../config/constants');
const { callOrderService } = require('../services/orderServiceClient');

const orderResolvers = {
  Query: {
    /**
     * Get order by ID
     */
    async getOrderById(_, { id }, { userId }) {
      try {
        requireAuth({ userId });

        try {
          const serviceOrder = await callOrderService(`/api/orders/${id}`);
          if (serviceOrder && serviceOrder.OrderID) {
            if (serviceOrder.UserID !== userId) {
              throw new UnauthorizedError('Cannot access this order');
            }
            return formatOrderResponse(serviceOrder);
          }
        } catch (serviceError) {
          console.warn('Order service getOrderById fallback:', serviceError.message);
        }

        const order = await prisma.orders.findUnique({
          where: { OrderID: id },
          include: {
            user: true,
            restaurant: true,
            deliveryPartner: true,
            address: true,
            offer: true,
            items: { include: { item: true } },
            payments: true,
            reviews: true,
            supportTickets: true,
            couponUsages: { include: { coupon: true } },
            invoice: true,
          },
        });

        if (!order) {
          throw new NotFoundError('Order', id);
        }

        if (order.UserID !== userId) {
          throw new UnauthorizedError('Cannot access this order');
        }

        return formatOrderResponse(order);
      } catch (error) {
        handleResolverError(error, 'getOrderById');
      }
    },

    /**
     * Get orders by user
     */
    async getOrdersByUser(_, { userId: queryUserId, page = 1, pageSize = 20 }, { userId: authUserId }) {
      try {
        validatePagination(page, pageSize);
        requireSelfOrAdmin({ userId: authUserId }, queryUserId);

        try {
          const serviceOrders = await callOrderService(`/api/orders/user/${queryUserId}`);
          if (Array.isArray(serviceOrders)) {
            const paged = serviceOrders.slice((page - 1) * pageSize, page * pageSize);
            return {
              orders: paged.map(formatOrderResponse),
              total: serviceOrders.length,
              page,
              pageSize,
            };
          }
        } catch (serviceError) {
          console.warn('Order service getOrdersByUser fallback:', serviceError.message);
        }

        const skip = (page - 1) * pageSize;

        const orders = await prisma.orders.findMany({
          where: { UserID: queryUserId },
          skip,
          take: pageSize,
          orderBy: { OrderDateTime: 'desc' },
          include: {
            restaurant: true,
            items: { include: { item: true } },
            payments: true,
          },
        });

        const total = await prisma.orders.count({
          where: { UserID: queryUserId },
        });

        return {
          orders: orders.map(formatOrderResponse),
          total,
          page,
          pageSize,
        };
      } catch (error) {
        handleResolverError(error, 'getOrdersByUser');
      }
    },

    /**
     * Get orders by restaurant
     */
    async getOrdersByRestaurant(
      _,
      { restaurantId, page = 1, pageSize = 20 },
      { userId, userRole }
    ) {
      try {
        validatePagination(page, pageSize);
        requireRole({ userId, userRole }, [...RESTAURANT_ROLES, ...ADMIN_ROLES]);

        const skip = (page - 1) * pageSize;

        const orders = await prisma.orders.findMany({
          where: { RestaurantID: restaurantId },
          skip,
          take: pageSize,
          orderBy: { OrderDateTime: 'desc' },
          include: {
            user: true,
            items: { include: { item: true } },
            payments: true,
          },
        });

        const total = await prisma.orders.count({
          where: { RestaurantID: restaurantId },
        });

        return {
          orders: orders.map(formatOrderResponse),
          total,
          page,
          pageSize,
        };
      } catch (error) {
        handleResolverError(error, 'getOrdersByRestaurant');
      }
    },

    /**
     * Get orders by delivery partner
     */
    async getOrdersByDeliveryPartner(
      _,
      { deliveryPartnerId, page = 1, pageSize = 20 },
      { userId, userRole }
    ) {
      try {
        validatePagination(page, pageSize);
        requireRole({ userId, userRole }, [...DELIVERY_ROLES, ...ADMIN_ROLES]);

        const skip = (page - 1) * pageSize;

        const orders = await prisma.orders.findMany({
          where: { DeliveryPartnerID: deliveryPartnerId },
          skip,
          take: pageSize,
          orderBy: { OrderDateTime: 'desc' },
          include: {
            user: true,
            restaurant: true,
            items: true,
            payments: true,
          },
        });

        const total = await prisma.orders.count({
          where: { DeliveryPartnerID: deliveryPartnerId },
        });

        return {
          orders: orders.map(formatOrderResponse),
          total,
          page,
          pageSize,
        };
      } catch (error) {
        handleResolverError(error, 'getOrdersByDeliveryPartner');
      }
    },

    /**
     * Get order statistics
     */
    async getOrderStats(_, { startDate, endDate }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);

        const whereClause = {};
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

        const totalOrders = await prisma.orders.count({ where: whereClause });

        const completedOrders = await prisma.orders.count({
          where: {
            ...whereClause,
            OrderStatus: 'Delivered',
          },
        });

        const cancelledOrders = await prisma.orders.count({
          where: {
            ...whereClause,
            OrderStatus: 'Cancelled',
          },
        });

        const activeOrders = await prisma.orders.count({
          where: {
            ...whereClause,
            OrderStatus: { in: ['Placed', 'Preparing', 'PickedUp'] },
          },
        });

        const orders = await prisma.orders.findMany({
          where: whereClause,
          select: { TotalAmount: true },
        });

        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.TotalAmount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
          totalOrders,
          totalRevenue: new Decimal(totalRevenue),
          avgOrderValue: new Decimal(avgOrderValue),
          completedOrders,
          cancelledOrders,
          activeOrders,
        };
      } catch (error) {
        handleResolverError(error, 'getOrderStats');
      }
    },

    /**
     * Get restaurant order statistics
     */
    async getRestaurantOrderStats(
      _,
      { restaurantId, startDate, endDate },
      { userId, userRole }
    ) {
      try {
        requireRole({ userId, userRole }, [...RESTAURANT_ROLES, ...ADMIN_ROLES]);

        const whereClause = { RestaurantID: restaurantId };
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

        const totalOrders = await prisma.orders.count({ where: whereClause });

        const completedOrders = await prisma.orders.count({
          where: {
            ...whereClause,
            OrderStatus: 'Delivered',
          },
        });

        const cancelledOrders = await prisma.orders.count({
          where: {
            ...whereClause,
            OrderStatus: 'Cancelled',
          },
        });

        const activeOrders = await prisma.orders.count({
          where: {
            ...whereClause,
            OrderStatus: { in: ['Placed', 'Preparing', 'PickedUp'] },
          },
        });

        const orders = await prisma.orders.findMany({
          where: whereClause,
          select: { TotalAmount: true },
        });

        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.TotalAmount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
          totalOrders,
          totalRevenue: new Decimal(totalRevenue),
          avgOrderValue: new Decimal(avgOrderValue),
          completedOrders,
          cancelledOrders,
          activeOrders,
        };
      } catch (error) {
        handleResolverError(error, 'getRestaurantOrderStats');
      }
    },
  },

  Mutation: {
    /**
     * Place order
     */
    async placeOrder(_, { userId, input }, { userId: authUserId, token }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot place order for other users');
        }

        try {
          const serviceResult = await callOrderService(
            '/api/orders/place-order',
            {
              method: 'POST',
              body: JSON.stringify({
                userId,
                items: input.items,
                addressId: input.deliveryAddressId,
                useWallet: false,
                paymentMethod: 'cod',
                restaurantId: input.restaurantId,
              }),
            },
            token
          );

          if (serviceResult?.orderId) {
            const order = await prisma.orders.findUnique({
              where: { OrderID: serviceResult.orderId },
              include: {
                user: true,
                restaurant: true,
                deliveryPartner: true,
                address: true,
                offer: true,
                items: { include: { item: true } },
                payments: true,
                reviews: true,
                supportTickets: true,
                couponUsages: { include: { coupon: true } },
                invoice: true,
              },
            });
            if (order) return formatOrderResponse(order);
          }
        } catch (serviceError) {
          console.warn('Order service placeOrder fallback:', serviceError.message);
        }

        const { restaurantId, items, deliveryAddressId, notes } = input;

        if (!items || items.length === 0) {
          throw new ValidationError('Order must contain at least one item');
        }

        // Verify restaurant exists
        const restaurant = await prisma.restaurant.findUnique({
          where: { RestaurantID: restaurantId },
        });

        if (!restaurant) {
          throw new NotFoundError('Restaurant', restaurantId);
        }

        // Verify address
        const address = await prisma.address.findUnique({
          where: { AddressID: deliveryAddressId },
        });

        if (!address) {
          throw new NotFoundError('Address', deliveryAddressId);
        }

        const menuItems = await prisma.menuItem.findMany({
          where: { ItemID: { in: items.map((item) => item.itemId) } },
        });

        let totalAmount = new Decimal(0);
        const orderItems = items.map((item) => {
          const menuItem = menuItems.find((dbItem) => dbItem.ItemID === item.itemId);

          if (!menuItem) {
            throw new NotFoundError('Menu Item', item.itemId);
          }

          if (!menuItem.IsAvailable) {
            throw new ValidationError(`${menuItem.ItemName} is not available`);
          }

          if (menuItem.AvailableQuantity < item.quantity) {
            throw new ValidationError(`${menuItem.ItemName} has insufficient quantity`);
          }

          const itemTotal = new Decimal(menuItem.Price).times(item.quantity);
          totalAmount = totalAmount.plus(itemTotal);

          return {
            itemId: menuItem.ItemID,
            quantity: item.quantity,
            itemPrice: menuItem.Price,
          };
        });

        const order = await prisma.$transaction(async (tx) => {
          const createdOrder = await tx.orders.create({
            data: {
              UserID: userId,
              RestaurantID: restaurantId,
              AddressID: deliveryAddressId,
              TotalAmount: totalAmount,
              OrderStatus: 'Placed',
              RestaurantEarning: totalAmount.times(0.75),
              DeliveryPartnerEarning: totalAmount.times(0.15),
            },
          });

          await tx.orderItem.createMany({
            data: orderItems.map((item) => ({
              OrderID: createdOrder.OrderID,
              ItemID: item.itemId,
              Quantity: item.quantity,
              ItemPrice: item.itemPrice,
            })),
          });

          for (const item of orderItems) {
            await tx.menuItem.update({
              where: { ItemID: item.itemId },
              data: {
                AvailableQuantity: { decrement: item.quantity },
              },
            });
          }

          await tx.payment.create({
            data: {
              OrderID: createdOrder.OrderID,
              UserID: userId,
              TotalAmount: totalAmount,
              PaymentMethod: 'COD',
              PaymentStatus: 'Pending',
            },
          });

          return tx.orders.findUnique({
            where: { OrderID: createdOrder.OrderID },
            include: {
              user: true,
              restaurant: true,
              deliveryPartner: true,
              address: true,
              offer: true,
              items: { include: { item: true } },
              payments: true,
              reviews: true,
              supportTickets: true,
              couponUsages: { include: { coupon: true } },
              invoice: true,
            },
          });
        });

        return formatOrderResponse(order);
      } catch (error) {
        handleResolverError(error, 'placeOrder');
      }
    },

    /**
     * Place order with coupon
     */
    async placeOrderWithCoupon(_, { userId, input }, { userId: authUserId, token }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot place order for other users');
        }

        try {
          const serviceResult = await callOrderService(
            '/api/orders/place-order',
            {
              method: 'POST',
              body: JSON.stringify({
                userId,
                items: input.items,
                addressId: input.deliveryAddressId,
                useWallet: false,
                paymentMethod: 'cod',
                restaurantId: input.restaurantId,
                couponCode: input.couponCode,
              }),
            },
            token
          );

          if (serviceResult?.orderId) {
            const order = await prisma.orders.findUnique({
              where: { OrderID: serviceResult.orderId },
              include: {
                user: true,
                restaurant: true,
                deliveryPartner: true,
                address: true,
                offer: true,
                items: { include: { item: true } },
                payments: true,
                reviews: true,
                supportTickets: true,
                couponUsages: { include: { coupon: true } },
                invoice: true,
              },
            });
            if (order) return formatOrderResponse(order);
          }
        } catch (serviceError) {
          console.warn('Order service placeOrderWithCoupon fallback:', serviceError.message);
        }

        const { restaurantId, items, deliveryAddressId, couponCode, notes } = input;

        if (!items || items.length === 0) {
          throw new ValidationError('Order must contain at least one item');
        }

        const restaurant = await prisma.restaurant.findUnique({
          where: { RestaurantID: restaurantId },
        });

        if (!restaurant) {
          throw new NotFoundError('Restaurant', restaurantId);
        }

        const address = await prisma.address.findUnique({
          where: { AddressID: deliveryAddressId },
        });

        if (!address) {
          throw new NotFoundError('Address', deliveryAddressId);
        }

        // Validate coupon if provided
        let coupon = null;
        let couponDiscount = new Decimal(0);
        if (couponCode) {
          coupon = await prisma.coupon.findUnique({
            where: { CouponCode: couponCode },
          });

          if (!coupon || !coupon.IsActive) {
            throw new ValidationError('Invalid or expired coupon');
          }

          if (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date()) {
            throw new ValidationError('Coupon has expired');
          }

          const existingUsage = await prisma.userCoupon.findFirst({
            where: {
              UserID: userId,
              CouponID: coupon.CouponID,
            },
          });

          if (existingUsage) {
            throw new ValidationError('You have already used this coupon');
          }
        }

        let totalAmount = new Decimal(0);
        const orderItems = [];

        for (const item of items) {
          const menuItem = await prisma.menuItem.findUnique({
            where: { ItemID: item.itemId },
          });

          if (!menuItem) {
            throw new NotFoundError('Menu Item', item.itemId);
          }

          if (!menuItem.IsAvailable) {
            throw new ValidationError(`${menuItem.ItemName} is not available`);
          }

          if (menuItem.AvailableQuantity < item.quantity) {
            throw new ValidationError(`${menuItem.ItemName} has insufficient quantity`);
          }

          const itemTotal = new Decimal(menuItem.Price).times(item.quantity);
          totalAmount = totalAmount.plus(itemTotal);
          orderItems.push({
            itemId: item.itemId,
            quantity: item.quantity,
            itemPrice: menuItem.Price,
          });
        }

        if (coupon) {
          if (coupon.DiscountType === 'Percentage') {
            couponDiscount = totalAmount.times(new Decimal(coupon.DiscountValue)).div(100);
          } else {
            couponDiscount = new Decimal(coupon.DiscountValue || 0);
          }
        }

        let finalTotal = totalAmount.minus(couponDiscount);
        if (finalTotal.isNegative()) {
          finalTotal = new Decimal(0);
        }

        const createdOrder = await prisma.$transaction(async (tx) => {
          const order = await tx.orders.create({
            data: {
              UserID: userId,
              RestaurantID: restaurantId,
              AddressID: deliveryAddressId,
              TotalAmount: finalTotal,
              OrderStatus: 'Placed',
              RestaurantEarning: finalTotal.times(0.75),
              DeliveryPartnerEarning: finalTotal.times(0.15),
            },
            include: {
              user: true,
              restaurant: true,
              address: true,
              items: { include: { item: true } },
            },
          });

          for (const item of orderItems) {
            await tx.orderItem.create({
              data: {
                OrderID: order.OrderID,
                ItemID: item.itemId,
                Quantity: item.quantity,
                ItemPrice: item.itemPrice,
              },
            });
          }

          if (coupon) {
            await tx.userCoupon.create({
              data: {
                UserID: userId,
                CouponID: coupon.CouponID,
                OrderID: order.OrderID,
                UsedAt: new Date(),
              },
            });
          }

          return tx.orders.findUnique({
            where: { OrderID: order.OrderID },
            include: {
              user: true,
              restaurant: true,
              deliveryPartner: true,
              address: true,
              offer: true,
              items: { include: { item: true } },
              payments: true,
              reviews: true,
              supportTickets: true,
              couponUsages: { include: { coupon: true } },
              invoice: true,
            },
          });
        });

        return formatOrderResponse(createdOrder);
      } catch (error) {
        handleResolverError(error, 'placeOrderWithCoupon');
      }
    },

    /**
     * Update order status
     */
    async updateOrderStatus(_, { orderId, status }, { userId, userRole }) {
      try {
        validateOrderStatus(status);
        requireRole({ userId, userRole }, [...ADMIN_ROLES, ...RESTAURANT_ROLES, ...DELIVERY_ROLES]);

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        const updated = await prisma.orders.update({
          where: { OrderID: orderId },
          data: { OrderStatus: status },
          include: {
            user: true,
            restaurant: true,
            items: { include: { item: true } },
            payments: true,
          },
        });

        return formatOrderResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateOrderStatus');
      }
    },

    /**
     * Cancel order
     */
    async cancelOrder(_, { orderId, reason }, { userId, userRole }) {
      try {
        requireAuth({ userId });

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        if (['Delivered', 'Cancelled'].includes(order.OrderStatus)) {
          throw new ValidationError(`Cannot cancel order with status ${order.OrderStatus}`);
        }

        if (order.UserID !== userId && !ADMIN_ROLES.includes(userRole)) {
          throw new UnauthorizedError('Cannot cancel this order');
        }

        // TODO: Handle refund logic

        const updated = await prisma.orders.update({
          where: { OrderID: orderId },
          data: { OrderStatus: 'Cancelled' },
          include: {
            user: true,
            restaurant: true,
            items: { include: { item: true } },
            payments: true,
          },
        });

        return formatOrderResponse(updated);
      } catch (error) {
        handleResolverError(error, 'cancelOrder');
      }
    },

    /**
     * Add order item
     */
    async addOrderItem(_, { orderId, input }, { userId, userRole }) {
      try {
        requireAuth({ userId });

        const { itemId, quantity } = input;

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        if (order.OrderStatus !== 'Placed') {
          throw new ValidationError('Can only add items to orders in Placed status');
        }

        const menuItem = await prisma.menuItem.findUnique({
          where: { ItemID: itemId },
        });

        if (!menuItem) {
          throw new NotFoundError('Menu Item', itemId);
        }

        const orderItem = await prisma.orderItem.create({
          data: {
            OrderID: orderId,
            ItemID: itemId,
            Quantity: quantity,
            ItemPrice: menuItem.Price,
          },
          include: { item: true },
        });

        // Update order total
        const newTotal = order.TotalAmount + menuItem.Price * new Decimal(quantity);
        await prisma.orders.update({
          where: { OrderID: orderId },
          data: { TotalAmount: newTotal },
        });

        return orderItem;
      } catch (error) {
        handleResolverError(error, 'addOrderItem');
      }
    },

    /**
     * Remove order item
     */
    async removeOrderItem(_, { orderItemId }, { userId, userRole }) {
      try {
        requireAuth({ userId });

        const orderItem = await prisma.orderItem.findUnique({
          where: { OrderItemID: orderItemId },
        });

        if (!orderItem) {
          throw new NotFoundError('Order Item', orderItemId);
        }

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderItem.OrderID },
        });

        if (order.OrderStatus !== 'Placed') {
          throw new ValidationError('Can only remove items from orders in Placed status');
        }

        // Update order total
        const newTotal = order.TotalAmount - orderItem.ItemPrice * new Decimal(orderItem.Quantity);
        await prisma.orders.update({
          where: { OrderID: orderItem.OrderID },
          data: { TotalAmount: newTotal },
        });

        await prisma.orderItem.delete({
          where: { OrderItemID: orderItemId },
        });

        return { success: true, message: 'Order item removed successfully' };
      } catch (error) {
        handleResolverError(error, 'removeOrderItem');
      }
    },

    /**
     * Generate invoice
     */
    async generateInvoice(_, { orderId }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, [...ADMIN_ROLES, ...RESTAURANT_ROLES]);

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
          include: { items: { include: { item: true } } },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        // TODO: Implement PDF generation service

        const invoice = await prisma.invoice.create({
          data: {
            OrderID: orderId,
            InvoiceDate: new Date(),
            PDFUrl: 'https://example.com/invoices/' + orderId + '.pdf',
          },
          include: { order: true },
        });

        return invoice;
      } catch (error) {
        handleResolverError(error, 'generateInvoice');
      }
    },

    /**
     * Assign delivery partner
     */
    async assignDeliveryPartner(_, { orderId, deliveryPartnerId }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        const deliveryPartner = await prisma.deliveryPartner.findUnique({
          where: { DeliveryPartnerID: deliveryPartnerId },
        });

        if (!deliveryPartner) {
          throw new NotFoundError('Delivery Partner', deliveryPartnerId);
        }

        const updated = await prisma.orders.update({
          where: { OrderID: orderId },
          data: { DeliveryPartnerID: deliveryPartnerId },
          include: {
            deliveryPartner: true,
            user: true,
            restaurant: true,
            items: { include: { item: true } },
          },
        });

        return formatOrderResponse(updated);
      } catch (error) {
        handleResolverError(error, 'assignDeliveryPartner');
      }
    },

    /**
     * Reassign delivery partner
     */
    async reassignDeliveryPartner(_, { orderId, newDeliveryPartnerId }, { userId, userRole }) {
      try {
        requireRole({ userId, userRole }, ADMIN_ROLES);

        const order = await prisma.orders.findUnique({
          where: { OrderID: orderId },
        });

        if (!order) {
          throw new NotFoundError('Order', orderId);
        }

        const deliveryPartner = await prisma.deliveryPartner.findUnique({
          where: { DeliveryPartnerID: newDeliveryPartnerId },
        });

        if (!deliveryPartner) {
          throw new NotFoundError('Delivery Partner', newDeliveryPartnerId);
        }

        const updated = await prisma.orders.update({
          where: { OrderID: orderId },
          data: { DeliveryPartnerID: newDeliveryPartnerId },
          include: {
            deliveryPartner: true,
            user: true,
            restaurant: true,
            items: { include: { item: true } },
          },
        });

        return formatOrderResponse(updated);
      } catch (error) {
        handleResolverError(error, 'reassignDeliveryPartner');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatOrderResponse = (order) => {
  return {
    id: order.OrderID,
    orderDateTime: order.OrderDateTime,
    totalAmount: order.TotalAmount,
    orderStatus: order.OrderStatus,
    restaurantEarning: order.RestaurantEarning,
    deliveryPartnerEarning: order.DeliveryPartnerEarning,
    userId: order.UserID,
    user: order.user,
    restaurantId: order.RestaurantID,
    restaurant: order.restaurant,
    deliveryPartnerId: order.DeliveryPartnerID,
    deliveryPartner: order.deliveryPartner,
    addressId: order.AddressID,
    address: order.address,
    offerId: order.OfferID,
    offer: order.offer,
    items: order.items,
    payments: order.payments,
    reviews: order.reviews,
    supportTickets: order.supportTickets,
    couponUsages: order.couponUsages,
    invoice: order.invoice,
  };
};

module.exports = orderResolvers;
