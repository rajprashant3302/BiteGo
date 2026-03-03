// backend/order-service/src/controllers/menuController.js
const { prisma } = require("database"); // Adjust path based on your setup
const { redisClient } = require("redis-client");

exports.getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const cacheKey = `restaurant:${restaurantId}:menu`;

    const cachedMenu = await redisClient.get(cacheKey);
    if (cachedMenu) return res.status(200).json(JSON.parse(cachedMenu));

    const menu = await prisma.menuItem.findMany({
      where: { RestaurantID: restaurantId },
      include: {
        restaurant: true,
      },
      orderBy: { ItemName: 'asc' }
    });

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(menu));
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu." });
  }
};


exports.addMenuItem = async (req, res) => {
  try {
    const { restaurantId, name, description, price, imageUrl, isVeg , availableQuantity } = req.body;

    // Validation Check
    if (!restaurantId || !name || !price) {
      return res.status(400).json({ message: "Missing required fields: restaurantId, name, or price" });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        RestaurantID: restaurantId,
        ItemName: name,
        Description: description || "",
        // Ensure price is a valid number for Prisma Decimal
        Price: parseFloat(price) || 0.0, 
        ItemImageURL: imageUrl || null,
        IsVeg: isVeg === true, // Explicit boolean check
        IsAvailable: true,
        AvailableQuantity: parseInt(availableQuantity) || 0
      }
    });

    if (redisClient) {
        await redisClient.del(`restaurant:${restaurantId}:menu`);
        await redisClient.del("all_restaurants_with_menu");
    }
    
    res.status(201).json({ item: newItem });
  } catch (error) {
    // THIS IS THE IMPORTANT PART: Log the actual error to Docker
    console.error("❌ PRISMA CREATE ERROR:", error);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: error.message,
        code: error.code // Prisma error codes (like P2003)
    });
  }
};

// backend/order-service/src/controllers/menuController.js

// ... other exports

exports.updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, imageUrl, isVeg, isAvailable ,availableQuantity } = req.body;

    const updatedItem = await prisma.menuItem.update({
      where: { ItemID: itemId },
      data: {
        ItemName: name,
        Description: description,
        Price: price ? parseFloat(price) : undefined,
        ItemImageURL: imageUrl,
        IsVeg: isVeg,
        IsAvailable: isAvailable ,
        AvailableQuantity: availableQuantity !== undefined ? parseInt(availableQuantity) : undefined
      }
    });
    await redisClient.del(`restaurant:${updatedItem.RestaurantID}:menu`);
     await redisClient.del("all_restaurants_with_menu");
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Update failed.", error: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await prisma.menuItem.findUnique({ where: { ItemID: itemId } });
    if (!item) return res.status(404).json({ message: "Not found" });

    await prisma.menuItem.delete({ where: { ItemID: itemId } });
    await redisClient.del(`restaurant:${item.RestaurantID}:menu`);
    await redisClient.del("all_restaurants_with_menu");
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed." });
  }
};