const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: {
        type: String,
        enum: ['Maintenance', 'Repair', 'Insurance', 'Other'],
        required: true
    },
    cost: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
