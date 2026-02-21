const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Available', 'On Trip', 'Off Duty'],
        default: 'Available'
    },
    // --- Smart Dispatch Fields ---
    safetyScore: { type: Number, default: 7, min: 1, max: 10 }, // Dispatcher-rated 1-10
    totalTrips: { type: Number, default: 0 },                   // All assigned trips
    successfulTrips: { type: Number, default: 0 },              // Completed trips
    cancelledTrips: { type: Number, default: 0 }                // Cancelled trips (leaderboard)
}, { timestamps: true });

// Virtual: computed performance score (not stored in DB, calculated on the fly)
driverSchema.virtual('performanceScore').get(function () {
    if (!this.totalTrips || this.totalTrips === 0) return 0;
    return Math.round((this.successfulTrips / this.totalTrips) * 100);
});

module.exports = mongoose.model('Driver', driverSchema);
