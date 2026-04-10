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
    aiAnalysis: {
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
        suggestedReplies: [{ type: String }],
        mediaTags: [{ type: String }],
        intent: { type: String },
    },

    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    seen: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
    seenAt: { type: Date, default: null },

    msgByUserId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const conversationSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    messages: [{
        type: mongoose.Schema.ObjectId,
        ref: 'message'
    }],
    contextSummary: { type: String, default: "" },

    supportSession: {
        tokenId: { type: String, default: "" },
        createdForUserId: { type: String, default: "" },
        assignedAdminId: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: null },
        closedAt: { type: Date, default: null }
    }
}, {
    timestamps: true
});

conversationSchema.index({ sender: 1, receiver: 1 });
conversationSchema.index({ 'supportSession.tokenId': 1 });
conversationSchema.index({ 'supportSession.createdForUserId': 1, 'supportSession.isActive': 1 });

const MessageModel = mongoose.model('message', messageSchema);
const ConversationModel = mongoose.model('Conversation', conversationSchema);

module.exports = { MessageModel, ConversationModel };