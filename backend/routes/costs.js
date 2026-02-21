const express = require('express');
const router = express.Router();
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const { authenticate } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const COST_ROLES = ['fleet_manager', 'financial_analyst'];

// POST /api/costs/fuel - Add Fuel Log
router.post('/fuel', authenticate, allowRoles(...COST_ROLES), async (req, res) => {
    try {
        const { vehicle, trip, liters, cost, date } = req.body;
        if (!vehicle || !liters || !cost) {
            return res.status(400).json({ message: 'Vehicle, liters, and cost are required' });
        }

        const newLog = new FuelLog({ vehicle, trip, liters, cost, date });
        const savedLog = await newLog.save();
        res.status(201).json(savedLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/costs/expense - Add Maintenance Expense
router.post('/expense', authenticate, allowRoles(...COST_ROLES), async (req, res) => {
    try {
        const { vehicle, type, cost, description, date } = req.body;
        if (!vehicle || !type || !cost) {
            return res.status(400).json({ message: 'Vehicle, type, and cost are required' });
        }

        const newExpense = new Expense({ vehicle, type, cost, description, date });
        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/costs/analytics - Aggregated Cost Analytics
router.get('/analytics', authenticate, allowRoles(...COST_ROLES), async (req, res) => {
    try {
        // Aggregate total fuel logic
        const fuelAgg = await FuelLog.aggregate([
            { $group: { _id: null, totalFuelCost: { $sum: "$cost" }, totalLiters: { $sum: "$liters" } } }
        ]);

        // Aggregate total maintenance/expenses
        const expenseAgg = await Expense.aggregate([
            { $group: { _id: null, totalMaintenanceCost: { $sum: "$cost" } } }
        ]);

        // Aggregate per-vehicle costs (combining fuel and expense)
        const vehicleCosts = {};

        const fuelByVehicle = await FuelLog.aggregate([
            { $group: { _id: "$vehicle", cost: { $sum: "$cost" } } }
        ]);

        const expenseByVehicle = await Expense.aggregate([
            { $group: { _id: "$vehicle", cost: { $sum: "$cost" } } }
        ]);

        // Group into an map
        fuelByVehicle.forEach(f => {
            vehicleCosts[f._id] = { fuel: f.cost, maintenance: 0 };
        });
        expenseByVehicle.forEach(e => {
            if (!vehicleCosts[e._id]) vehicleCosts[e._id] = { fuel: 0, maintenance: 0 };
            vehicleCosts[e._id].maintenance = e.cost;
        });

        // Find most expensive vehicle
        let mostExpensiveObj = null;
        let maxCost = 0;
        let highestCostVehicleId = null;

        for (const [vId, costs] of Object.entries(vehicleCosts)) {
            const total = costs.fuel + costs.maintenance;
            if (total >= maxCost) {
                maxCost = total;
                highestCostVehicleId = vId;
            }
        }

        if (highestCostVehicleId) {
            mostExpensiveObj = await Vehicle.findById(highestCostVehicleId).select('name licensePlate');
        }

        const stats = {
            totalFuelCost: fuelAgg[0]?.totalFuelCost || 0,
            totalLiters: fuelAgg[0]?.totalLiters || 0,
            totalMaintenanceCost: expenseAgg[0]?.totalMaintenanceCost || 0,
            mostExpensiveVehicle: mostExpensiveObj ? {
                ...mostExpensiveObj.toObject(),
                totalCost: maxCost
            } : null
        };

        res.json(stats);
    } catch (error) {
        console.error("Aggregation Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
