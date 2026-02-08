// backend/auth-service/src/controller/authController.js
const bcrypt = require("bcrypt");
const { prisma } = require("database");
const { generateToken, generateVerificationToken, verifyToken } = require("../utils/jwt");
const { publishEvent } = require("../kafka/producer");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost";
const LOGIN_URL = `${FRONTEND_URL.replace(/\/$/, "")}/login`;



exports.initiateRegistration = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ Email: email }, { Phone: phone }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "User with this Email or Phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tempUserData = {
      name,
      email,
      phone,
      passwordHash: hashedPassword,
      role: role || "User"
    };

    const verificationToken = generateVerificationToken(tempUserData);

    await publishEvent("USER_REGISTRATION_INITIATED", {
      email,
      name,
      verificationLink: `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`
    });

    console.log(`Registration initiated for ${email}. Waiting for verification.`);

    res.status(200).json({
      message: "Verification email sent. Please check your inbox to complete registration."
    });

  } catch (err) {
    console.error(" INIT REG ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//verify email

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query; 

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return res.status(400).json({ message: "Invalid or Expired Token" });
    }

    const userData = decoded.data;

    const existingUser = await prisma.user.findUnique({ where: { Email: userData.email } });
    if (existingUser) {
      return res.status(200).json({ message: "User already verified. Please login." });
    }

    const newUser = await prisma.user.create({
      data: {
        Name: userData.name,
        Email: userData.email,
        Phone: userData.phone,
        PasswordHash: userData.passwordHash,
        Role: userData.role,
        WalletBalance: 0,
        IsActive: true // Verified!
      }
    });

    await publishEvent("USER_REGISTERED_SUCCESS", {
      userId: newUser.UserID,
      email: newUser.Email,
      role: newUser.Role,
      name: newUser.Name
    });

    let nextStep = "/dashboard";
    if (newUser.Role === "RestaurantOwner") {
      nextStep = "/vendor/onboarding";
    } else if (newUser.Role === "DeliveryPartner") {
      nextStep = "/driver/onboarding"; 
    }

    console.log(` User ${newUser.Email} verified and created in DB.`);

    res.status(200).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Email Verified</title>
    <style>
      body {
        font-family: Arial;
        background: #f4f4f4;
      }
      .box {
        width: 400px;
        margin: 120px auto;
        padding: 25px;
        background: #fff;
        border-radius: 6px;
        text-align: center;
      }
      .success {
        color: #28a745;
        font-size: 20px;
        margin-bottom: 10px;
      }
      .btn {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 18px;
        background: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="success">✅ Email Verified Successfully!</div>
      <p>Your account has been created. You can now log in.</p>

      <a href="${LOGIN_URL}/login" class="btn">
        Return to Login
      </a>
    </div>
  </body>
  </html>
`);


  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({ error: "Verification failed" });
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

