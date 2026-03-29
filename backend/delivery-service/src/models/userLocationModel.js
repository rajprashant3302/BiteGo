const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true,
        unique: true // Ensures only one active location record per user
    },
    location: {
        type: {
            type: String, 
            enum: ['Point'], 
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude] - MongoDB expects lng first!
            required: true
        }
    },
    lastUpdated: { type: Date, default: Date.now }
});

// Create a geospatial index so you can eventually query "restaurants near me" or "drivers near me"
userLocationSchema.index({ location: '2dsphere' });

const UserLocationModel = mongoose.model('UserLocation', userLocationSchema);

module.exports = UserLocationModel;