// backend/auth-service/src/controller/authController.js
const bcrypt = require("bcrypt");
// 👇 IMPORT THE INSTANCE WE CREATED IN STEP 1
const { prisma } = require("database"); 
const { generateToken } = require("../utils/jwt");


exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("📝 Registering:", email);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { Email: email },
          { Phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        Name: name,
        Email: email,
        Phone: phone,
        PasswordHash: hashedPassword,
        Role: role || "User",
        WalletBalance: 0
      }
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user),
      user: { id: user.UserID, email: user.Email, role: user.Role }
    });

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { Email: email }
    });

    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: { id: user.UserID, email: user.Email, role: user.Role }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};