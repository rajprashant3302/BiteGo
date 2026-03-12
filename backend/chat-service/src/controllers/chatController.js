const { MessageModel, ConversationModel } = require('../models/conversationModel');
const { prisma } = require('../config/connectDB');

// Helper to simulate AI Analysis (Replace with OpenAI/Gemini API call)
const getAiAnalysis = async (text) => {
    // In a real app, you'd fetch this from an LLM
    return {
        sentiment: text.length > 10 ? 'positive' : 'neutral',
        suggestedReplies: ["Tell me more!", "That's cool", "Okay!"],
        intent: "general_chat"
    };
};

const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, text, imageUrl, videoUrl } = req.body;

        // 1. Validate users in Prisma (NeonDB)
        const senderExists = await prisma.user.findUnique({ where: { id: senderId } });
        if (!senderExists) return res.status(404).json({ message: "Sender not found" });

        // 2. Perform AI Analysis on the text
        const aiData = text ? await getAiAnalysis(text) : {};

        // 3. Create the Message
        const message = new MessageModel({
            text,
            image: { imageUrl },
            video: { videoUrl },
            msgByUserId: senderId,
            aiAnalysis: aiData
        });
        const saveMsg = await message.save();

        // 4. Update or Create Conversation
        let conversation = await ConversationModel.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (!conversation) {
            conversation = new ConversationModel({
                sender: senderId,
                receiver: receiverId,
                messages: [saveMsg._id]
            });
        } else {
            conversation.messages.push(saveMsg._id);
        }
        
        await conversation.save();

        res.status(201).json({ success: true, data: saveMsg });
    } catch (error) {
        res.status(500).json({ message: error.message || error });
    }
};

module.exports = { sendMessage };