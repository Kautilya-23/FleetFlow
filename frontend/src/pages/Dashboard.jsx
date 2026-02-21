import { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import useRole from '../hooks/useRole';

const Dashboard = () => {
    const [stats, setStats] = useState({ vehicleCount: 0, driverCount: 0, tripCount: 0 });
    const [alerts, setAlerts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const statsRes = await axios.get('/api/dashboard');
            setStats(statsRes.data);

            // Fetch alerts if permitted (not Finance)
            try {
                const alertsRes = await axios.get('/api/vehicles/maintenance-alerts');
                setAlerts(alertsRes.data);
            } catch (err) {
                if (err.response?.status !== 403) {
                    console.error('Error fetching alerts:', err);
                }
            }

            // Only fetch costs if permitted
            try {
                const analyticsRes = await axios.get('/api/costs/analytics');
                setAnalytics(analyticsRes.data);
            } catch (err) {
                // Ignore 403 errors for roles without access
                if (err.response?.status !== 403) {
                    console.error('Error fetching analytics:', err);
                }
            }
            setError(null);
        } catch (err) {
            setError('Cannot connect to the backend. Make sure MongoDB is running and the backend server is started.');
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceVehicle = async (id) => {
        if (!window.confirm("Mark this vehicle as serviced? This will reset its maintenance tracking.")) return;
        try {
            await axios.patch(`/api/vehicles/${id}/service`);
            fetchStats();
        } catch (err) {
            alert("Error servicing vehicle: " + err.message);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-lg animate-pulse">Loading Dashboard...</div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-2xl">
            <h3 className="text-red-700 font-bold text-lg mb-2">⚠️ Connection Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                <p className="text-gray-400 mb-1"># Run these commands in separate terminals:</p>
                <p>mongod                  <span className="text-gray-400"># Terminal 1: Start MongoDB</span></p>
                <p>cd backend && npm run dev  <span className="text-gray-400"># Terminal 2: Start Backend</span></p>
                <p>cd frontend && npm run dev <span className="text-gray-400"># Terminal 3: Start Frontend</span></p>
            </div>
            <button
                onClick={() => { setLoading(true); fetchStats(); }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
            >
                Retry Connection
            </button>
        </div>
    );

    const { isFinance, can, isManager, isSafety } = useRole();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">System Dashboard</h2>
            <p className="text-gray-500 mb-8 text-sm">Live fleet metrics overview</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Hide operation counts from Finance */}
                {!isFinance && (
                    <>
                        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Vehicles</h3>
                                    <p className="text-5xl font-bold text-gray-800 mt-2">{stats.vehicleCount}</p>
                                </div>
                                <span className="text-4xl">🚛</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Drivers</h3>
                                    <p className="text-5xl font-bold text-gray-800 mt-2">{stats.driverCount}</p>
                                </div>
                                <span className="text-4xl">👤</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Trips</h3>
                                    <p className="text-5xl font-bold text-gray-800 mt-2">{stats.tripCount}</p>
                                </div>
                                <span className="text-4xl">🗺️</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Show costs only if permitted (Manager / Finance) */}
                {analytics && can('view_costs') && (
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow col-span-1 md:col-span-3 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Fleet Cost</h3>
                                <p className="text-5xl font-bold text-gray-800 mt-2">
                                    ${((analytics.totalFuelCost || 0) + (analytics.totalMaintenanceCost || 0)).toFixed(0)}
                                </p>
                            </div>
                            <span className="text-4xl">💵</span>
                        </div>
                        <div className="mt-4 flex justify-between text-sm text-gray-500 font-medium">
                            <p>Fuel: ${(analytics.totalFuelCost || 0).toFixed(0)}</p>
                            <p>Maint: ${(analytics.totalMaintenanceCost || 0).toFixed(0)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MAINTENANCE ALERTS (Manager & Safety only) ──────────────────────── */}
            {(isManager || isSafety) && alerts.length > 0 && (
                <div className="mt-8 bg-red-50 rounded-xl shadow-md p-6 border-l-4 border-red-500">
                    <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Predictive Maintenance Alerts
                    </h3>
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div key={alert._id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border border-red-100">
                                <div>
                                    <h4 className="font-bold text-gray-800">{alert.name} <span className="text-sm font-normal text-gray-500">({alert.licensePlate})</span></h4>
                                    <p className="text-sm text-red-600 mt-1">
                                        Overdue by <span className="font-bold">{alert.overdueBy} km</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Driven {alert.currentOdometer - alert.lastMaintenanceOdometer} km since last service
                                    </p>
                                </div>
                                {can('edit_maintenance') && (
                                    <button
                                        onClick={() => handleServiceVehicle(alert._id)}
                                        className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-bold transition"
                                    >
                                        🛠️ Mark Serviced
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isFinance && (
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Quick Tips</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
                        <li>Add vehicles and drivers before creating a trip.</li>
                        <li>Trip cargo weight must be below the vehicle's max capacity.</li>
                        <li>Both vehicle and driver must be "Available" to dispatch a trip.</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
