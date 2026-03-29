const mongoose = require('mongoose');
const { prisma } = require('database'); // Ensure this matches your package export

const connectMongoDB = async () => {
  try {
    // 1. Get the URI from the correct variable name
    const uri = process.env.MONGODB_URI; 
    
    console.log("Connecting to MongoDB with URI:", uri);

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // 2. Use MONGODB_URI here (not MONGO_URI)
    await mongoose.connect(uri);

    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log("✅ MongoDB Connected successfully");
    });

    connection.on('error', (error) => {
      console.log("❌ MongoDB Connection Error: ", error);
    });

    console.log("🍃 Mongoose setup complete");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = { prisma, connectMongoDB };