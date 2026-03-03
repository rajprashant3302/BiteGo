const express = require("express");
const router = express.Router();
const { redisClient } = require("redis-client");

// POST: Sync cart to Redis
router.post('/sync', async (req, res) => {
  const { userId, items } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });
  
  const cartKey = `cart:${userId}`;
  try {
    await redisClient.setEx(cartKey, 604800, JSON.stringify(items));
    res.status(200).json({ message: "Cart synced" });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync cart" });
  }
});

// GET: Fetch cart from Redis
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const cartKey = `cart:${userId}`;
  
  try {
    const data = await redisClient.get(cartKey);
    res.status(200).json(data ? JSON.parse(data) : []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await redisClient.del(`cart:${userId}`);
    res.status(200).json({ message: "Cart deleted from Redis" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete cart" });
  }
});

module.exports = router;