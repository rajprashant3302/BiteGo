// ============================================
// AUTHORIZATION & MIDDLEWARE
// ============================================

const {
  ADMIN_ROLES,
  SUPPORT_ROLES,
  RESTAURANT_ROLES,
  DELIVERY_ROLES,
  ROLE_HIERARCHY,
} = require('../config/constants');

const { UnauthorizedError } = require('../utils/validation');

/**
 * Check if user is authenticated
 */
const requireAuth = (context) => {
  if (!context.userId) {
    throw new UnauthorizedError('User must be authenticated');
  }
};

/**
 * Check if user has required role
 */
const requireRole = (context, allowedRoles) => {
  requireAuth(context);

  if (!allowedRoles.includes(context.userRole)) {
    throw new UnauthorizedError(
      `User role ${context.userRole} does not have access to this resource. Required roles: ${allowedRoles.join(', ')}`
    );
  }
};

/**
 * Check if user is admin
 */
const requireAdmin = (context) => {
  requireRole(context, ADMIN_ROLES);
};

/**
 * Check if user is support staff
 */
const requireSupport = (context) => {
  requireRole(context, SUPPORT_ROLES);
};

/**
 * Check if user is restaurant owner
 */
const requireRestaurantOwner = (context) => {
  requireRole(context, RESTAURANT_ROLES);
};

/**
 * Check if user is delivery partner
 */
const requireDeliveryPartner = (context) => {
  requireRole(context, DELIVERY_ROLES);
};

/**
 * Check if user owns the resource
 */
const requireOwnership = (userId, resourceOwnerId, context) => {
  requireAuth(context);

  // Admins can access any resource
  if (ADMIN_ROLES.includes(context.userRole)) {
    return true;
  }

  if (userId !== resourceOwnerId) {
    throw new UnauthorizedError('You do not have access to this resource');
  }

  return true;
};

/**
 * Check if user has higher or equal role level
 */
const hasRoleLevel = (userRole, requiredLevel) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Wrap resolver with authorization
 */
const withAuth = (resolver, requiredRoles = []) => {
  return async (parent, args, context, info) => {
    if (requiredRoles.length > 0) {
      requireRole(context, requiredRoles);
    } else {
      requireAuth(context);
    }

    return resolver(parent, args, context, info);
  };
};

/**
 * Wrap resolver with admin authorization
 */
const withAdminAuth = (resolver) => {
  return withAuth(resolver, ADMIN_ROLES);
};

/**
 * Wrap resolver with support authorization
 */
const withSupportAuth = (resolver) => {
  return withAuth(resolver, SUPPORT_ROLES);
};

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireSupport,
  requireRestaurantOwner,
  requireDeliveryPartner,
  requireOwnership,
  hasRoleLevel,
  withAuth,
  withAdminAuth,
  withSupportAuth,
};
