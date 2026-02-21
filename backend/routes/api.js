const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { getRecommendation } = require('../services/recommendationEngine');
const { authenticate } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

// Role shorthand sets
const ALL_ROLES = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'];
const NO_FINANCE = ['fleet_manager', 'dispatcher', 'safety_officer'];
const MANAGER_ONLY = ['fleet_manager'];
const DISPATCH_ROLES = ['fleet_manager', 'dispatcher'];
const SAFETY_ROLES = ['fleet_manager', 'safety_officer'];

// --- DASHBOARD COUNTS --- (all authenticated roles)
router.get('/dashboard', authenticate, allowRoles(...ALL_ROLES), async (req, res) => {
    try {
        const vehicleCount = await Vehicle.countDocuments();
        const driverCount = await Driver.countDocuments();
        const tripCount = await Trip.countDocuments({ status: 'In Progress' });
        res.json({ vehicleCount, driverCount, tripCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- VEHICLES ---
router.get('/vehicles', authenticate, allowRoles(...NO_FINANCE), async (req, res) => {
    try {
        // Record-level filtering logic
        let query = {};
        if (req.user.role === 'dispatcher') {
            // Dispatcher can only see active operational vehicles, not ones in maintenance
            query.status = { $in: ['Available', 'On Trip'] };
        }

        const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

        // Data masking logic (Safety officer shouldn't see costs? Let's hide maintenance thresholds for dispatcher)
        let maskedVehicles = vehicles;
        if (req.user.role === 'dispatcher') {
            maskedVehicles = vehicles.map(v => {
                const obj = v.toObject();
                delete obj.maintenanceThreshold;
                delete obj.lastMaintenanceOdometer;
                return obj;
            });
        }

        res.json(maskedVehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/vehicles', authenticate, allowRoles(...MANAGER_ONLY), async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);
        const savedVehicle = await vehicle.save();
        res.status(201).json(savedVehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET /api/vehicles/maintenance-alerts
router.get('/vehicles/maintenance-alerts', authenticate, allowRoles(...NO_FINANCE), async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        const alerts = vehicles.filter(v =>
            (v.currentOdometer - v.lastMaintenanceOdometer) >= v.maintenanceThreshold
        ).map(v => ({
            _id: v._id,
            name: v.name,
            licensePlate: v.licensePlate,
            currentOdometer: v.currentOdometer,
            lastMaintenanceOdometer: v.lastMaintenanceOdometer,
            maintenanceThreshold: v.maintenanceThreshold,
            overdueBy: (v.currentOdometer - v.lastMaintenanceOdometer) - v.maintenanceThreshold
        }));
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH /api/vehicles/:id/service
router.patch('/vehicles/:id/service', authenticate, allowRoles('fleet_manager', 'safety_officer'), async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        vehicle.lastMaintenanceOdometer = vehicle.currentOdometer;
        vehicle.status = 'Available';
        await vehicle.save();

        res.json({ message: 'Vehicle serviced successfully', vehicle });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- DRIVERS ---
router.get('/drivers', authenticate, allowRoles(...ALL_ROLES), async (req, res) => {
    try {
        const drivers = await Driver.find().sort({ createdAt: -1 });

        // Data masking: Financial Analyst only sees basic data
        if (req.user.role === 'financial_analyst') {
            const masked = drivers.map(d => ({
                _id: d._id,
                name: d.name,
                status: d.status
            }));
            return res.json(masked);
        }

        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/drivers', authenticate, allowRoles(...MANAGER_ONLY), async (req, res) => {
    try {
        const driver = new Driver(req.body);
        const savedDriver = await driver.save();
        res.status(201).json(savedDriver);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH /api/drivers/:id — update driver, with action guards
router.patch('/drivers/:id', authenticate, allowRoles(...DISPATCH_ROLES, 'safety_officer'), async (req, res) => {
    try {
        // Action-level control: Only Fleet Manager can change safety scores
        if (req.body.safetyScore && req.user.role !== 'fleet_manager') {
            return res.status(403).json({ message: 'Only Fleet Managers can edit safety scores.' });
        }

        const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- DRIVER LEADERBOARD ---
// GET /api/leaderboard
// Returns all drivers ranked by performance score (successfulTrips / totalTrips * 100)
router.get('/leaderboard', authenticate, allowRoles(...SAFETY_ROLES), async (req, res) => {
    try {
        const drivers = await Driver.find().sort({ createdAt: 1 });

        const ranked = drivers
            .map(d => {
                const total = d.totalTrips || 0;
                const successful = d.successfulTrips || 0;
                const cancelled = d.cancelledTrips || 0;
                const performanceScore = total > 0 ? Math.round((successful / total) * 100) : 0;
                return {
                    _id: d._id,
                    name: d.name,
                    status: d.status,
                    safetyScore: d.safetyScore ?? 7,
                    totalTrips: total,
                    successfulTrips: successful,
                    cancelledTrips: cancelled,
                    performanceScore,
                    // Combined score for overall ranking (weighted average)
                    overallScore: Math.round((performanceScore * 0.7) + ((d.safetyScore ?? 7) / 10 * 100 * 0.3)),
                };
            })
            .sort((a, b) => b.overallScore - a.overallScore); // Best first

        res.json(ranked);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- SMART DISPATCH RECOMMENDATION ---
router.post('/recommend', authenticate, allowRoles(...DISPATCH_ROLES), async (req, res) => {
    try {
        const { cargoWeight } = req.body;
        if (!cargoWeight || cargoWeight <= 0) {
            return res.status(400).json({ message: 'cargoWeight is required and must be > 0' });
        }
        const availableVehicles = await Vehicle.find({ status: 'Available' });
        const availableDrivers = await Driver.find({ status: 'Available' });

        if (availableVehicles.length === 0) return res.status(404).json({ message: 'No available vehicles found' });
        if (availableDrivers.length === 0) return res.status(404).json({ message: 'No available drivers found' });

        const result = getRecommendation(availableVehicles, availableDrivers, Number(cargoWeight));

        if (!result.recommendedVehicle) {
            return res.status(404).json({ message: `No vehicle can carry ${cargoWeight}kg. Please add a vehicle with higher capacity.` });
        }

        res.json({
            cargoWeight: Number(cargoWeight),
            recommendedVehicle: {
                ...result.recommendedVehicle.vehicle.toObject(),
                score: result.recommendedVehicle.score,
                capacityUtilization: result.recommendedVehicle.capacityUtilization,
            },
            recommendedDriver: {
                ...result.recommendedDriver.driver.toObject(),
                score: result.recommendedDriver.score,
                successRate: result.recommendedDriver.successRate,
            },
            allVehicleScores: result.rankedVehicles.map(r => ({
                id: r.vehicle._id, name: r.vehicle.name, maxCapacity: r.vehicle.maxCapacity,
                score: r.score, capacityUtilization: r.capacityUtilization,
            })),
            allDriverScores: result.rankedDrivers.map(r => ({
                id: r.driver._id, name: r.driver.name, safetyScore: r.driver.safetyScore,
                score: r.score, successRate: r.successRate,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- TRIPS ---
router.get('/trips', authenticate, allowRoles(...DISPATCH_ROLES), async (req, res) => {
    try {
        const trips = await Trip.find().populate('vehicle').populate('driver').sort({ createdAt: -1 });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/trips', authenticate, allowRoles(...DISPATCH_ROLES), async (req, res) => {
    try {
        const { vehicle: vehicleId, driver: driverId, cargoWeight, distance } = req.body;

        const vehicle = await Vehicle.findById(vehicleId);
        const driver = await Driver.findById(driverId);

        if (!vehicle || !driver) return res.status(404).json({ message: 'Vehicle or Driver not found' });
        if (vehicle.status !== 'Available') return res.status(400).json({ message: 'Vehicle is not available' });
        if (driver.status !== 'Available') return res.status(400).json({ message: 'Driver is not available' });
        if (cargoWeight > vehicle.maxCapacity) {
            return res.status(400).json({ message: `Cargo exceeds vehicle capacity (${vehicle.maxCapacity}kg max)` });
        }

        const newTrip = new Trip({
            vehicle: vehicleId,
            driver: driverId,
            cargoWeight,
            distance: distance || 10, // default distance 10km if not provided
            status: 'In Progress'
        });
        const savedTrip = await newTrip.save();

        await Vehicle.findByIdAndUpdate(vehicleId, {
            status: 'On Trip',
            $inc: { totalTripsHandled: 1 }
        });
        await Driver.findByIdAndUpdate(driverId, {
            status: 'On Trip',
            $inc: { totalTrips: 1 }
        });

        res.status(201).json(savedTrip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH /api/trips/:id/complete — Mark trip as Completed
router.patch('/trips/:id/complete', authenticate, allowRoles(...DISPATCH_ROLES), async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'In Progress') {
            return res.status(400).json({ message: `Trip is already ${trip.status}` });
        }

        trip.status = 'Completed';
        await trip.save();

        // Free up the vehicle, increment odometer
        await Vehicle.findByIdAndUpdate(trip.vehicle, {
            status: 'Available',
            $inc: { currentOdometer: trip.distance || 0 }
        });
        await Driver.findByIdAndUpdate(trip.driver, {
            status: 'Available',
            $inc: { successfulTrips: 1 }
        });

        res.json({ message: 'Trip completed successfully', trip });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH /api/trips/:id/cancel — Mark trip as Cancelled, update driver stats
router.patch('/trips/:id/cancel', authenticate, allowRoles(...DISPATCH_ROLES), async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'In Progress') {
            return res.status(400).json({ message: `Trip is already ${trip.status}` });
        }

        trip.status = 'Cancelled';
        await trip.save();

        // Free up the vehicle
        await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });

        // Update driver stats atomically
        await Driver.findByIdAndUpdate(trip.driver, {
            status: 'Available',
            $inc: { cancelledTrips: 1 }
        });

        res.json({ message: 'Trip cancelled', trip });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
