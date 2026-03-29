// backend/auth-service/src/controller/invitationController.js
const { prisma } = require("database");
const bcrypt = require("bcryptjs");
const { publishEvent } = require("../kafka/producer");
const { generateInviteToken, verifyToken } = require("../utils/jwt");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * POST /invite/send
 * Creates a JWT with the invite data and sends it to the mailer
 */
exports.sendInvite = async (req, res) => {
  try {
    const { email, role } = req.body;
    const adminId = req.user.userId;

    const validRoles = ["RestaurantOwner", "DeliveryPartner", "User", "SuperAdmin", "Ops", "Support"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Check if user already exists in the system
    const existingUser = await prisma.user.findUnique({ where: { Email: email } });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // 1. Generate the stateless invite token
    const inviteToken = generateInviteToken({
      email,
      role,
      createdBy: adminId,
      purpose: "ADMIN_INVITE"
    });

    // 2. Publish to Kafka
    const verificationLink = `${FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    
    await publishEvent("ADMIN_INVITE_INITIATED", {
      email,
      role,
      verificationLink
    });

    return res.status(200).json({ message: "Invitation sent successfully." });
  } catch (error) {
    console.error("sendInvite error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /invite/verify?token=xxx
 * Validates token before showing the set-password page on the frontend
 */
exports.verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // This will automatically throw an error if the token is expired or tampered with
    const decoded = verifyToken(token);

    if (decoded.data.purpose !== "ADMIN_INVITE") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    return res.status(200).json({
      email: decoded.data.email,
      role: decoded.data.role,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(410).json({ message: "Invitation link has expired" });
    }
    return res.status(400).json({ message: "Invalid or corrupted invitation link" });
  }
};

/**
 * POST /invite/accept
 * Body: { token, name, phone, password, confirmPassword }
 */
exports.acceptInvite = async (req, res) => {
  try {
    const { token, name, phone, password, confirmPassword } = req.body;

    if (!token || !name || !password || !confirmPassword) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // 1. Decode and verify the token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired invitation link" });
    }

    if (decoded.data.purpose !== "ADMIN_INVITE") {
      return res.status(400).json({ message: "Invalid token type" });
    }

    const { email, role } = decoded.data;

    // 2. Check if account was already created using this email
    const existingUser = await prisma.user.findUnique({ where: { Email: email } });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the user
    const newUser = await prisma.user.create({
      data: {
        Name: name,
        Email: email,
        Phone: phone || null,
        Role: role,
        PasswordHash: hashedPassword,
        IsActive: true, 
        WalletBalance: 0
      },
    });

    // 4. (Optional) Fire success event
    await publishEvent("USER_REGISTERED_SUCCESS", {
      userId: newUser.UserID,
      email: newUser.Email,
      name: newUser.Name
    });

    return res.status(201).json({
      message: "Account created successfully",
      userId: newUser.UserID,
    });
  } catch (error) {
    // Handle Prisma unique constraint violation for Phone number
    if (error.code === 'P2002' && error.meta?.target?.includes('Phone')) {
      return res.status(409).json({ message: "This phone number is already registered." });
    }
    console.error("acceptInvite error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /invite/list (admin only)
 * NOTE: Since invitations are stateless JWTs, we cannot list them from the DB.
 */
exports.listInvitations = async (req, res) => {
  return res.status(501).json({ 
    message: "Pending invitations cannot be listed because the system uses stateless JWT invitations." 
  });
};