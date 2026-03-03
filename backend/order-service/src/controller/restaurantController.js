// // backend/order-service/src/controllers/restaurantController.js
// const { prisma } = require("database");
// const { redisClient } = require("redis-client");

// exports.getAllRestaurants = async (req, res) => {
//   const cacheKey = "all_restaurants_with_menu";

//   try {
//     // 1. Try to fetch from Redis
//     const cachedData = await redisClient.get(cacheKey);
//     if (cachedData) {
//       console.log("⚡ Serving Restaurants from Redis Cache");
//       return res.status(200).json(JSON.parse(cachedData));
//     }

//     // 2. Cache Miss: Fetch from PostgreSQL via Prisma
//     console.log("🐢 Redis Cache Miss: Fetching from DB...");
//     const restaurants = await prisma.restaurant.findMany({
        
//       include: {
//         menuItems: {
//           take: 5, 
//           where: { IsAvailable: true },
//           select: {
//             ItemID: true,
//             ItemName: true,
//             ItemImageURL: true,
//             Price: true
//           }
//         }
//       }
//     });

//     // 3. Store in Redis (Expire in 1 Hour - 3600 seconds)
//     await redisClient.setEx(cacheKey, 3600, JSON.stringify(restaurants));

//     res.status(200).json(restaurants);
//   } catch (error) {
//     console.error("❌ FETCH RESTAURANTS ERROR:", error);
//     res.status(500).json({ message: "Failed to load restaurants" });
//   }
// };

// backend/order-service/src/controllers/restaurantController.js
const { prisma } = require("database");
const { redisClient } = require("redis-client");

exports.getAllRestaurants = async (req, res) => {
  const cacheKey = "all_restaurants_with_menu";

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("⚡ Serving Restaurants from Redis Cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log("🐢 Redis Cache Miss: Fetching from DB...");
    const restaurants = await prisma.restaurant.findMany({
      where: { IsActive: true }, // Only show active restaurants
      select: {
        RestaurantID: true,
        Name: true,
        CategoryName: true, // ✅ Matches your schema
        Rating: true,       // ✅ Matches your schema
        IsOpen: true,       // Useful for the frontend badge
        menuItems: {
          take: 5, 
          where: { IsAvailable: true },
          select: {
            ItemID: true,
            ItemName: true,
            ItemImageURL: true,
            Price: true
          }
        }
      }
    });

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(restaurants));
    res.status(200).json(restaurants);
  } catch (error) {
    console.error("❌ FETCH RESTAURANTS ERROR:", error);
    res.status(500).json({ message: "Failed to load restaurants" });
  }
};