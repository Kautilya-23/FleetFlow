const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    cargoWeight: { type: Number, required: true }, // in kg
    distance: { type: Number, required: true, default: 10 }, // in km, adding default for backwards compat
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], // Added Cancelled
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
