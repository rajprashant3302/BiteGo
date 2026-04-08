// ============================================
// USER RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validateEmail,
  validatePassword,
  validatePhone,
  validatePagination,
  handleResolverError,
  generateAuthToken,
} = require('../utils/validation');

const bcrypt = require('bcrypt');
const { prisma } = require('database');

const userResolvers = {
  Query: {
    /**
     * Get user by ID
     */
    async getUserById(_, { id }) {
      try {
        const user = await prisma.user.findUnique({
          where: { UserID: id },
          include: {
            addresses: true,
            restaurantOwner: true,
            deliveryPartner: true,
          },
        });

        if (!user) {
          throw new NotFoundError('User', id);
        }

        return formatUserResponse(user);
      } catch (error) {
        handleResolverError(error, 'getUserById');
      }
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser(_, __, { userId }) {
      try {
        if (!userId) {
          throw new UnauthorizedError('User not authenticated');
        }

        const user = await prisma.user.findUnique({
          where: { UserID: userId },
          include: {
            addresses: true,
            restaurantOwner: true,
            deliveryPartner: true,
          },
        });

        if (!user) {
          throw new NotFoundError('User', userId);
        }

        return formatUserResponse(user);
      } catch (error) {
        handleResolverError(error, 'getCurrentUser');
      }
    },

    /**
     * Get user by email
     */
    async getUserByEmail(_, { email }) {
      try {
        validateEmail(email);

        const user = await prisma.user.findUnique({
          where: { Email: email },
          include: {
            addresses: true,
            restaurantOwner: true,
            deliveryPartner: true,
          },
        });

        if (!user) {
          throw new NotFoundError('User', email);
        }

        return formatUserResponse(user);
      } catch (error) {
        handleResolverError(error, 'getUserByEmail');
      }
    },

    /**
     * Get user addresses
     */
    async getUserAddresses(_, { userId }) {
      try {
        return await prisma.address.findMany({
          where: { UserID: userId },
        });
      } catch (error) {
        handleResolverError(error, 'getUserAddresses');
      }
    },

    /**
     * Get address by ID
     */
    async getAddressById(_, { id }) {
      try {
        const address = await prisma.address.findUnique({
          where: { AddressID: id },
        });

        if (!address) {
          throw new NotFoundError('Address', id);
        }

        return address;
      } catch (error) {
        handleResolverError(error, 'getAddressById');
      }
    },

    /**
     * Get user wallet balance
     */
    async getUserWalletBalance(_, { userId }) {
      try {
        const user = await prisma.user.findUnique({
          where: { UserID: userId },
          select: { WalletBalance: true },
        });

        if (!user) {
          throw new NotFoundError('User', userId);
        }

        return user.WalletBalance;
      } catch (error) {
        handleResolverError(error, 'getUserWalletBalance');
      }
    },

    /**
     * Get wallet transactions
     */
    async getUserWalletTransactions(_, { userId, limit = 50, offset = 0 }) {
      try {
        return await prisma.walletTransaction.findMany({
          where: { UserID: userId },
          take: limit,
          skip: offset,
          orderBy: { CreatedAt: 'desc' },
        });
      } catch (error) {
        handleResolverError(error, 'getUserWalletTransactions');
      }
    },

    /**
     * Search users (Admin only)
     */
    async searchUsers(_, { query, role, limit = 20 }, { userId, userRole }) {
      try {
        // TODO: Add role-based authorization check
        const whereClause = {
          OR: [{ Name: { contains: query, mode: 'insensitive' } }, { Email: { contains: query, mode: 'insensitive' } }],
        };

        if (role) {
          whereClause.Role = role;
        }

        const users = await prisma.user.findMany({
          where: whereClause,
          take: limit,
        });

        return users.map(formatUserResponse);
      } catch (error) {
        handleResolverError(error, 'searchUsers');
      }
    },
  },

  Mutation: {
    /**
     * Register new user
     */
    async registerUser(_, { input }) {
      try {
        const { name, email, phone, password, role } = input;

        // Validation
        validateEmail(email);
        validatePassword(password);
        if (phone) validatePhone(phone);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { Email: email },
        });

        if (existingUser) {
          throw new ValidationError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            Name: name,
            Email: email,
            Phone: phone,
            Role: role,
            PasswordHash: hashedPassword,
            WalletBalance: new Decimal('0'),
            IsActive: true,
          },
          include: {
            addresses: true,
            restaurantOwner: true,
            deliveryPartner: true,
          },
        });

        // Generate token
        const token = generateAuthToken(user.UserID, user.Role);

        return {
          token,
          user: formatUserResponse(user),
        };
      } catch (error) {
        handleResolverError(error, 'registerUser');
      }
    },

    /**
     * Login user
     */
    async loginUser(_, { input }) {
      try {
        const { email, password } = input;

        validateEmail(email);

        const user = await prisma.user.findUnique({
          where: { Email: email },
        });

        if (!user) {
          throw new ValidationError('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!passwordMatch) {
          throw new ValidationError('Invalid email or password');
        }

        if (!user.IsActive) {
          throw new ValidationError('Account is inactive');
        }

        const token = generateAuthToken(user.UserID, user.Role);

        return {
          token,
          user: formatUserResponse(user),
        };
      } catch (error) {
        handleResolverError(error, 'loginUser');
      }
    },

    /**
     * Update user profile
     */
    async updateUserProfile(_, { userId, input }, { userId: authUserId }) {
      try {
        // TODO: Add authorization check
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot update other users profile');
        }

        const { name, phone, profilePicUrl } = input;

        if (phone) validatePhone(phone);

        const updateData = {};
        if (name) updateData.Name = name;
        if (phone) updateData.Phone = phone;
        if (profilePicUrl) updateData.ProfilePicURL = profilePicUrl;

        const updatedUser = await prisma.user.update({
          where: { UserID: userId },
          data: updateData,
        });

        return formatUserResponse(updatedUser);
      } catch (error) {
        handleResolverError(error, 'updateUserProfile');
      }
    },

    /**
     * Update profile picture
     */
    async updateUserProfilePicture(_, { userId, imageUrl }, { userId: authUserId }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot update other users profile');
        }

        const updatedUser = await prisma.user.update({
          where: { UserID: userId },
          data: { ProfilePicURL: imageUrl },
        });

        return formatUserResponse(updatedUser);
      } catch (error) {
        handleResolverError(error, 'updateUserProfilePicture');
      }
    },

    /**
     * Add address
     */
    async addAddress(_, { userId, input }, { userId: authUserId }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot add address for other users');
        }

        const { addressLine, city, pincode, latitude, longitude, isDefault } = input;

        // Reset other default addresses if this is default
        if (isDefault) {
          await prisma.address.updateMany({
            where: { UserID: userId, IsDefault: true },
            data: { IsDefault: false },
          });
        }

        const address = await prisma.address.create({
          data: {
            AddressLine: addressLine,
            City: city,
            Pincode: pincode,
            Latitude: new Decimal(latitude),
            Longitude: new Decimal(longitude),
            IsDefault: isDefault || false,
            UserID: userId,
          },
        });

        return address;
      } catch (error) {
        handleResolverError(error, 'addAddress');
      }
    },

    /**
     * Update address
     */
    async updateAddress(_, { addressId, input }, { userId: authUserId }) {
      try {
        const { addressLine, city, pincode, latitude, longitude, isDefault } = input;

        // Verify ownership
        const address = await prisma.address.findUnique({
          where: { AddressID: addressId },
        });

        if (!address || address.UserID !== authUserId) {
          throw new UnauthorizedError('Cannot update this address');
        }

        if (isDefault) {
          await prisma.address.updateMany({
            where: { UserID: address.UserID, IsDefault: true },
            data: { IsDefault: false },
          });
        }

        const updatedAddress = await prisma.address.update({
          where: { AddressID: addressId },
          data: {
            AddressLine: addressLine,
            City: city,
            Pincode: pincode,
            Latitude: new Decimal(latitude),
            Longitude: new Decimal(longitude),
            IsDefault,
          },
        });

        return updatedAddress;
      } catch (error) {
        handleResolverError(error, 'updateAddress');
      }
    },

    /**
     * Delete address
     */
    async deleteAddress(_, { addressId }, { userId: authUserId }) {
      try {
        const address = await prisma.address.findUnique({
          where: { AddressID: addressId },
        });

        if (!address || address.UserID !== authUserId) {
          throw new UnauthorizedError('Cannot delete this address');
        }

        await prisma.address.delete({
          where: { AddressID: addressId },
        });

        return { success: true, message: 'Address deleted successfully' };
      } catch (error) {
        handleResolverError(error, 'deleteAddress');
      }
    },

    /**
     * Set default address
     */
    async setDefaultAddress(_, { addressId }, { userId: authUserId }) {
      try {
        const address = await prisma.address.findUnique({
          where: { AddressID: addressId },
        });

        if (!address || address.UserID !== authUserId) {
          throw new UnauthorizedError('Cannot update this address');
        }

        // Reset other default addresses
        await prisma.address.updateMany({
          where: { UserID: authUserId, IsDefault: true },
          data: { IsDefault: false },
        });

        const updatedAddress = await prisma.address.update({
          where: { AddressID: addressId },
          data: { IsDefault: true },
        });

        return updatedAddress;
      } catch (error) {
        handleResolverError(error, 'setDefaultAddress');
      }
    },

    /**
     * Add wallet balance
     */
    async addWalletBalance(_, { userId, amount }, { userId: authUserId, userRole }) {
      try {
        // TODO: Add authorization check (admin only)
        const user = await prisma.user.findUnique({
          where: { UserID: userId },
        });

        if (!user) {
          throw new NotFoundError('User', userId);
        }

        const newBalance = user.WalletBalance + new Decimal(amount);

        await prisma.user.update({
          where: { UserID: userId },
          data: { WalletBalance: newBalance },
        });

        const transaction = await prisma.walletTransaction.create({
          data: {
            UserID: userId,
            TransactionType: 'Credit',
            Amount: new Decimal(amount),
            Description: 'Wallet top-up',
          },
        });

        return transaction;
      } catch (error) {
        handleResolverError(error, 'addWalletBalance');
      }
    },

    /**
     * Deduct wallet balance
     */
    async deductWalletBalance(_, { userId, amount, description }, { userId: authUserId }) {
      try {
        if (userId !== authUserId) {
          throw new UnauthorizedError('Cannot deduct from other users wallet');
        }

        const user = await prisma.user.findUnique({
          where: { UserID: userId },
        });

        if (!user) {
          throw new NotFoundError('User', userId);
        }

        if (user.WalletBalance < new Decimal(amount)) {
          throw new ValidationError('Insufficient wallet balance');
        }

        const newBalance = user.WalletBalance - new Decimal(amount);

        await prisma.user.update({
          where: { UserID: userId },
          data: { WalletBalance: newBalance },
        });

        const transaction = await prisma.walletTransaction.create({
          data: {
            UserID: userId,
            TransactionType: 'Debit',
            Amount: new Decimal(amount),
            Description: description || 'Wallet deduction',
          },
        });

        return transaction;
      } catch (error) {
        handleResolverError(error, 'deductWalletBalance');
      }
    },

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(_, { notificationId }, { userId }) {
      try {
        const notification = await prisma.notificationInbox.findUnique({
          where: { NotificationID: notificationId },
        });

        if (!notification || notification.UserID !== userId) {
          throw new UnauthorizedError('Cannot update this notification');
        }

        const updated = await prisma.notificationInbox.update({
          where: { NotificationID: notificationId },
          data: { IsRead: true },
        });

        return updated;
      } catch (error) {
        handleResolverError(error, 'markNotificationAsRead');
      }
    },

    /**
     * Delete notification
     */
    async deleteNotification(_, { notificationId }, { userId }) {
      try {
        const notification = await prisma.notificationInbox.findUnique({
          where: { NotificationID: notificationId },
        });

        if (!notification || notification.UserID !== userId) {
          throw new UnauthorizedError('Cannot delete this notification');
        }

        await prisma.notificationInbox.delete({
          where: { NotificationID: notificationId },
        });

        return { success: true, message: 'Notification deleted successfully' };
      } catch (error) {
        handleResolverError(error, 'deleteNotification');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatUserResponse = (user) => {
  return {
    id: user.UserID,
    name: user.Name,
    email: user.Email,
    phone: user.Phone,
    role: user.Role,
    profilePicUrl: user.ProfilePicURL,
    walletBalance: user.WalletBalance,
    isActive: user.IsActive,
    createdAt: user.CreatedAt,
    addresses: user.addresses,
    restaurantOwner: user.restaurantOwner,
    deliveryPartner: user.deliveryPartner,
  };
};

module.exports = userResolvers;
