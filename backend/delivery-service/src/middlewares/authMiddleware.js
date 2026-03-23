// backend/delivery-service/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');

    // Add this log to your terminal to see the truth:
    console.log("RAW DECODED TOKEN:", decoded);

    // Normalize the user object so the controller always sees req.user.id
    req.user = {
      ...decoded,
      id: decoded.id || decoded.userId || decoded.sub 
    };

    if (!req.user.id) {
      console.error("Token verified but no ID found in payload keys (id, userId, sub)");
    }

    next();
  } catch (error) {
    console.error('JWT Error:', error.message);
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = { verifyToken };