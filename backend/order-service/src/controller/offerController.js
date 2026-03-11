// controllers/offer.controller.js
const { prisma } = require("database"); 
const { redisClient } = require("redis-client"); // ✅ Added redisClient

// Create a new Offer
exports.createOffer = async (req, res) => {
  try {
    const { 
      title, description, discountType, discountValue, 
      maxDiscount, minOrderValue, endTime, restaurantId, 
      selectedItemIds // Array of MenuItem IDs
    } = req.body;

    const newOffer = await prisma.offer.create({
      data: {
        Title: title,
        Description: description,
        DiscountType: discountType,
        DiscountValue: parseFloat(discountValue),
        MaxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        MinOrderValue: parseFloat(minOrderValue || 0),
        StartTime: new Date(),
        EndTime: new Date(endTime),
        RestaurantID: restaurantId,
        applicableItems: {
          create: selectedItemIds?.map(itemId => ({
            menuItem: { connect: { ItemID: itemId } }
          })) || []
        }
      },
      include: { applicableItems: true }
    });

    // ✅ Clear Cache so customers see the new discount immediately
    if (redisClient) {
      await redisClient.del(`restaurant:${restaurantId}:menu`);
      await redisClient.del("all_restaurants_with_menu");
    }

    res.status(201).json(newOffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create offer", error: error.message });
  }
};

// Get all offers for a specific Restaurant
exports.getRestaurantOffers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const offers = await prisma.offer.findMany({
      where: { 
        RestaurantID: restaurantId,
        IsActive: true 
      },
      include: {
        applicableItems: {
          include: { menuItem: true }
        }
      },
      orderBy: { EndTime: 'asc' }
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching offers" });
  }
};

// Update Offer (and refresh item links)
exports.updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { 
      title, description, discountType, discountValue, 
      maxDiscount, minOrderValue, selectedItemIds, isActive, endTime 
    } = req.body;

    await prisma.offerMenuItem.deleteMany({ where: { OfferID: offerId } });

    const updated = await prisma.offer.update({
      where: { OfferID: offerId },
      data: {
        Title: title,
        Description: description,
        DiscountType: discountType,
        DiscountValue: parseFloat(discountValue),
        MaxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        MinOrderValue: parseFloat(minOrderValue || 0),
        IsActive: isActive,
        EndTime: new Date(endTime),
        applicableItems: {
          create: selectedItemIds?.map(itemId => ({
            menuItem: { connect: { ItemID: itemId } }
          })) || []
        }
      }
    });

    if (redisClient) {
      await redisClient.del(`restaurant:${updated.RestaurantID}:menu`);
      await redisClient.del("all_restaurants_with_menu");
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

// Delete Offer
exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    // Fetch the offer first to get the RestaurantID for cache busting
    const offer = await prisma.offer.findUnique({ where: { OfferID: offerId } });
    
    if (offer) {
      await prisma.offerMenuItem.deleteMany({ where: { OfferID: offerId } });
      await prisma.offer.delete({ where: { OfferID: offerId } });
      
      // ✅ Clear Cache
      if (redisClient) {
        await redisClient.del(`restaurant:${offer.RestaurantID}:menu`);
      }
    }
    
    res.json({ message: "Offer removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};