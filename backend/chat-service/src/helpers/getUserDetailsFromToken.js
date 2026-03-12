const jwt = require('jsonwebtoken');
const { prisma } = require('database');

const getUserDetailsFromToken = async (token) => {
    try {
        if (!token) {
            return {
                message: "session timeout",
                logout: true,
            };
        }

        // 1. Verify the JWT token
        const decode = await jwt.verify(token, process.env.JWT_SECRET);

        // 2. Fetch User from Prisma (NeonDB)
        // Adjust 'UserID' or 'id' based on your specific Prisma Schema
        const user = await prisma.user.findUnique({
            where: { UserID: decode.id }, 
            select: {
                UserID: true,
                Name: true,
                Email: true,
                ProfilePicURL: true,
                Role: true
            }
        });

        return user;
    } catch (error) {
        console.error("Auth Helper Error:", error);
        return {
            message: error.message || error,
            logout: true,
        };
    }
};

module.exports = getUserDetailsFromToken;