// module.exports = getConversation;
const { ConversationModel } = require('../models/conversationModel');
const { prisma } = require('../config/connectDB');

const SUPPORT_INBOX_ID = "SUPPORT_INBOX";
const supportRoles = ["Admin", "SuperAdmin", "Ops", "Support"];

const getOtherUserId = (conv, currentUserId) => {
    return conv.sender === currentUserId ? conv.receiver : conv.sender;
};

const getConversation = async (currentUserId) => {
    if (!currentUserId) return [];

    try {
        const currentUser = currentUserId === SUPPORT_INBOX_ID
            ? { Role: "Support" }
            : await prisma.user.findUnique({
                where: { UserID: currentUserId },
                select: { Role: true }
            });

        const isSupportViewer =
            currentUserId === SUPPORT_INBOX_ID ||
            supportRoles.includes(currentUser?.Role);

        let conversations = [];

        if (isSupportViewer) {
            conversations = await ConversationModel.find({
                $or: [
                    { receiver: SUPPORT_INBOX_ID },
                    { sender: SUPPORT_INBOX_ID }
                ]
            })
            .sort({ updatedAt: -1 })
            .populate('messages');
        } else {
            conversations = await ConversationModel.find({
                $or: [
                    { sender: currentUserId },
                    { receiver: currentUserId }
                ]
            })
            .sort({ updatedAt: -1 })
            .populate('messages');
        }

        if (isSupportViewer) {
            const grouped = new Map();

            for (const conv of conversations) {
                const userId = conv.supportSession?.createdForUserId || getOtherUserId(conv, SUPPORT_INBOX_ID);
                if (!userId) continue;

                if (!grouped.has(userId)) {
                    grouped.set(userId, []);
                }
                grouped.get(userId).push(conv);
            }

            const data = await Promise.all(
                Array.from(grouped.entries()).map(async ([userId, userConversations]) => {
                    const allMessages = userConversations
                        .flatMap(conv => conv.messages || [])
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    const actualUserId = userId?.toString();

                    const unreadCount = allMessages.reduce((count, msg) => {
                        const senderId = msg?.msgByUserId?.toString();
                        if (senderId === actualUserId && msg?.status !== 'seen') {
                            return count + 1;
                        }
                        return count;
                    }, 0);

                    const lastMsg = allMessages.length ? allMessages[allMessages.length - 1] : null;
                    const activeSession = userConversations.find(conv => {
                        return conv.supportSession?.isActive &&
                            conv.supportSession?.expiresAt &&
                            new Date(conv.supportSession.expiresAt) > new Date();
                    });

                    const otherUserDetails = await prisma.user.findUnique({
                        where: { UserID: userId },
                        select: {
                            UserID: true,
                            Name: true,
                            ProfilePicURL: true,
                            Email: true
                        }
                    });

                    return {
                        _id: activeSession?._id || userConversations[0]?._id,
                        sender: activeSession?.sender || userConversations[0]?.sender,
                        receiver: activeSession?.receiver || userConversations[0]?.receiver,
                        unreadCount,
                        lastMsg,
                        activeSession: {
                            tokenId: activeSession?.supportSession?.tokenId || null,
                            isActive: !!activeSession,
                            expiresAt: activeSession?.supportSession?.expiresAt || null
                        },
                        userDetails: {
                            id: userId,
                            name: otherUserDetails?.Name || "BiteGo User",
                            profile_pic: otherUserDetails?.ProfilePicURL || "",
                            email: otherUserDetails?.Email || ""
                        }
                    };
                })
            );

            return data.sort((a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0));
        }

        const grouped = new Map();

        for (const conv of conversations) {
            const otherUserId = getOtherUserId(conv, currentUserId);

            if (!grouped.has(otherUserId)) {
                grouped.set(otherUserId, []);
            }
            grouped.get(otherUserId).push(conv);
        }

        const conversationData = await Promise.all(
            Array.from(grouped.entries()).map(async ([otherUserId, convs]) => {
                const activeSession = convs.find(conv => {
                    return conv.supportSession?.isActive &&
                        conv.supportSession?.expiresAt &&
                        new Date(conv.supportSession.expiresAt) > new Date();
                });

                const messagesToShow = activeSession?.messages || [];
                const allMessages = messagesToShow
                    .slice()
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                const unreadCount = allMessages.reduce((prev, curr) => {
                    const msgByUserId = curr?.msgByUserId?.toString();
                    if (msgByUserId !== currentUserId && curr?.status !== 'seen') {
                        return prev + 1;
                    }
                    return prev;
                }, 0);

                const lastMsg = allMessages.length ? allMessages[allMessages.length - 1] : null;

                let displayName = "Support Team";
                let profilePic = "";
                let email = "";

                if (otherUserId !== SUPPORT_INBOX_ID) {
                    const otherUserDetails = await prisma.user.findUnique({
                        where: { UserID: otherUserId },
                        select: {
                            UserID: true,
                            Name: true,
                            ProfilePicURL: true,
                            Email: true
                        }
                    });

                    displayName = otherUserDetails?.Name || "BiteGo User";
                    profilePic = otherUserDetails?.ProfilePicURL || "";
                    email = otherUserDetails?.Email || "";
                }

                return {
                    _id: activeSession?._id || convs[0]?._id,
                    sender: activeSession?.sender || convs[0]?.sender,
                    receiver: activeSession?.receiver || convs[0]?.receiver,
                    unreadCount,
                    lastMsg,
                    activeSession: {
                        tokenId: activeSession?.supportSession?.tokenId || null,
                        isActive: !!activeSession,
                        expiresAt: activeSession?.supportSession?.expiresAt || null
                    },
                    userDetails: {
                        id: otherUserId,
                        name: displayName,
                        profile_pic: profilePic,
                        email
                    }
                };
            })
        );

        return conversationData.sort((a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0));
    } catch (error) {
        console.error("Error in getConversation helper:", error);
        return [];
    }
};

module.exports = getConversation;