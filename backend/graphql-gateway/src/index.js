// ============================================
// GRAPHQL GATEWAY - APOLLO SERVER SETUP
// ============================================

require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { readFileSync } = require('fs');
const { join } = require('path');
const jwt = require('jsonwebtoken');

// Import all resolvers
const userResolvers = require('./resolvers/user.resolver.js');
const restaurantResolvers = require('./resolvers/restaurant.resolver.js');
const orderResolvers = require('./resolvers/order.resolver.js');
const paymentResolvers = require('./resolvers/payment.resolver.js');
const deliveryAndReviewResolvers = require('./resolvers/delivery.resolver.js');
const couponAndSupportResolvers = require('./resolvers/coupon.resolver.js');
const earningResolvers = require('./resolvers/earning.resolver.js');

// ============================================
// LOAD GRAPHQL SCHEMA FILES
// ============================================

const schemaDir = join(__dirname, 'schema');

const loadSchemaFiles = () => {
  const files = ['index.graphql', 'types.graphql', 'user.graphql', 'restaurant.graphql', 'order.graphql', 'payment.graphql', 'review.graphql', 'coupon.graphql', 'earning.graphql'];

  return files.map((file) => readFileSync(join(schemaDir, file), 'utf-8')).join('\n');
};

const typeDefs = loadSchemaFiles();

const pickField = (obj, camelKey, pascalKey) => {
  if (!obj) return null;
  if (obj[camelKey] !== undefined) return obj[camelKey];
  return obj[pascalKey];
};

// ============================================
// MERGE RESOLVERS
// ============================================

