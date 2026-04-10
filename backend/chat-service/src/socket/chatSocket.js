const crypto = require('crypto');
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const { ConversationModel, MessageModel } = require('../models/conversationModel');
const getConversation = require('../helpers/getConversation');
const { prisma } = require('../config/connectDB');

const SUPPORT_INBOX_ID = "SUPPORT_INBOX";
const TOKEN_EXPIRY_MINUTES = Number(process.env.SUPPORT_TOKEN_EXPIRY_MINUTES || 30);
const supportRoles = ["Admin", "SuperAdmin", "Ops", "Support"];

const analyzeMessageWithAI = async (text) => {
    if (!text) return null;
    return {
        sentiment: text.length > 20 ? 'positive' : 'neutral',
        suggestedReplies: ["Sounds good!", "Tell me more", "I'm on it!"],
        intent: "general_inquiry"
    };
};

const isSupportUser = (user) => supportRoles.includes(user?.Role);

const generateSupportTokenId = () => {
    return `SUP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
};

const getThreadRoom = (userId) => `THREAD_${userId}`;

const getActualUserIdFromPair = (sender, receiver) => {
    return sender === SUPPORT_INBOX_ID ? receiver : sender;
};

const expireOldSupportSessions = async (userId) => {
    const now = new Date();

    await ConversationModel.updateMany(
        {
            $or: [
                { sender: userId, receiver: SUPPORT_INBOX_ID },
                { sender: SUPPORT_INBOX_ID, receiver: userId }
            ],
            'supportSession.isActive': true,
            'supportSession.expiresAt': { $lte: now }
        },
        {
            $set: {
                'supportSession.isActive': false,
                'supportSession.closedAt': now
            }
        }
    );
};

const getActiveSupportConversation = async (userId) => {
    await expireOldSupportSessions(userId);

    return ConversationModel.findOne({
        $or: [
            { sender: userId, receiver: SUPPORT_INBOX_ID },
            { sender: SUPPORT_INBOX_ID, receiver: userId }
        ],
        'supportSession.isActive': true,
        'supportSession.expiresAt': { $gt: new Date() }
    }).sort({ updatedAt: -1 });
};

const createSupportConversation = async (userId, adminId = null) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    return new ConversationModel({
        sender: userId,
        receiver: SUPPORT_INBOX_ID,
        messages: [],
        supportSession: {
            tokenId: generateSupportTokenId(),
            createdForUserId: userId,
            assignedAdminId: adminId,
            isActive: true,
            createdAt: now,
            expiresAt,
            closedAt: null
        }
    }).save();
};

const getOrCreateActiveSupportConversation = async (userId, adminId = null) => {
    let conversation = await getActiveSupportConversation(userId);

    if (!conversation) {
        conversation = await createSupportConversation(userId, adminId);
    } else if (!conversation.supportSession?.assignedAdminId && adminId) {
        conversation.supportSession.assignedAdminId = adminId;
        await conversation.save();
    }

    return conversation;
};

const getUserDetails = async (userId) => {
    if (!userId || userId === SUPPORT_INBOX_ID) {
        return {
            _id: SUPPORT_INBOX_ID,
            name: "Support Team",
            email: "",
            profile_pic: "",
            online: false
        };
    }

    const userDetails = await prisma.user.findUnique({
        where: { UserID: userId },
        select: {
            UserID: true,
            Name: true,
            Email: true,
            ProfilePicURL: true,
        }
    });

    if (!userDetails) return null;

    return {
        _id: userDetails.UserID,
        name: userDetails.Name,
        email: userDetails.Email,
        profile_pic: userDetails.ProfilePicURL,
        online: false
    };
};

const getAllSupportConversationsForUser = async (userId) => {
    return ConversationModel.find({
        $or: [
            { sender: userId, receiver: SUPPORT_INBOX_ID },
            { sender: SUPPORT_INBOX_ID, receiver: userId }
        ]
    })
    .populate('messages')
    .sort({ createdAt: 1 });
};

const getUserVisibleMessages = async (userId) => {
    const activeConversation = await getActiveSupportConversation(userId);

    if (!activeConversation) return [];

    const populated = await ConversationModel.findById(activeConversation._id).populate('messages');
    return (populated?.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const getAdminVisibleMessages = async (userId) => {
    const conversations = await getAllSupportConversationsForUser(userId);

    return conversations
        .flatMap((conv) => {
            return (conv.messages || []).map((msg) => ({
                ...msg.toObject(),
                sessionTokenId: conv.supportSession?.tokenId || null,
                sessionExpired: !(conv.supportSession?.isActive) ||
                    (conv.supportSession?.expiresAt && new Date(conv.supportSession.expiresAt) <= new Date())
            }));
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const getSupportMetaForUser = async (userId) => {
    const activeConversation = await getActiveSupportConversation(userId);

    return {
        hasActiveSession: !!activeConversation,
        tokenId: activeConversation?.supportSession?.tokenId || null,
        expiresAt: activeConversation?.supportSession?.expiresAt || null,
        canSend: true,
        assignedAdminId: activeConversation?.supportSession?.assignedAdminId || null
    };
};

const markMessagesSeenForUserThread = async (userId, viewerId) => {
    const conversations = await ConversationModel.find({
        $or: [
            { sender: userId, receiver: SUPPORT_INBOX_ID },
            { sender: SUPPORT_INBOX_ID, receiver: userId }
        ]
    }).populate('messages');

    const idsToMark = [];

    for (const conv of conversations) {
        for (const msg of conv.messages || []) {
            if (msg.msgByUserId !== viewerId && msg.status !== 'seen') {
                idsToMark.push(msg._id);
            }
        }
    }

    if (!idsToMark.length) return;

    await MessageModel.updateMany(
        { _id: { $in: idsToMark } },
        {
            $set: {
                status: 'seen',
                seen: true,
                seenAt: new Date()
            }
        }
    );
};

const emitSidebarRefresh = async (io, userId) => {
    const userConversation = await getConversation(userId);
    io.to(userId.toString()).emit('conversation', userConversation);

    const supportConversation = await getConversation(SUPPORT_INBOX_ID);
    io.to(SUPPORT_INBOX_ID).emit('conversation', supportConversation);
};

const emitThreadRefresh = async (io, userId) => {
    const userMessages = await getUserVisibleMessages(userId);
    const adminMessages = await getAdminVisibleMessages(userId);
    const meta = await getSupportMetaForUser(userId);

    io.to(userId.toString()).emit('message', userMessages);
    io.to(getThreadRoom(userId)).emit('admin-message', adminMessages);

    io.to(userId.toString()).emit('support-chat-meta', meta);
    io.to(getThreadRoom(userId)).emit('support-chat-meta', meta);
};

const setupChatSocket = (io) => {
    const onlineUser = new Set();

    io.on('connection', async (socket) => {
        const token = socket.handshake.auth.token;
        const user = await getUserDetailsFromToken(token);

        if (!user || user.logout) {
            console.log("Disconnecting socket: Invalid or expired token");
            return socket.disconnect();
        }

        const currentUserId = user.UserID || user.id;
        if (!currentUserId) {
            return socket.disconnect();
        }

        socket.join(currentUserId.toString());
        onlineUser.add(currentUserId.toString());

        if (isSupportUser(user)) {
            socket.join(SUPPORT_INBOX_ID);
            console.log(`Admin ${user.Name} joined the SUPPORT_INBOX`);
        }

        io.emit('onlineUser', Array.from(onlineUser));

        socket.on('sidebar', async (userId) => {
            const conversations = await getConversation(userId);
            socket.emit('conversation', conversations);
        });

        socket.on('message-page', async (targetId) => {
            try {
                const actualUserId = targetId === SUPPORT_INBOX_ID ? currentUserId.toString() : targetId.toString();

                if (socket.currentThreadRoom) {
                    socket.leave(socket.currentThreadRoom);
                }

                const supportViewer = isSupportUser(user);

                if (supportViewer) {
                    socket.currentThreadRoom = getThreadRoom(actualUserId);
                    socket.join(socket.currentThreadRoom);
                } else {
                    socket.currentThreadRoom = currentUserId.toString();
                    socket.join(socket.currentThreadRoom);
                }

                const threadUserDetails = await getUserDetails(actualUserId);
                if (threadUserDetails) {
                    threadUserDetails.online = onlineUser.has(actualUserId);
                    socket.emit('message-user', threadUserDetails);
                }

                await markMessagesSeenForUserThread(actualUserId, currentUserId.toString());
                await emitThreadRefresh(io, actualUserId);
                await emitSidebarRefresh(io, actualUserId);
            } catch (error) {
                console.error("message-page error:", error);
            }
        });

        socket.on('new-message', async (data) => {
            try {
                const sender = data?.sender?.toString();
                const receiver = data?.receiver?.toString();
                const msgByUserId = data?.msgByUserId?.toString();

                if (!sender || !receiver || !msgByUserId) return;
                if (!data?.text?.trim() && !data?.image && !data?.video) return;

                const actualUserId = getActualUserIdFromPair(sender, receiver);
                const sentBySupport = sender === SUPPORT_INBOX_ID;

                const conversation = await getOrCreateActiveSupportConversation(
                    actualUserId,
                    sentBySupport ? msgByUserId : null
                );

                const receiverOnline = sentBySupport
                    ? onlineUser.has(actualUserId)
                    : Array.from(io.sockets.adapter.rooms.get(getThreadRoom(actualUserId)) || []).length > 0;

                const message = new MessageModel({
                    text: data?.text || "",
                    image: { imageUrl: data?.image || "" },
                    video: { videoUrl: data?.video || "" },
                    msgByUserId,
                    aiAnalysis: { sentiment: 'neutral', suggestedReplies: [] },
                    status: receiverOnline ? 'delivered' : 'sent',
                    deliveredAt: receiverOnline ? new Date() : null
                });

                const saveMessage = await message.save();

                await ConversationModel.updateOne(
                    { _id: conversation._id },
                    {
                        $push: { messages: saveMessage._id },
                        $set: {
                            updatedAt: new Date(),
                            ...(sentBySupport && { 'supportSession.assignedAdminId': msgByUserId })
                        }
                    }
                );

                analyzeMessageWithAI(data?.text).then(async (aiResult) => {
                    if (aiResult) {
                        await MessageModel.findByIdAndUpdate(saveMessage._id, { $set: { aiAnalysis: aiResult } });
                        await emitThreadRefresh(io, actualUserId);
                    }
                });

                await emitThreadRefresh(io, actualUserId);
                await emitSidebarRefresh(io, actualUserId);
            } catch (error) {
                console.error("new-message error:", error);
            }
        });

        socket.on('disconnect', () => {
            onlineUser.delete(currentUserId.toString());
            io.emit('onlineUser', Array.from(onlineUser));
        });
    });
};

module.exports = setupChatSocket;