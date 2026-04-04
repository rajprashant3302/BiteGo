// ============================================
// RESTAURANT RESOLVERS
// ============================================

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  validateCoordinates,
  validatePagination,
  calculateDistance,
  handleResolverError,
} = require('../utils/validation');

const { prisma } = require('database');
const { Decimal } = require('@prisma/client/runtime/library');

const restaurantResolvers = {
  Query: {
    /**
     * Get paginated restaurants with optional filters
     */
    async getRestaurants(
      _,
      { page = 1, pageSize = 20, latitude, longitude, radius = 5, searchQuery, rating },
      { userId }
    ) {
      try {
        validatePagination(page, pageSize);

        const skip = (page - 1) * pageSize;
        const whereClause = { IsActive: true };

        if (searchQuery) {
          whereClause.OR = [
            { Name: { contains: searchQuery, mode: 'insensitive' } },
            { CategoryName: { contains: searchQuery, mode: 'insensitive' } },
          ];
        }

        if (rating) {
          whereClause.Rating = { gte: new Decimal(rating) };
        }

        const restaurants = await prisma.restaurant.findMany({
          where: whereClause,
          skip,
          take: pageSize,
          include: {
            owner: true,
            menuItems: { take: 5 }, // Get sample items
          },
        });

        // Filter by distance if coordinates provided
        let filtered = restaurants;
        if (latitude && longitude) {
          validateCoordinates(latitude, longitude);
          filtered = restaurants.filter((restaurant) => {
            if (!restaurant.Latitude || !restaurant.Longitude) return false;
            const distance = calculateDistance(
              latitude,
              longitude,
              parseFloat(restaurant.Latitude),
              parseFloat(restaurant.Longitude)
            );
            return distance <= parseFloat(radius);
          });
        }

        const total = await prisma.restaurant.count({ where: whereClause });

        return {
          restaurants: filtered.map(formatRestaurantResponse),
          total,
          page,
          pageSize,
        };
      } catch (error) {
        handleResolverError(error, 'getRestaurants');
      }
    },

    /**
     * Get restaurant by ID
     */
    async getRestaurantById(_, { id }) {
      try {
        const restaurant = await prisma.restaurant.findUnique({
          where: { RestaurantID: id },
          include: {
            owner: true,
            menuItems: true,
            reviews: { take: 10 },
            offers: { where: { IsActive: true } },
          },
        });

        if (!restaurant) {
          throw new NotFoundError('Restaurant', id);
        }

        return formatRestaurantResponse(restaurant);
      } catch (error) {
        handleResolverError(error, 'getRestaurantById');
      }
    },

    /**
     * Get restaurants by owner
     */
    async getRestaurantsByOwner(_, { ownerId }, { userId, userRole }) {
      try {
        // TODO: Add authorization check
        const restaurants = await prisma.restaurant.findMany({
          where: { OwnerID: ownerId },
          include: {
            owner: true,
            menuItems: true,
          },
        });

        return restaurants.map(formatRestaurantResponse);
      } catch (error) {
        handleResolverError(error, 'getRestaurantsByOwner');
      }
    },

    /**
     * Get menu items by restaurant
     */
    async getMenuByRestaurant(_, { restaurantId, onlyAvailable = true }) {
      try {
        const whereClause = { RestaurantID: restaurantId };
        if (onlyAvailable) {
          whereClause.IsAvailable = true;
        }

        return await prisma.menuItem.findMany({
          where: whereClause,
          orderBy: { ItemName: 'asc' },
        });
      } catch (error) {
        handleResolverError(error, 'getMenuByRestaurant');
      }
    },

    /**
     * Get menu item by ID
     */
    async getMenuItemById(_, { id }) {
      try {
        const item = await prisma.menuItem.findUnique({
          where: { ItemID: id },
          include: { restaurant: true },
        });

        if (!item) {
          throw new NotFoundError('Menu Item', id);
        }

        return item;
      } catch (error) {
        handleResolverError(error, 'getMenuItemById');
      }
    },

    /**
     * Search menu items
     */
    async searchMenuItems(_, { restaurantId, query }) {
      try {
        return await prisma.menuItem.findMany({
          where: {
            RestaurantID: restaurantId,
            OR: [
              { ItemName: { contains: query, mode: 'insensitive' } },
              { Description: { contains: query, mode: 'insensitive' } },
            ],
          },
        });
      } catch (error) {
        handleResolverError(error, 'searchMenuItems');
      }
    },

    /**
     * Get restaurant offers
     */
    async getRestaurantOffers(_, { restaurantId }) {
      try {
        return await prisma.offer.findMany({
          where: { RestaurantID: restaurantId },
          include: { applicableItems: true },
        });
      } catch (error) {
        handleResolverError(error, 'getRestaurantOffers');
      }
    },

    /**
     * Get active offers for a restaurant
     */
    async getActiveOffers(_, { restaurantId }) {
      try {
        const now = new Date();
        return await prisma.offer.findMany({
          where: {
            RestaurantID: restaurantId,
            IsActive: true,
            StartTime: { lte: now },
            EndTime: { gte: now },
          },
          include: { applicableItems: true },
        });
      } catch (error) {
        handleResolverError(error, 'getActiveOffers');
      }
    },
  },

  Mutation: {
    /**
     * Create restaurant
     */
    async createRestaurant(_, { ownerId, input }, { userId, userRole }) {
      try {
        // TODO: Add authorization check - must be RestaurantOwner

        const { name, categoryName, latitude, longitude, zoneId } = input;

        if (!name || !categoryName) {
          throw new ValidationError('Name and category name are required');
        }

        if (latitude && longitude) {
          validateCoordinates(latitude, longitude);
        }

        // Verify owner exists
        const owner = await prisma.restaurantOwner.findUnique({
          where: { OwnerID: ownerId },
        });

        if (!owner) {
          throw new NotFoundError('Restaurant Owner', ownerId);
        }

        const restaurant = await prisma.restaurant.create({
          data: {
            Name: name,
            CategoryName: categoryName,
            Latitude: latitude ? new Decimal(latitude) : null,
            Longitude: longitude ? new Decimal(longitude) : null,
            OwnerID: ownerId,
            ZoneID: zoneId,
            IsActive: true,
            IsOpen: true,
          },
          include: { owner: true },
        });

        return formatRestaurantResponse(restaurant);
      } catch (error) {
        handleResolverError(error, 'createRestaurant');
      }
    },

    /**
     * Update restaurant
     */
    async updateRestaurant(_, { restaurantId, input }, { userId, userRole }) {
      try {
        const restaurant = await prisma.restaurant.findUnique({
          where: { RestaurantID: restaurantId },
          include: { owner: true },
        });

        if (!restaurant) {
          throw new NotFoundError('Restaurant', restaurantId);
        }

        // TODO: Add authorization check

        const { name, categoryName, latitude, longitude, rating } = input;

        const updateData = {};
        if (name) updateData.Name = name;
        if (categoryName) updateData.CategoryName = categoryName;
        if (latitude && longitude) {
          validateCoordinates(latitude, longitude);
          updateData.Latitude = new Decimal(latitude);
          updateData.Longitude = new Decimal(longitude);
        }
        if (rating) updateData.Rating = new Decimal(rating);

        const updated = await prisma.restaurant.update({
          where: { RestaurantID: restaurantId },
          data: updateData,
          include: { owner: true },
        });

        return formatRestaurantResponse(updated);
      } catch (error) {
        handleResolverError(error, 'updateRestaurant');
      }
    },

    /**
     * Toggle restaurant status
     */
    async toggleRestaurantStatus(_, { restaurantId, isActive }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const updated = await prisma.restaurant.update({
          where: { RestaurantID: restaurantId },
          data: { IsActive: isActive },
          include: { owner: true },
        });

        return formatRestaurantResponse(updated);
      } catch (error) {
        handleResolverError(error, 'toggleRestaurantStatus');
      }
    },

    /**
     * Toggle restaurant hours
     */
    async toggleRestaurantHours(_, { restaurantId, isOpen }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const updated = await prisma.restaurant.update({
          where: { RestaurantID: restaurantId },
          data: { IsOpen: isOpen },
          include: { owner: true },
        });

        return formatRestaurantResponse(updated);
      } catch (error) {
        handleResolverError(error, 'toggleRestaurantHours');
      }
    },

    /**
     * Add menu item
     */
    async addMenuItem(_, { restaurantId, input }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const { itemName, description, itemImageUrl, price, isVeg, availableQuantity } = input;

        if (!itemName || !price) {
          throw new ValidationError('Item name and price are required');
        }

        const item = await prisma.menuItem.create({
          data: {
            ItemName: itemName,
            Description: description,
            ItemImageURL: itemImageUrl,
            Price: new Decimal(price),
            IsVeg: isVeg,
            IsAvailable: true,
            AvailableQuantity: availableQuantity || 0,
            RestaurantID: restaurantId,
          },
          include: { restaurant: true },
        });

        return item;
      } catch (error) {
        handleResolverError(error, 'addMenuItem');
      }
    },

    /**
     * Update menu item
     */
    async updateMenuItem(_, { itemId, input }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const { itemName, description, itemImageUrl, price, isVeg, availableQuantity } = input;

        const updateData = {};
        if (itemName) updateData.ItemName = itemName;
        if (description) updateData.Description = description;
        if (itemImageUrl) updateData.ItemImageURL = itemImageUrl;
        if (price) updateData.Price = new Decimal(price);
        if (isVeg !== undefined) updateData.IsVeg = isVeg;
        if (availableQuantity !== undefined) updateData.AvailableQuantity = availableQuantity;

        const updated = await prisma.menuItem.update({
          where: { ItemID: itemId },
          data: updateData,
          include: { restaurant: true },
        });

        return updated;
      } catch (error) {
        handleResolverError(error, 'updateMenuItem');
      }
    },

    /**
     * Delete menu item
     */
    async deleteMenuItem(_, { itemId }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        await prisma.menuItem.delete({
          where: { ItemID: itemId },
        });

        return { success: true, message: 'Menu item deleted successfully' };
      } catch (error) {
        handleResolverError(error, 'deleteMenuItem');
      }
    },

    /**
     * Toggle menu item availability
     */
    async toggleMenuItemAvailability(_, { itemId, isAvailable }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const updated = await prisma.menuItem.update({
          where: { ItemID: itemId },
          data: { IsAvailable: isAvailable },
          include: { restaurant: true },
        });

        return updated;
      } catch (error) {
        handleResolverError(error, 'toggleMenuItemAvailability');
      }
    },

    /**
     * Update menu item quantity
     */
    async updateMenuItemQuantity(_, { itemId, quantity }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const updated = await prisma.menuItem.update({
          where: { ItemID: itemId },
          data: { AvailableQuantity: quantity },
          include: { restaurant: true },
        });

        return updated;
      } catch (error) {
        handleResolverError(error, 'updateMenuItemQuantity');
      }
    },

    /**
     * Add multiple menu items
     */
    async addMultipleMenuItems(_, { restaurantId, items }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const createdItems = await Promise.all(
          items.map((item) =>
            prisma.menuItem.create({
              data: {
                ItemName: item.itemName,
                Description: item.description,
                ItemImageURL: item.itemImageUrl,
                Price: new Decimal(item.price),
                IsVeg: item.isVeg,
                IsAvailable: true,
                AvailableQuantity: item.availableQuantity || 0,
                RestaurantID: restaurantId,
              },
            })
          )
        );

        return createdItems;
      } catch (error) {
        handleResolverError(error, 'addMultipleMenuItems');
      }
    },

    /**
     * Update menu item prices
     */
    async updateMenuItemPrices(_, { restaurantId, updates }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const updatedItems = await Promise.all(
          updates.map((update) =>
            prisma.menuItem.update({
              where: { ItemID: update.itemId },
              data: { Price: new Decimal(update.newPrice) },
            })
          )
        );

        return updatedItems;
      } catch (error) {
        handleResolverError(error, 'updateMenuItemPrices');
      }
    },

    /**
     * Create offer
     */
    async createOffer(_, { restaurantId, input }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const {
          title,
          description,
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount,
          startTime,
          endTime,
          applicableItemIds,
        } = input;

        if (!title || !discountType || !discountValue) {
          throw new ValidationError('Title, discount type and discount value are required');
        }

        const offer = await prisma.offer.create({
          data: {
            Title: title,
            Description: description,
            DiscountType: discountType,
            DiscountValue: new Decimal(discountValue),
            MinOrderValue: new Decimal(minOrderValue || 0),
            MaxDiscount: maxDiscount ? new Decimal(maxDiscount) : null,
            StartTime: startTime ? new Date(startTime) : new Date(),
            EndTime: endTime ? new Date(endTime) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            IsActive: true,
            RestaurantID: restaurantId,
          },
          include: { applicableItems: true },
        });

        // Add menu items to offer
        if (applicableItemIds && applicableItemIds.length > 0) {
          await Promise.all(
            applicableItemIds.map((itemId) =>
              prisma.offerMenuItem.create({
                data: {
                  OfferID: offer.OfferID,
                  MenuItemID: itemId,
                },
              })
            )
          );
        }

        return offer;
      } catch (error) {
        handleResolverError(error, 'createOffer');
      }
    },

    /**
     * Update offer
     */
    async updateOffer(_, { offerId, input }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        const { title, description, discountValue, minOrderValue, maxDiscount, startTime, endTime } = input;

        const updateData = {};
        if (title) updateData.Title = title;
        if (description) updateData.Description = description;
        if (discountValue) updateData.DiscountValue = new Decimal(discountValue);
        if (minOrderValue) updateData.MinOrderValue = new Decimal(minOrderValue);
        if (maxDiscount) updateData.MaxDiscount = new Decimal(maxDiscount);
        if (startTime) updateData.StartTime = new Date(startTime);
        if (endTime) updateData.EndTime = new Date(endTime);

        const updated = await prisma.offer.update({
          where: { OfferID: offerId },
          data: updateData,
          include: { applicableItems: true },
        });

        return updated;
      } catch (error) {
        handleResolverError(error, 'updateOffer');
      }
    },

    /**
     * Deactivate offer
     */
    async deactivateOffer(_, { offerId }, { userId, userRole }) {
      try {
        // TODO: Add authorization check

        await prisma.offer.update({
          where: { OfferID: offerId },
          data: { IsActive: false },
        });

        return { success: true, message: 'Offer deactivated successfully' };
      } catch (error) {
        handleResolverError(error, 'deactivateOffer');
      }
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatRestaurantResponse = (restaurant) => {
  return {
    id: restaurant.RestaurantID,
    name: restaurant.Name,
    categoryName: restaurant.CategoryName,
    latitude: restaurant.Latitude,
    longitude: restaurant.Longitude,
    rating: restaurant.Rating,
    isActive: restaurant.IsActive,
    isOpen: restaurant.IsOpen,
    ownerId: restaurant.OwnerID,
    owner: restaurant.owner,
    menuItems: restaurant.menuItems,
  };
};

module.exports = restaurantResolvers;
