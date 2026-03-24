const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // 1. Get the Authorization header
    const authHeader = req.header("Authorization");
    
    // 2. Check if the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // 3. Extract the token itself
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    // 4. Verify the token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the decoded payload to the request object
    // Based on your jwt.js, this will contain { userId, email, role }
    req.user = decoded; 

    // 6. Move to the next function (the controller)
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    
    return res.status(403).json({ message: "Invalid or corrupted token." });
  }
};

// Add this below authMiddleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by authMiddleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Forbidden: You do not have permission to perform this action." 
      });
    }
    next();
  };
};

module.exports = { authMiddleware, authorizeRoles };