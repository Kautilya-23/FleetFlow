const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }, // Optional
    liters: { type: Number, required: true },
    cost: { type: Number, required: true }, // Total cost
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FuelLog', fuelLogSchema);
