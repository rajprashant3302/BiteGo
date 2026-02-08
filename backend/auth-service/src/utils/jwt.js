// backend/auth-service/src/utils/jwt.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
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


// For Registration Verification (Short lived, contains registration data)
const generateVerificationToken = (userData) => {
  return jwt.sign(
    { data: userData }, 
    JWT_SECRET,
    { expiresIn: "15m" } 
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, generateVerificationToken, verifyToken };