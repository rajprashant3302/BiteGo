const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const { ConversationModel, MessageModel } = require('../models/conversationModel');
const getConversation = require('../helpers/getConversation');
const { prisma } = require('../config/connectDB'); // Ensure this imports your Prisma client

const analyzeMessageWithAI = async (text) => {
    if (!text) return null;
    return {
        sentiment: text.length > 20 ? 'positive' : 'neutral',
        suggestedReplies: ["Sounds good!", "Tell me more", "I'm on it!"],
        intent: "general_inquiry"
    };
};

const setupChatSocket = (io) => {
    const onlineUser = new Set();

    io.on('connection', async (socket) => {
        const token = socket.handshake.auth.token;
        const user = await getUserDetailsFromToken(token);

        if (!user) return socket.disconnect();

        // user.id here refers to the Prisma UserID from NeonDB
        const currentUserId = user.UserID || user.id; 
        socket.join(currentUserId.toString());
        onlineUser.add(currentUserId.toString());

        io.emit('onlineUser', Array.from(onlineUser));

        // --- Handle Message Page (Load History using Prisma for User Details) ---
        socket.on('message-page', async (userId) => {
            // Fetching user details from Prisma (NeonDB) instead of Mongoose
            const userDetails = await prisma.user.findUnique({
                where: { UserID: userId },
                select: {
                    UserID: true,
                    Name: true,
                    Email: true,
                    ProfilePicURL: true,
                }
            });

            if (!userDetails) return;

            const payload = {
                _id: userDetails.UserID,
                name: userDetails.Name,
                email: userDetails.Email,
                profile_pic: userDetails.ProfilePicURL,
                online: onlineUser.has(userId)
            };

            socket.emit('message-user', payload);

            // Fetch chat history from Mongoose (MongoDB)
            const getConversationMessage = await ConversationModel.findOne({
                "$or": [
                    { sender: currentUserId, receiver: userId },
                    { sender: userId, receiver: currentUserId }
                ]
            }).populate('messages').sort({ updatedAt: -1 });

            socket.emit('message', getConversationMessage?.messages || []);
        });

        // --- Handle New Message + AI Recommendation ---
        socket.on('new-message', async (data) => {
            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data?.sender, receiver: data?.receiver },
                    { sender: data?.receiver, receiver: data?.sender }
                ]
            });

            if (!conversation) {
                conversation = await new ConversationModel({
                    sender: data?.sender,
                    receiver: data?.receiver
                }).save();
            }

            const message = new MessageModel({
                text: data?.text,
                image: { imageUrl: data?.image || "" },
                video: { videoUrl: data?.video || "" },
                msgByUserId: data?.msgByUserId,
                aiAnalysis: { sentiment: 'neutral', suggestedReplies: [] }
            });

            const saveMessage = await message.save();
            await ConversationModel.updateOne({ _id: conversation._id }, {
                "$push": { "messages": saveMessage?._id }
            });

            const chatHistory = await ConversationModel.findById(conversation._id).populate('messages');
            
            // Emit to both parties
            [data.sender, data.receiver].forEach(id => io.to(id).emit('message', chatHistory.messages));

            // Background AI Analysis
            analyzeMessageWithAI(data?.text).then(async (aiResult) => {
                if (aiResult) {
                    await MessageModel.findByIdAndUpdate(saveMessage._id, { $set: { aiAnalysis: aiResult } });
                    const updatedChat = await ConversationModel.findById(conversation._id).populate('messages');
                    [data.sender, data.receiver].forEach(id => io.to(id).emit('message', updatedChat.messages));
                }
            });

            const senderConv = await getConversation(data?.sender);
            const receiverConv = await getConversation(data?.receiver);
            io.to(data?.sender).emit('conversation', senderConv);
            io.to(data?.receiver).emit('conversation', receiverConv);
        });

        socket.on('disconnect', () => {
            onlineUser.delete(currentUserId.toString());
            io.emit('onlineUser', Array.from(onlineUser));
        });
    });
};

module.exports = setupChatSocket;