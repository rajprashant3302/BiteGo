const jwt = require('jsonwebtoken');
const { prisma } = require('../config/connectDB');

const getUserDetailsFromToken = async (token) => {
    try {
        if (!token) {
            return {
                message: "session timeout",
                logout: true,
            };
        }

        // 1. Verify the JWT token
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Extract identifying info safely from whatever the Auth Service gave us
        const extractedId = decode.id || decode.UserID || decode.userId || decode.sub || decode._id;
        const extractedEmail = decode.email || decode.Email;

        let user = null;

        // 3. Smart Search: Try ID first, then fall back to Email
        if (extractedId) {
            user = await prisma.user.findUnique({
                where: { UserID: extractedId.toString() }, 
                select: {
                    UserID: true,
                    Name: true,
                    Email: true,
                    ProfilePicURL: true,
                    Role: true
                }
            });
        } else if (extractedEmail) {
            console.log("⚠️ Token missing ID, falling back to Email search for:", extractedEmail);
            user = await prisma.user.findUnique({
                where: { Email: extractedEmail }, 
                select: {
                    UserID: true,
                    Name: true,
                    Email: true,
                    ProfilePicURL: true,
                    Role: true
                }
            });
        } else {
            // 4. Absolute fail-safe: The token has neither an ID nor an Email
            console.error("🛑 JWT Error: Token payload is completely empty! ->", decode);
            return {
                message: "Invalid token payload format",
                logout: true,
            };
        }

        if (!user) {
            return {
                message: "User not found in database",
                logout: true,
            };
        }

        return user;
    } catch (error) {
        console.error("Auth Helper Error:", error.message || error);
        return {
            message: error.message || "Authentication failed",
            logout: true,
        };
    }
};

module.exports = getUserDetailsFromToken;