const mongoose = require('mongoose');

const driverLocationHistorySchema = new mongoose.Schema({
    driverId: {
        type: String,
        required: true,
        index: true // Speeds up queries when you look up a specific driver's history
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude] - MongoDB needs lng first!
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true // Speeds up queries when sorting by time
    }
});

// Create a geospatial index just in case you ever want to do spatial queries on history
driverLocationHistorySchema.index({ location: '2dsphere' });

const DriverLocationHistoryModel = mongoose.model('DriverLocationHistory', driverLocationHistorySchema);

module.exports = DriverLocationHistoryModel;