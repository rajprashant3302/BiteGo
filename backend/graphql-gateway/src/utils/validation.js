// ============================================
// SHARED VALIDATION UTILITIES
// ============================================

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Validation Functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  return true;
};

const validatePassword = (password) => {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one digit');
  }
  return true;
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone number format');
  }
  return true;
};

const validateCoordinates = (latitude, longitude) => {
  if (latitude < -90 || latitude > 90) {
    throw new ValidationError('Latitude must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new ValidationError('Longitude must be between -180 and 180');
  }
  return true;
};

const validateOrderStatus = (status) => {
  const validStatuses = ['Placed', 'Preparing', 'PickedUp', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid order status: ${status}`);
  }
  return true;
};

const validatePaymentMethod = (method) => {
  const validMethods = ['UPI', 'Card', 'Wallet', 'COD'];
  if (!validMethods.includes(method)) {
    throw new ValidationError(`Invalid payment method: ${method}`);
  }
  return true;
};

const validateDiscountType = (type) => {
  const validTypes = ['Flat', 'Percentage'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid discount type: ${type}`);
  }
  return true;
};

const validateRating = (rating) => {
  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }
  return true;
};

const validatePagination = (page = 1, pageSize = 20) => {
  if (page < 1) {
    throw new ValidationError('Page must be greater than 0');
  }
  if (pageSize < 1 || pageSize > 100) {
    throw new ValidationError('Page size must be between 1 and 100');
  }
  return { page, pageSize };
};

// ============================================
// ERROR HANDLING
// ============================================

const handleResolverError = (error, context = '') => {
  console.error(`[ERROR] ${context}:`, error);
  
  if (error instanceof ValidationError) {
    throw new Error(error.message);
  }
  
  if (error instanceof NotFoundError) {
    throw new Error(error.message);
  }
  
  if (error instanceof UnauthorizedError) {
    throw new Error(error.message);
  }
  
  throw new Error('Internal server error');
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateDiscountAmount = (originalAmount, discountType, discountValue, maxDiscount = null) => {
  let discount = 0;
  
  if (discountType === 'Flat') {
    discount = discountValue;
  } else if (discountType === 'Percentage') {
    discount = (originalAmount * discountValue) / 100;
  }
  
  // Apply max discount limit if set (for percentage discounts)
  if (maxDiscount && discount > maxDiscount) {
    discount = maxDiscount;
  }
  
  return Math.min(discount, originalAmount);
};

const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    const itemTotal = parseFloat(item.itemPrice) * item.quantity;
    return total + itemTotal;
  }, 0);
};

const generateAuthToken = (userId, role) => {
  // This would typically use JWT. This is a placeholder.
  return `token_${userId}_${role}_${Date.now()}`;
};

const maskEmail = (email) => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
  return `${maskedLocal}@${domain}`;
};

const maskPhone = (phone) => {
  return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
};

module.exports = {
  // Error Classes
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  
  // Validation Functions
  validateEmail,
  validatePassword,
  validatePhone,
  validateCoordinates,
  validateOrderStatus,
  validatePaymentMethod,
  validateDiscountType,
  validateRating,
  validatePagination,
  
  // Error Handling
  handleResolverError,
  
  // Utilities
  calculateDistance,
  calculateDiscountAmount,
  calculateOrderTotal,
  generateAuthToken,
  maskEmail,
  maskPhone,
};
