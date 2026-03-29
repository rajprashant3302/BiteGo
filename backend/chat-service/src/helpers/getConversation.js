const { ConversationModel } = require('../models/conversationModel');
const { prisma } = require('../config/connectDB');

const getConversation = async (currentUserId) => {
    if (!currentUserId) return [];

    try {
        // 1. Get all conversations where the user is either sender or receiver
        const conversations = await ConversationModel.find({
            "$or": [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
        .sort({ updatedAt: -1 })
        .populate('messages');

        // 2. Map through conversations to attach Prisma User details
        const conversationData = await Promise.all(conversations.map(async (conv) => {
            
            // Determine who the other person in the chat is
            const otherUserId = conv.sender === currentUserId ? conv.receiver : conv.sender;

            // Fetch that person's details from Prisma (NeonDB)
            const otherUserDetails = await prisma.user.findUnique({
                where: { UserID: otherUserId }, // Match your Prisma field name
                select: {
                    Name: true,
                    ProfilePicURL: true,
                    Email: true
                }
            });

            // Calculate unread messages for the current user
            const unreadCount = conv.messages.reduce((prev, curr) => {
                const msgByUserId = curr?.msgByUserId?.toString();
                if (msgByUserId !== currentUserId) {
                    return prev + (curr.seen ? 0 : 1);
                }
                return prev;
            }, 0);

            return {
                _id: conv?._id,
                sender: conv?.sender,
                receiver: conv?.receiver,
                unreadCount: unreadCount,
                lastMsg: conv.messages[conv.messages.length - 1],
                userDetails: {
                    id: otherUserId,
                    name: otherUserDetails?.Name || "BiteGo User",
                    profile_pic: otherUserDetails?.ProfilePicURL || "",
                    email: otherUserDetails?.Email || ""
                }
            };
        }));

        return conversationData;
    } catch (error) {
        console.error("Error in getConversation helper:", error);
        return [];
    }
};

module.exports = getConversation;