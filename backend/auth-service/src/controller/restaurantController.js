const { prisma } = require("database");

exports.addRestaurant = async (req, res) => {
  try {
    const { userId, name, categoryName, latitude, longitude } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ message: "User ID and Restaurant Name are required." });
    }

    const ownerRecord = await prisma.restaurantOwner.findUnique({
      where: { UserID: userId }
    });

    if (!ownerRecord) {
      return res.status(403).json({ message: "Please complete your Business Details before adding a restaurant." });
    }
    const newRestaurant = await prisma.restaurant.create({
      data: {
        Name: name,
        CategoryName: categoryName || null,
        Latitude: latitude,
        Longitude: longitude,
        OwnerID: ownerRecord.OwnerID, 
        IsActive: true,
        IsOpen: true,
      }
    });

    console.log(`✅ Restaurant '${name}' created by User ${userId}`);

    res.status(201).json({
      message: "Restaurant added successfully",
      restaurant: newRestaurant
    });

  } catch (error) {
    console.error("❌ ADD RESTAURANT ERROR:", error);
    res.status(500).json({ message: "Failed to add restaurant." });
  }
};

// Fetch all restaurants for a specific user (owner)
exports.getOwnerRestaurants = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const owner = await prisma.restaurantOwner.findUnique({
      where: { UserID: userId }
    });

    if (!owner) {
      return res.status(200).json([]);
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { OwnerID: owner.OwnerID },
      orderBy: { Name: 'asc' } 
    });

    res.status(200).json(restaurants);

  } catch (error) {
    console.error("❌ GET RESTAURANTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch restaurants." });
  }
};