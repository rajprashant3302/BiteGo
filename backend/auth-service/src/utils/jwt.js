// backend/auth-service/src/utils/jwt.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.UserID, 
      email: user.Email, 
      role: user.Role 
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};