const resolvers = {
  Query: {
    health: () => 'GraphQL Gateway is running',
    appVersion: () => '1.0.0',
    // User Queries
    ...userResolvers.Query,
    // Restaurant Queries
    ...restaurantResolvers.Query,
    // Order Queries
    ...orderResolvers.Query,
    // Payment Queries
    ...paymentResolvers.Query,
    // Delivery & Review Queries
    ...deliveryAndReviewResolvers.Query,
    // Coupon & Support Queries
    ...couponAndSupportResolvers.Query,
    // Earning Queries
    ...earningResolvers.Query,
  },
  Mutation: {
    // User Mutations
    ...userResolvers.Mutation,
    // Restaurant Mutations
    ...restaurantResolvers.Mutation,
    // Order Mutations
    ...orderResolvers.Mutation,
    // Payment Mutations
    ...paymentResolvers.Mutation,
    // Delivery & Review Mutations
    ...deliveryAndReviewResolvers.Mutation,
    // Coupon & Support Mutations
    ...couponAndSupportResolvers.Mutation,
    // Earning Mutations
    ...earningResolvers.Mutation,
  },
  User: {
    id: (src) => pickField(src, 'id', 'UserID'),
    name: (src) => pickField(src, 'name', 'Name'),
    email: (src) => pickField(src, 'email', 'Email'),
    phone: (src) => pickField(src, 'phone', 'Phone'),
    role: (src) => pickField(src, 'role', 'Role'),
    profilePicUrl: (src) => pickField(src, 'profilePicUrl', 'ProfilePicURL'),
    walletBalance: (src) => pickField(src, 'walletBalance', 'WalletBalance'),
    isActive: (src) => pickField(src, 'isActive', 'IsActive'),
    createdAt: (src) => pickField(src, 'createdAt', 'CreatedAt'),
  },
  Address: {
    id: (src) => pickField(src, 'id', 'AddressID'),
    addressLine: (src) => pickField(src, 'addressLine', 'AddressLine'),
    city: (src) => pickField(src, 'city', 'City'),
    pincode: (src) => pickField(src, 'pincode', 'Pincode'),
    latitude: (src) => pickField(src, 'latitude', 'Latitude'),
    longitude: (src) => pickField(src, 'longitude', 'Longitude'),
    isDefault: (src) => pickField(src, 'isDefault', 'IsDefault'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
  },
  Restaurant: {
    id: (src) => pickField(src, 'id', 'RestaurantID'),
    name: (src) => pickField(src, 'name', 'Name'),
    categoryName: (src) => pickField(src, 'categoryName', 'CategoryName'),
    latitude: (src) => pickField(src, 'latitude', 'Latitude'),
    longitude: (src) => pickField(src, 'longitude', 'Longitude'),
    rating: (src) => pickField(src, 'rating', 'Rating'),
    isActive: (src) => pickField(src, 'isActive', 'IsActive'),
    isOpen: (src) => pickField(src, 'isOpen', 'IsOpen'),
    ownerId: (src) => pickField(src, 'ownerId', 'OwnerID'),
    zoneId: (src) => pickField(src, 'zoneId', 'ZoneID'),
  },
  MenuItem: {
    id: (src) => pickField(src, 'id', 'ItemID'),
    itemName: (src) => pickField(src, 'itemName', 'ItemName'),
    description: (src) => pickField(src, 'description', 'Description'),
    itemImageUrl: (src) => pickField(src, 'itemImageUrl', 'ItemImageURL'),
    price: (src) => pickField(src, 'price', 'Price'),
    isVeg: (src) => pickField(src, 'isVeg', 'IsVeg'),
    isAvailable: (src) => pickField(src, 'isAvailable', 'IsAvailable'),
    availableQuantity: (src) => pickField(src, 'availableQuantity', 'AvailableQuantity'),
    restaurantId: (src) => pickField(src, 'restaurantId', 'RestaurantID'),
  },
  Order: {
    id: (src) => pickField(src, 'id', 'OrderID'),
    orderDateTime: (src) => pickField(src, 'orderDateTime', 'OrderDateTime'),
    totalAmount: (src) => pickField(src, 'totalAmount', 'TotalAmount'),
    orderStatus: (src) => pickField(src, 'orderStatus', 'OrderStatus'),
    restaurantEarning: (src) => pickField(src, 'restaurantEarning', 'RestaurantEarning'),
    deliveryPartnerEarning: (src) => pickField(src, 'deliveryPartnerEarning', 'DeliveryPartnerEarning'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
    restaurantId: (src) => pickField(src, 'restaurantId', 'RestaurantID'),
    deliveryPartnerId: (src) => pickField(src, 'deliveryPartnerId', 'DeliveryPartnerID'),
    addressId: (src) => pickField(src, 'addressId', 'AddressID'),
    offerId: (src) => pickField(src, 'offerId', 'OfferID'),
  },
  OrderItem: {
    id: (src) => pickField(src, 'id', 'OrderItemID'),
    quantity: (src) => pickField(src, 'quantity', 'Quantity'),
    itemPrice: (src) => pickField(src, 'itemPrice', 'ItemPrice'),
    orderId: (src) => pickField(src, 'orderId', 'OrderID'),
    itemId: (src) => pickField(src, 'itemId', 'ItemID'),
  },
  Payment: {
    id: (src) => pickField(src, 'id', 'PaymentID'),
    totalAmount: (src) => pickField(src, 'totalAmount', 'TotalAmount'),
    paymentMethod: (src) => pickField(src, 'paymentMethod', 'PaymentMethod'),
    paymentStatus: (src) => pickField(src, 'paymentStatus', 'PaymentStatus'),
    transactionReference: (src) => pickField(src, 'transactionReference', 'TransactionReference'),
    paymentDate: (src) => pickField(src, 'paymentDate', 'PaymentDate'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
    orderId: (src) => pickField(src, 'orderId', 'OrderID'),
  },
  Offer: {
    id: (src) => pickField(src, 'id', 'OfferID'),
    title: (src) => pickField(src, 'title', 'Title'),
    description: (src) => pickField(src, 'description', 'Description'),
    discountType: (src) => pickField(src, 'discountType', 'DiscountType'),
    discountValue: (src) => pickField(src, 'discountValue', 'DiscountValue'),
    minOrderValue: (src) => pickField(src, 'minOrderValue', 'MinOrderValue'),
    maxDiscount: (src) => pickField(src, 'maxDiscount', 'MaxDiscount'),
    startTime: (src) => pickField(src, 'startTime', 'StartTime'),
    endTime: (src) => pickField(src, 'endTime', 'EndTime'),
    isActive: (src) => pickField(src, 'isActive', 'IsActive'),
    restaurantId: (src) => pickField(src, 'restaurantId', 'RestaurantID'),
    applicableItems: (src) => src.applicableItems || [],
  },
  CouponUsage: {
    id: (src) => pickField(src, 'id', 'UsageID'),
    usedAt: (src) => pickField(src, 'usedAt', 'UsedAt'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
    couponId: (src) => pickField(src, 'couponId', 'CouponID'),
    orderId: (src) => pickField(src, 'orderId', 'OrderID'),
  },
  DeliveryPartner: {
    id: (src) => pickField(src, 'id', 'DeliveryPartnerID'),
    vehicleNumber: (src) => pickField(src, 'vehicleNumber', 'VehicleNumber'),
    licenseNumber: (src) => pickField(src, 'licenseNumber', 'LicenseNumber'),
    currentLatitude: (src) => pickField(src, 'currentLatitude', 'CurrentLatitude'),
    currentLongitude: (src) => pickField(src, 'currentLongitude', 'CurrentLongitude'),
    isAvailable: (src) => pickField(src, 'isAvailable', 'IsAvailable'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
  },
  RestaurantOwner: {
    id: (src) => pickField(src, 'id', 'OwnerID'),
    panNumber: (src) => pickField(src, 'panNumber', 'PANNumber'),
    bankAccountNo: (src) => pickField(src, 'bankAccountNo', 'BankAccountNo'),
    ifsc: (src) => pickField(src, 'ifsc', 'IFSC'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
  },
  SupportTicket: {
    id: (src) => pickField(src, 'id', 'TicketID'),
    issueType: (src) => pickField(src, 'issueType', 'IssueType'),
    description: (src) => pickField(src, 'description', 'Description'),
    status: (src) => pickField(src, 'status', 'Status'),
    createdAt: (src) => pickField(src, 'createdAt', 'CreatedAt'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
    orderId: (src) => pickField(src, 'orderId', 'OrderID'),
  },
  Notification: {
    id: (src) => pickField(src, 'id', 'NotificationID'),
    title: (src) => pickField(src, 'title', 'Title'),
    body: (src) => pickField(src, 'body', 'Body'),
    actionLink: (src) => pickField(src, 'actionLink', 'ActionLink'),
    isRead: (src) => pickField(src, 'isRead', 'IsRead'),
    receivedAt: (src) => pickField(src, 'receivedAt', 'ReceivedAt'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
  },
  WalletTransaction: {
    id: (src) => pickField(src, 'id', 'TransactionID'),
    transactionType: (src) => pickField(src, 'transactionType', 'TransactionType'),
    amount: (src) => pickField(src, 'amount', 'Amount'),
    description: (src) => pickField(src, 'description', 'Description'),
    createdAt: (src) => pickField(src, 'createdAt', 'CreatedAt'),
    userId: (src) => pickField(src, 'userId', 'UserID'),
  },
  // Subscription: {
  //   // TODO: Add subscriptions for real-time updates
  //   ...deliveryAndReviewResolvers.Subscription,
  // },
};

// ============================================
// CONTEXT BUILDER
// ============================================

const buildContext = async ({ req }) => {
  try {
    const authHeader = req.headers.authorization || '';

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return {
        userId: null,
        userRole: null,
        token: null,
        req,
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || null;
    const userRole = decoded.role || null;

    return {
      userId,
      userRole,
      token,
      req,
    };
  } catch (error) {
    console.error('Context builder auth error:', error.message);
    return { userId: null, userRole: null, token: null, req };
  }
};

// ============================================
// APOLLO SERVER CONFIGURATION
// ============================================

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: buildContext,
  formatError: (error) => {
    // Custom error formatting
    console.error('GraphQL Error:', error);

    return {
      message: error.message,
      code: error.extensions?.code,
      path: error.path,
    };
  },
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    {
      // Server startup hook
      async serverWillStart() {
        console.log('🚀 GraphQL Server starting...');
      },

      // Request hook
      async requestDidResolveOperation({ operation }) {
        console.log(`📝 ${operation.operation} ${operation.name?.value || 'Anonymous'}`);
      },

      // Error hook
      async didEncounterErrors({ errors, operation }) {
        for (const error of errors) {
          console.error(`❌ GraphQL Error in ${operation.name?.value}:`, error.message);
        }
      },
    },
  ],
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: parseInt(port), host },
      context: buildContext,
    });

    console.log(`✨ GraphQL Gateway running at: ${url}`);
    console.log(`📕 GraphQL Schema: ${url}`);
    console.log(`🎯 Health Check: ${url}`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing GraphQL server');
      server.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing GraphQL server');
      server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start GraphQL server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// ============================================
// PRODUCTION UTILITIES & HELPERS
// ============================================

/**
 * Response formatter for consistent API responses
 */
class ResponseFormatter {
  static success(data, message = 'Success') {
    return {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message, code = 'INTERNAL_ERROR', extensions = {}) {
    return {
      status: 'error',
      message,
      code,
      extensions,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(data, page = 1, limit = 10, total = 0) {
    return {
      status: 'success',
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Custom Error Classes for Better Error Handling
 */
class GraphQLCustomError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'GraphQLCustomError';
  }
}

class ValidationError extends GraphQLCustomError {
  constructor(message, fields = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fields = fields;
  }
}

class AuthenticationError extends GraphQLCustomError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

class AuthorizationError extends GraphQLCustomError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

class NotFoundError extends GraphQLCustomError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

class ConflictError extends GraphQLCustomError {
  constructor(message) {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * Input Validation Utilities
 */
const ValidationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Validate password strength
   */
  isStrongPassword: (password) => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize user input
   */
  sanitize: (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  },

  /**
   * Validate pagination parameters
   */
  validatePagination: (page = 1, limit = 10, maxLimit = 100) => {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(Math.max(1, parseInt(limit) || 10), maxLimit);
    return { page: validPage, limit: validLimit };
  },

  /**
   * Validate required fields
   */
  validateRequired: (data, requiredFields) => {
    const errors = {};
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors[field] = `${field} is required`;
      }
    });
    return Object.keys(errors).length > 0 ? errors : null;
  },

  /**
   * Validate object keys
   */
  validateKeys: (obj, allowedKeys) => {
    const invalidKeys = Object.keys(obj).filter(key => !allowedKeys.includes(key));
    return invalidKeys.length > 0 ? invalidKeys : null;
  },
};

/**
 * Authentication & Token Utilities
 */
const AuthUtils = {
  /**
   * Extract token from authorization header
   */
  extractToken: (authHeader) => {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
  },

  /**
   * Verify user authentication
   */
  requireAuth: (context) => {
    if (!context.userId) {
      throw new AuthenticationError('User must be authenticated');
    }
    return context.userId;
  },

  /**
   * Verify user role
   */
  requireRole: (context, roles) => {
    AuthUtils.requireAuth(context);
    if (!roles.includes(context.userRole)) {
      throw new AuthorizationError(`User role must be one of: ${roles.join(', ')}`);
    }
    return context.userRole;
  },

  /**
   * Verify admin access
   */
  requireAdmin: (context) => {
    AuthUtils.requireRole(context, ['admin']);
  },

  /**
   * Verify ownership
   */
  requireOwnership: (context, ownerId) => {
    AuthUtils.requireAuth(context);
    if (context.userId !== ownerId && context.userRole !== 'admin') {
      throw new AuthorizationError('You do not have permission to access this resource');
    }
  },
};

/**
 * Date & Time Utilities
 */
const DateUtils = {
  /**
   * Get current timestamp
   */
  now: () => new Date().toISOString(),

  /**
   * Add days to date
   */
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  },

  /**
   * Check if date is in past
   */
  isPast: (date) => new Date(date) < new Date(),

  /**
   * Check if date is in future
   */
  isFuture: (date) => new Date(date) > new Date(),

  /**
   * Format date for display
   */
  format: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    return format
      .replace('YYYY', d.getFullYear())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getSeconds()).padStart(2, '0'));
  },
};

/**
 * Calculation & Business Logic Utilities
 */
const BusinessLogicUtils = {
  /**
   * Calculate order total with tax and delivery charges
   */
  calculateOrderTotal: (subtotal, taxPercentage = 5, deliveryCharge = 50) => {
    const tax = (subtotal * taxPercentage) / 100;
    const total = subtotal + tax + deliveryCharge;
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      deliveryCharge,
      total: parseFloat(total.toFixed(2)),
    };
  },

  /**
   * Apply coupon discount
   */
  applyCoupon: (total, couponValue, isPercentage = false) => {
    const discount = isPercentage ? (total * couponValue) / 100 : couponValue;
    const finalTotal = total - discount;
    return {
      discount: parseFloat(discount.toFixed(2)),
      finalTotal: parseFloat(finalTotal.toFixed(2)),
    };
  },

  /**
   * Calculate delivery partner earnings
   */
  calculateEarnings: (orderTotal, commissionPercentage = 10) => {
    const earnings = (orderTotal * commissionPercentage) / 100;
    return parseFloat(earnings.toFixed(2));
  },

  /**
   * Calculate restaurant commission
   */
  calculateRestaurantCommission: (orderTotal, commissionPercentage = 5) => {
    const commission = (orderTotal * commissionPercentage) / 100;
    return parseFloat(commission.toFixed(2));
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  },

  /**
   * Generate order reference number
   */
  generateOrderReference: () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  },

  /**
   * Generate transaction reference
   */
  generateTransactionReference: () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  },
};

/**
 * Logging & Monitoring Utilities
 */
const LoggerUtils = {
  /**
   * Log operation
   */
  log: (level, message, data = {}) => {
    console.log(`[${level}] ${new Date().toISOString()} - ${message}`, data);
  },

  /**
   * Log success
   */
  success: (message, data) => LoggerUtils.log('SUCCESS', message, data),

  /**
   * Log error
   */
  error: (message, error) => LoggerUtils.log('ERROR', message, error),

  /**
   * Log warning
   */
  warning: (message, data) => LoggerUtils.log('WARNING', message, data),

  /**
   * Log info
   */
  info: (message, data) => LoggerUtils.log('INFO', message, data),

  /**
   * Log GraphQL operation performance
   */
  logPerformance: (operation, duration) => {
    console.log(`⏱️ ${operation} completed in ${duration}ms`);
  },
};

/**
 * Cache & Rate Limiting Utilities
 */
const CacheUtils = {
  cache: new Map(),

  /**
   * Set cache value with TTL (Time To Live)
   */
  set: (key, value, ttlSeconds = 300) => {
    CacheUtils.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  },

  /**
   * Get cache value
   */
  get: (key) => {
    const cached = CacheUtils.cache.get(key);
    if (!cached) return null;

    if (cached.expiresAt < Date.now()) {
      CacheUtils.cache.delete(key);
      return null;
    }

    return cached.value;
  },

  /**
   * Clear cache
   */
  clear: (key = null) => {
    if (key) {
      CacheUtils.cache.delete(key);
    } else {
      CacheUtils.cache.clear();
    }
  },

  /**
   * Generate cache key
   */
  generateKey: (...parts) => parts.join(':'),
};

/**
 * CONSTANTS
 */
const API_CONSTANTS = {
  // Order Status
  ORDER_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },

  // Payment Method
  PAYMENT_METHOD: {
    CREDIT_CARD: 'CREDIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
    UPI: 'UPI',
    WALLET: 'WALLET',
    CASH_ON_DELIVERY: 'CASH_ON_DELIVERY',
  },

  // User Roles
  USER_ROLE: {
    USER: 'user',
    RESTAURANT: 'restaurant',
    DELIVERY_PARTNER: 'delivery_partner',
    ADMIN: 'admin',
  },

  // Delivery Status
  DELIVERY_STATUS: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  },

  // Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  },

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,

  // Timeouts
  REQUEST_TIMEOUT: 30000,
  CACHE_TTL: 300,

  // Business Rules
  MIN_ORDER_AMOUNT: 100,
  MAX_DISCOUNT: 50,
  DEFAULT_COMMISSION: 5,
  DEFAULT_TAX_RATE: 5,
  DEFAULT_DELIVERY_CHARGE: 50,
};

/**
 * Export all utilities for use in resolvers
 */
const GraphQLGatewayUtils = {
  ResponseFormatter,
  GraphQLCustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ValidationUtils,
  AuthUtils,
  DateUtils,
  BusinessLogicUtils,
  LoggerUtils,
  CacheUtils,
  API_CONSTANTS,
};

module.exports = { server, GraphQLGatewayUtils };
//         request.http.headers.set('x-user-id', context.userId);
//         request.http.headers.set('x-user-role', context.userRole);
//       },
//     });
//   },
// });

// const server = new ApolloServer({ gateway });

// (async () => {
//   const { url } = await startStandaloneServer(server, {
//     context: async ({ req }) => {
//       // JWT Validation happens here
//       const token = req.headers.authorization || '';
//       const user = decodeToken(token); // Implement your JWT decode logic
//       return { userId: user?.id, userRole: user?.role };
//     },
//     listen: { port: 4000 },
//   });
//   console.log(`🚀 Gateway ready at ${url}`);
// })();