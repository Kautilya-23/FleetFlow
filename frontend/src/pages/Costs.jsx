import { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const Costs = () => {
    const [vehicles, setVehicles] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fuel Form State
    const [fuelData, setFuelData] = useState({ vehicle: '', liters: '', cost: '' });
    // Expense Form State
    const [expenseData, setExpenseData] = useState({ vehicle: '', type: 'Maintenance', cost: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [vehiclesRes, analyticsRes] = await Promise.all([
                axios.get('/api/vehicles'),
                axios.get('/api/costs/analytics')
            ]);
            setVehicles(vehiclesRes.data);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error('Error fetching cost data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFuelSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/costs/fuel', fuelData);
            setFuelData({ vehicle: '', liters: '', cost: '' });
            alert('Fuel log added!');
            fetchData();
        } catch (err) {
            alert('Failed to add fuel: ' + err.message);
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/costs/expense', expenseData);
            setExpenseData({ ...expenseData, cost: '', description: '' });
            alert('Expense added!');
            fetchData();
        } catch (err) {
            alert('Failed to add expense: ' + err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Cost Analytics & Tracking</h2>
            <p className="text-gray-500 mb-8 border-b pb-4">Manage fuel logs, maintenance expenses, and track fleet costs.</p>

            {/* ── ANALYTICS PANELS ────────────────────────────────────────────── */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-yellow-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Fuel Spent</h3>
                                <p className="text-4xl font-bold text-gray-800 mt-2">${analytics.totalFuelCost.toFixed(2)}</p>
                                <p className="text-sm text-gray-400 mt-1">({analytics.totalLiters} liters total)</p>
                            </div>
                            <span className="text-4xl">⛽</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Maintenance</h3>
                                <p className="text-4xl font-bold text-gray-800 mt-2">${analytics.totalMaintenanceCost.toFixed(2)}</p>
                            </div>
                            <span className="text-4xl">🔧</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Most Expensive Vehicle</h3>
                                <p className="text-xl font-bold text-gray-800 mt-2 truncate w-40">
                                    {analytics.mostExpensiveVehicle ? analytics.mostExpensiveVehicle.name : 'N/A'}
                                </p>
                                <p className="text-sm text-red-500 font-bold mt-1">
                                    ${analytics.mostExpensiveVehicle ? analytics.mostExpensiveVehicle.totalCost.toFixed(2) : '0.00'}
                                </p>
                            </div>
                            <span className="text-4xl">🔥</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FORMS ───────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Add Fuel Log */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <span>⛽</span> Log Fuel Purchase
                    </h3>
                    <form onSubmit={handleFuelSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                            <select
                                required
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={fuelData.vehicle}
                                onChange={(e) => setFuelData({ ...fuelData, vehicle: e.target.value })}
                            >
                                <option value="">-- Choose Vehicle --</option>
                                {vehicles.map(v => (
                                    <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Liters</label>
                                <input
                                    type="number" step="0.1" required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={fuelData.liters}
                                    onChange={(e) => setFuelData({ ...fuelData, liters: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Total Cost ($)</label>
                                <input
                                    type="number" step="0.01" required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={fuelData.cost}
                                    onChange={(e) => setFuelData({ ...fuelData, cost: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="bg-yellow-500 text-white w-full py-2 rounded-lg font-bold hover:bg-yellow-600 transition shadow">
                            Save Fuel Log
                        </button>
                    </form>
                </div>

                {/* Add Expense Log */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <span>🏷️</span> Log General Expense
                    </h3>
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={expenseData.vehicle}
                                    onChange={(e) => setExpenseData({ ...expenseData, vehicle: e.target.value })}
                                >
                                    <option value="">-- Choose --</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Expense Type</label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={expenseData.type}
                                    onChange={(e) => setExpenseData({ ...expenseData, type: e.target.value })}
                                >
                                    {['Maintenance', 'Repair', 'Insurance', 'Other'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Total Cost ($)</label>
                            <input
                                type="number" step="0.01" required
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={expenseData.cost}
                                onChange={(e) => setExpenseData({ ...expenseData, cost: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={expenseData.description}
                                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                                placeholder="e.g. Brake pad replacement"
                            />
                        </div>
                        <button type="submit" className="bg-red-500 text-white w-full py-2 rounded-lg font-bold hover:bg-red-600 transition shadow">
                            Save Expense
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Costs;
