import { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const API = '/api';

// ── Score badge colour helper ──────────────────────────────────────────────────
const scoreBadgeClass = (score) => {
    if (score >= 75) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
};

// ── Recommendation Result Card ────────────────────────────────────────────────
const RecommendCard = ({ label, name, detail, score, extra, icon }) => (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
        </div>
        <p className="text-lg font-bold text-gray-800">{name}</p>
        <p className="text-sm text-gray-500 mb-3">{detail}</p>
        <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded border ${scoreBadgeClass(score)}`}>
                Score: {score}/100
            </span>
            {extra && (
                <span className="text-xs text-gray-400">{extra}</span>
            )}
        </div>
    </div>
);

// ── Main Trips Page ───────────────────────────────────────────────────────────
const Trips = () => {
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Dispatch form state
    const [formData, setFormData] = useState({ vehicle: '', driver: '', cargoWeight: '', distance: '' });

    // Recommendation state
    const [recCargoWeight, setRecCargoWeight] = useState('');
    const [recommendation, setRecommendation] = useState(null);
    const [recLoading, setRecLoading] = useState(false);
    const [recError, setRecError] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
                axios.get(`${API}/trips`),
                axios.get(`${API}/vehicles`),
                axios.get(`${API}/drivers`)
            ]);
            setTrips(tripsRes.data);
            setVehicles(vehiclesRes.data.filter(v => v.status === 'Available'));
            setDrivers(driversRes.data.filter(d => d.status === 'Available'));
        } catch (err) {
            console.error('Error fetching trips data:', err);
        }
    };

    // ── Smart Recommend ─────────────────────────────────────────────────────────
    const handleRecommend = async () => {
        if (!recCargoWeight || recCargoWeight <= 0) {
            setRecError('Please enter a valid cargo weight first.');
            return;
        }
        setRecError('');
        setRecLoading(true);
        setRecommendation(null);
        try {
            const res = await axios.post(`${API}/recommend`, { cargoWeight: Number(recCargoWeight) });
            setRecommendation(res.data);
        } catch (err) {
            setRecError(err.response?.data?.message || 'Recommendation failed. Make sure you have available vehicles and drivers.');
        } finally {
            setRecLoading(false);
        }
    };

    // ── Accept Recommendation → auto-fill form ──────────────────────────────────
    const handleAcceptRecommendation = () => {
        if (!recommendation) return;
        setFormData({
            vehicle: recommendation.recommendedVehicle._id,
            driver: recommendation.recommendedDriver._id,
            cargoWeight: recommendation.cargoWeight,
        });
        // Scroll to the dispatch form
        document.getElementById('dispatch-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ── Manual dispatch form submit ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/trips`, formData);
            setFormData({ vehicle: '', driver: '', cargoWeight: '', distance: '' });
            setRecommendation(null);
            setRecCargoWeight('');
            fetchData();
        } catch (err) {
            alert('Error creating trip: ' + (err.response?.data?.message || err.message));
        }
    };

    // ── Complete or Cancel a trip ────────────────────────────────────────────────
    const handleTripAction = async (tripId, action) => {
        const label = action === 'complete' ? 'Complete' : 'Cancel';
        if (!window.confirm(`Are you sure you want to ${label} this trip?`)) return;
        try {
            await axios.patch(`${API}/trips/${tripId}/${action}`);
            fetchData(); // Refresh all lists (trips + driver/vehicle statuses)
        } catch (err) {
            alert(`Failed to ${label} trip: ` + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Dispatch Trips</h2>
                <p className="text-gray-500 text-sm mt-1">Use the Smart Engine or manually assign a trip below.</p>
            </div>

            {/* ── SMART DISPATCH PANEL ─────────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⚡</span>
                    <div>
                        <h3 className="text-xl font-bold text-indigo-700">Smart Dispatch Engine</h3>
                        <p className="text-indigo-500 text-xs">AI-powered vehicle + driver recommendation</p>
                    </div>
                </div>

                {/* Input row */}
                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-600">Cargo Weight (kg)</label>
                        <input
                            type="number"
                            min="1"
                            value={recCargoWeight}
                            onChange={(e) => {
                                setRecCargoWeight(e.target.value);
                                setRecommendation(null);
                                setRecError('');
                            }}
                            placeholder="e.g. 500"
                            className="border border-indigo-300 rounded-lg px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                    </div>
                    <button
                        onClick={handleRecommend}
                        disabled={recLoading}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow"
                    >
                        {recLoading ? 'Analysing...' : '⚡ Get Recommendation'}
                    </button>
                </div>

                {/* Error */}
                {recError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-600 text-sm mb-4">{recError}</div>
                )}

                {/* Result cards */}
                {recommendation && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <RecommendCard
                                label="Recommended Vehicle"
                                icon="🚛"
                                name={recommendation.recommendedVehicle.name}
                                detail={`${recommendation.recommendedVehicle.licensePlate} · ${recommendation.recommendedVehicle.maxCapacity}kg capacity`}
                                score={recommendation.recommendedVehicle.score}
                                extra={`${recommendation.recommendedVehicle.capacityUtilization}% utilisation`}
                            />
                            <RecommendCard
                                label="Recommended Driver"
                                icon="👤"
                                name={recommendation.recommendedDriver.name}
                                detail={`Safety Score: ${recommendation.recommendedDriver.safetyScore}/10`}
                                score={recommendation.recommendedDriver.score}
                                extra={`${recommendation.recommendedDriver.successRate}% success rate`}
                            />
                        </div>

                        {/* All scores breakdown */}
                        <details className="text-xs text-gray-500 cursor-pointer">
                            <summary className="font-semibold text-indigo-500 hover:text-indigo-700">View all scores ▾</summary>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="font-semibold text-gray-600 mb-1">Vehicle Rankings</p>
                                    {recommendation.allVehicleScores.map((v, i) => (
                                        <div key={v.id} className="flex justify-between py-1 border-b border-gray-100">
                                            <span>#{i + 1} {v.name} ({v.maxCapacity}kg)</span>
                                            <span className={`font-bold ${i === 0 ? 'text-green-600' : 'text-gray-400'}`}>{v.score}pts</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-600 mb-1">Driver Rankings</p>
                                    {recommendation.allDriverScores.map((d, i) => (
                                        <div key={d.id} className="flex justify-between py-1 border-b border-gray-100">
                                            <span>#{i + 1} {d.name} (safety: {d.safetyScore}/10)</span>
                                            <span className={`font-bold ${i === 0 ? 'text-green-600' : 'text-gray-400'}`}>{d.score}pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </details>

                        {/* Accept button */}
                        <button
                            onClick={handleAcceptRecommendation}
                            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition text-sm shadow"
                        >
                            ✅ Accept Recommendation & Fill Form
                        </button>
                    </div>
                )}
            </div>

            {/* ── MANUAL DISPATCH FORM ─────────────────────────────────────────────── */}
            <div id="dispatch-form" className="bg-white rounded-2xl shadow p-6 border-t-4 border-gray-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">
                    {formData.vehicle ? '✅ Confirm & Dispatch Trip' : 'Manual Trip Assignment'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-indigo-500"
                                value={formData.vehicle}
                                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                            >
                                <option value="">-- Choose Vehicle --</option>
                                {vehicles.map(v => (
                                    <option key={v._id} value={v._id}>
                                        {v.name} ({v.maxCapacity}kg max)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Driver</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-indigo-500"
                                value={formData.driver}
                                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                            >
                                <option value="">-- Choose Driver --</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name} (safety: {d.safetyScore}/10)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Cargo Weight (kg)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                                value={formData.cargoWeight}
                                onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value })}
                                placeholder="e.g. 500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Distance (km)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                                value={formData.distance}
                                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                                placeholder="e.g. 150"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-bold w-full md:w-auto shadow transition"
                    >
                        🚀 Dispatch Trip
                    </button>
                </form>
            </div>

            {/* ── TRIP HISTORY TABLE ────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700">Trip History</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Vehicle', 'Driver', 'Cargo', 'Distance', 'Status', 'Date', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {trips.map(t => (
                            <tr key={t._id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-4 font-medium text-gray-800">{t.vehicle?.name || '—'}</td>
                                <td className="px-4 py-4 text-gray-600">{t.driver?.name || '—'}</td>
                                <td className="px-4 py-4 font-semibold text-gray-700">{t.cargoWeight} kg</td>
                                <td className="px-4 py-4 font-semibold text-gray-700">{t.distance || 0} km</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${t.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            t.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-gray-400 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-4">
                                    {t.status === 'In Progress' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleTripAction(t._id, 'complete')}
                                                className="text-xs bg-green-50 border border-green-300 text-green-700 px-2 py-1 rounded hover:bg-green-100 font-medium transition"
                                            >
                                                ✅ Complete
                                            </button>
                                            <button
                                                onClick={() => handleTripAction(t._id, 'cancel')}
                                                className="text-xs bg-red-50 border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-medium transition"
                                            >
                                                ❌ Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {trips.length === 0 && (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No trips dispatched yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Trips;
