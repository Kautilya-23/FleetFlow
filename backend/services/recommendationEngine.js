/**
 * FleetFlow - Smart Dispatch Recommendation Engine
 * Pure scoring logic — no DB calls here.
 * Takes arrays of available vehicles/drivers and cargo info,
 * returns ranked lists with the top recommendation.
 */

/**
 * Score a vehicle based on how well it fits the cargo.
 *
 * Scoring Breakdown (max 100pts):
 *  - Capacity Fit  (50pts): Vehicle whose capacity is closest to cargo (but above it) scores highest.
 *  - Load Balance  (30pts): Fewer total trips handled = more points (spread the load evenly).
 *  - Surplus Buffer(20pts): Slight penalty for massive overcapacity (don't use a 10-ton truck for 100kg).
 *
 * @param {Object} vehicle - Vehicle document from MongoDB
 * @param {number} cargoWeight - Requested cargo in kg
 * @returns {number} score 0–100
 */
function scoreVehicle(vehicle, cargoWeight) {
    // Safety gate: vehicle must be able to carry the cargo
    if (vehicle.maxCapacity < cargoWeight) return -1;

    // --- Factor 1: Capacity Fit (how 'snug' is the fit?) ---
    // Overflow ratio: 0 = perfect fit, 1 = double the capacity needed
    const overflowRatio = (vehicle.maxCapacity - cargoWeight) / vehicle.maxCapacity;
    // Penalise excess capacity. A ratio of 0 scores 50, ratio of 1 scores 0.
    const capacityScore = Math.max(0, 50 * (1 - overflowRatio));

    // --- Factor 2: Load Balance (prefer less-used vehicles) ---
    // Assume max trips for normalisation = 100 (adjust if your fleet runs more)
    const maxTripsNorm = 100;
    const tripsRatio = Math.min(vehicle.totalTripsHandled || 0, maxTripsNorm) / maxTripsNorm;
    const loadScore = 30 * (1 - tripsRatio);

    // --- Factor 3: Surplus Buffer bonus (moderate excess capacity is fine) ---
    // Sweet spot: 10–30% excess capacity is ideal. Give a 20pt bonus there.
    const excessPercent = overflowRatio * 100;
    let bufferScore = 0;
    if (excessPercent >= 10 && excessPercent <= 50) {
        bufferScore = 20; // Ideal range
    } else if (excessPercent < 10) {
        bufferScore = 15; // Very tight, slightly risky
    } else {
        // Too much excess: scale penalty from 15 -> 0 as excess goes from 50% to 100%
        bufferScore = Math.max(0, 15 * (1 - (excessPercent - 50) / 50));
    }

    const total = Math.round(capacityScore + loadScore + bufferScore);
    return Math.min(100, Math.max(0, total));
}

/**
 * Score a driver based on safety and experience.
 *
 * Scoring Breakdown (max 100pts):
 *  - Safety Score  (50pts): Dispatcher rating 1–10, mapped to 0–50.
 *  - Success Rate  (30pts): (successfulTrips / totalTrips) * 30. 
 *                           New drivers (0 trips) get a default 70% rate.
 *  - Load Balance  (20pts): Fewer trips = more points (fresh driver).
 *
 * @param {Object} driver - Driver document from MongoDB
 * @returns {number} score 0–100
 */
function scoreDriver(driver) {
    // --- Factor 1: Safety Score ---
    const safetyScore = ((driver.safetyScore || 7) / 10) * 50;

    // --- Factor 2: Success Rate ---
    let successRate;
    if (!driver.totalTrips || driver.totalTrips === 0) {
        successRate = 0.7; // Default 70% for new drivers (benefit of the doubt)
    } else {
        successRate = (driver.successfulTrips || 0) / driver.totalTrips;
    }
    const successScore = successRate * 30;

    // --- Factor 3: Load Balance ---
    const maxTripsNorm = 100;
    const tripsRatio = Math.min(driver.totalTrips || 0, maxTripsNorm) / maxTripsNorm;
    const loadScore = 20 * (1 - tripsRatio);

    const total = Math.round(safetyScore + successScore + loadScore);
    return Math.min(100, Math.max(0, total));
}

/**
 * Main recommendation function.
 * Returns scored and ranked lists of vehicles and drivers,
 * plus the top recommendation pair.
 *
 * @param {Array} availableVehicles - Array of Vehicle documents
 * @param {Array} availableDrivers  - Array of Driver documents
 * @param {number} cargoWeight     - Requested cargo weight in kg
 * @returns {Object} { recommendedVehicle, recommendedDriver, rankedVehicles, rankedDrivers }
 */
function getRecommendation(availableVehicles, availableDrivers, cargoWeight) {
    // Score all vehicles — filter out ones that can't carry the cargo
    const rankedVehicles = availableVehicles
        .map(v => ({
            vehicle: v,
            score: scoreVehicle(v, cargoWeight),
            capacityUtilization: Math.round((cargoWeight / v.maxCapacity) * 100),
        }))
        .filter(item => item.score >= 0) // Remove vehicles that fail capacity check
        .sort((a, b) => b.score - a.score); // Highest score first

    // Score all drivers
    const rankedDrivers = availableDrivers
        .map(d => ({
            driver: d,
            score: scoreDriver(d),
            successRate: d.totalTrips > 0
                ? Math.round((d.successfulTrips / d.totalTrips) * 100)
                : 70, // default 70% for new drivers
        }))
        .sort((a, b) => b.score - a.score); // Highest score first

    return {
        recommendedVehicle: rankedVehicles[0] || null,
        recommendedDriver: rankedDrivers[0] || null,
        rankedVehicles,
        rankedDrivers,
    };
}

module.exports = { getRecommendation, scoreVehicle, scoreDriver };
