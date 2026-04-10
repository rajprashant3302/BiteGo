const crypto = require('crypto');
const { MessageModel, ConversationModel } = require('../models/conversationModel');
const { prisma } = require('../config/connectDB');

const SUPPORT_INBOX_ID = "SUPPORT_INBOX";
const TOKEN_EXPIRY_MINUTES = Number(process.env.SUPPORT_TOKEN_EXPIRY_MINUTES || 30);

const getAiAnalysis = async (text) => {
    return {
        sentiment: text && text.length > 10 ? 'positive' : 'neutral',
        suggestedReplies: ["Tell me more!", "That's cool", "Okay!"],
        intent: "general_chat"
    };
};

const generateSupportTokenId = () => {
    return `SUP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
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

const getOrCreateActiveConversation = async (senderId, receiverId, adminIdForAssignment = null) => {
    const userId = senderId === SUPPORT_INBOX_ID ? receiverId : senderId;

    await expireOldSupportSessions(userId);

    let conversation = await ConversationModel.findOne({
        $or: [
            { sender: userId, receiver: SUPPORT_INBOX_ID },
            { sender: SUPPORT_INBOX_ID, receiver: userId }
        ],
        'supportSession.isActive': true,
        'supportSession.expiresAt': { $gt: new Date() }
    }).sort({ updatedAt: -1 });

    if (!conversation) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

        conversation = await new ConversationModel({
            sender: userId,
            receiver: SUPPORT_INBOX_ID,
            messages: [],
            supportSession: {
                tokenId: generateSupportTokenId(),
                createdForUserId: userId,
                assignedAdminId: adminIdForAssignment,
                isActive: true,
                createdAt: now,
                expiresAt,
                closedAt: null
            }
        }).save();
    } else if (!conversation.supportSession?.assignedAdminId && adminIdForAssignment) {
        conversation.supportSession.assignedAdminId = adminIdForAssignment;
        await conversation.save();
    }

    return conversation;
};

const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, text, imageUrl, videoUrl, msgByUserId } = req.body;

        const actualSenderId = msgByUserId || senderId;

        const senderExists = await prisma.user.findUnique({ where: { UserID: actualSenderId } });
        if (!senderExists) {
            return res.status(404).json({ message: "Sender not found" });
        }

        let receiverExists = true;
        if (receiverId !== SUPPORT_INBOX_ID) {
            const user = await prisma.user.findUnique({ where: { UserID: receiverId } });
            receiverExists = !!user;
        }

        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        const aiData = text ? await getAiAnalysis(text) : {};

        let conversation;
        if (senderId === SUPPORT_INBOX_ID || receiverId === SUPPORT_INBOX_ID) {
            conversation = await getOrCreateActiveConversation(senderId, receiverId, senderId === SUPPORT_INBOX_ID ? actualSenderId : null);
        } else {
            conversation = await ConversationModel.findOne({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId }
                ]
            });

            if (!conversation) {
                conversation = new ConversationModel({
                    sender: senderId,
                    receiver: receiverId,
                    messages: []
                });
                await conversation.save();
            }
        }

        const message = new MessageModel({
            text,
            image: { imageUrl: imageUrl || "" },
            video: { videoUrl: videoUrl || "" },
            msgByUserId: actualSenderId,
            aiAnalysis: aiData,
            status: 'sent'
        });

        const saveMsg = await message.save();
        conversation.messages.push(saveMsg._id);
        await conversation.save();

        res.status(201).json({
            success: true,
            data: saveMsg,
            supportSession: conversation.supportSession || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message || error });
    }
};

module.exports = { sendMessage };