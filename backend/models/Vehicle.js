const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    licensePlate: { type: String, required: true, unique: true },
    maxCapacity: { type: Number, required: true }, // in kg
    status: {
        type: String,
        enum: ['Available', 'On Trip', 'Maintenance'],
        default: 'Available'
    },
    // --- Smart Dispatch Fields ---
    totalTripsHandled: { type: Number, default: 0 }, // Used for load balancing score
    // --- Predictive Maintenance Fields ---
    currentOdometer: { type: Number, default: 0 },
    maintenanceThreshold: { type: Number, default: 5000 },
    lastMaintenanceOdometer: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
