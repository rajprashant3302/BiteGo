// ============================================
// GRAPHQL CONTEXT & CONFIG
// ============================================

// Role-based authorization levels
const ROLE_HIERARCHY = {
  SuperAdmin: 5,
  Ops: 4,
  Support: 3,
  RestaurantOwner: 2,
  DeliveryPartner: 2,
  User: 1,
};

const ADMIN_ROLES = ['SuperAdmin', 'Ops'];
const SUPPORT_ROLES = ['SuperAdmin', 'Support', 'Ops'];
const RESTAURANT_ROLES = ['RestaurantOwner', 'SuperAdmin'];
const DELIVERY_ROLES = ['DeliveryPartner', 'SuperAdmin'];

// Order status flow
const ORDER_STATUS_FLOW = {
  Placed: ['Preparing', 'Cancelled'],
  Preparing: ['PickedUp', 'Cancelled'],
  PickedUp: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

// Payment methods
const PAYMENT_METHODS = ['UPI', 'Card', 'Wallet', 'COD'];
const PREPAID_METHODS = ['UPI', 'Card', 'Wallet'];
const COD_METHOD = 'COD';

// Discount types
const DISCOUNT_TYPES = {
  Flat: 'Flat',
  Percentage: 'Percentage',
};

// Commission percentages
const COMMISSION_CONFIG = {
  RESTAURANT_COMMISSION: 0.75, // 75% to restaurant
  DELIVERY_COMMISSION: 0.15, // 15% to delivery partner
  PLATFORM_COMMISSION: 0.1, // 10% to platform
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  USER: 600,
  RESTAURANT: 300,
  MENU: 300,
  ORDER: 60,
  PAYMENT: 30,
};

// Validation rules
const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    UPPERCASE: true,
    LOWERCASE: true,
    NUMBERS: true,
    SPECIAL_CHARS: false,
  },
  PHONE_MIN_LENGTH: 10,
  PINCODE_LENGTH: 5,
};

// Rating limits
const RATING_LIMITS = {
  MIN: 1,
  MAX: 5,
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  UNAUTHORIZED_ERROR: 'UNAUTHORIZED_ERROR',
  FORBIDDEN_ERROR: 'FORBIDDEN_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// HTTP Status codes mapping
const HTTP_STATUS_CODES = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.NOT_FOUND_ERROR]: 404,
  [ERROR_CODES.UNAUTHORIZED_ERROR]: 401,
  [ERROR_CODES.FORBIDDEN_ERROR]: 403,
  [ERROR_CODES.CONFLICT_ERROR]: 409,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
};

// Feature flags
const FEATURES = {
  WALLET_ENABLED: true,
  REFERRAL_ENABLED: false,
  SUBSCRIPTION_ENABLED: false,
  PREMIUM_DELIVERY: false,
};

module.exports = {
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  SUPPORT_ROLES,
  RESTAURANT_ROLES,
  DELIVERY_ROLES,
  ORDER_STATUS_FLOW,
  PAYMENT_METHODS,
  PREPAID_METHODS,
  COD_METHOD,
  DISCOUNT_TYPES,
  COMMISSION_CONFIG,
  PAGINATION,
  CACHE_TTL,
  VALIDATION_RULES,
  RATING_LIMITS,
  ERROR_CODES,
  HTTP_STATUS_CODES,
  FEATURES,
};
