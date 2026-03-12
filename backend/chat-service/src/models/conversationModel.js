// src/models/conversationModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: { type: String, default: "" },
    image: {
        imageUrl: { type: String, default: "" },
        caption: { type: String, default: "" }
    },
    video: {
        videoUrl: { type: String, default: "" },
        caption: { type: String, default: "" }
    },
    // --- AI RECOMMENDATION FIELDS ---
    aiAnalysis: {
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
        suggestedReplies: [{ type: String }], 
        mediaTags: [{ type: String }],      
        intent: { type: String },        
    },
    // --------------------------------
    seen: { type: Boolean, default: false },
    msgByUserId: {
        type: String, // Keep as String if Prisma IDs in NeonDB are CUID/UUID
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const conversationSchema = new mongoose.Schema({
    sender: { type: String, required: true, ref: 'User' },
    receiver: { type: String, required: true, ref: 'User' },
    messages: [{
        type: mongoose.Schema.ObjectId,
        ref: 'message'
    }],
    contextSummary: { type: String, default: "" } 
}, {
    timestamps: true
});

const MessageModel = mongoose.model('message', messageSchema);
const ConversationModel = mongoose.model('Conversation', conversationSchema);

module.exports = { MessageModel, ConversationModel };