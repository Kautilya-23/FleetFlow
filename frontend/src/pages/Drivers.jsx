import { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import useRole from '../hooks/useRole';

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [formData, setFormData] = useState({ name: '', licenseExpiry: '', safetyScore: 7 });

    useEffect(() => { fetchDrivers(); }, []);

    const { can, isFinance } = useRole();

    const fetchDrivers = async () => {
        try {
            const res = await axios.get('/api/drivers');
            setDrivers(res.data);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!can('add_driver')) return;

        try {
            await axios.post('/api/drivers', formData);
            setFormData({ name: '', licenseExpiry: '', safetyScore: 7 });
            fetchDrivers();
        } catch (error) {
            console.error('Error adding driver:', error);
        }
    };

    const handleSafetyScoreUpdate = async (id, newScore) => {
        if (!can('edit_safety_score')) return;
        try {
            await axios.patch(`/api/drivers/${id}`, { safetyScore: parseInt(newScore) });
            fetchDrivers();
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in mt-16">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="text-purple-500">🧑‍✈️</span> Driver Roster
                        {!can('add_driver') && (
                            <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full ml-4 font-medium border border-gray-600">
                                🔒 Select fields Read-only
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-400 mt-2">Manage pilot assignments and safety records</p>
                </div>
            </header>

            {can('add_driver') && (
                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700/50 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
                        <span className="text-purple-400">➕</span> Add New Driver
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Driver Name</label>
                            <input type="text" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">License Expiry</label>
                            <input type="date" value={formData.licenseExpiry} onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })} required className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all [color-scheme:dark]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Initial Safety (1-10)</label>
                            <input type="number" min="1" max="10" value={formData.safetyScore} onChange={(e) => setFormData({ ...formData, safetyScore: e.target.value })} required className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="md:col-span-4 mt-2">
                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-purple-900/20">Record Driver</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map(driver => (
                    <div key={driver._id} className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 hover:border-purple-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{driver.name}</h3>
                                <p className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${driver.status === 'Available' ? 'bg-green-500' : driver.status === 'On Trip' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                                    {driver.status}
                                </p>
                            </div>
                        </div>

                        {!isFinance && (
                            <div className="space-y-4 mb-6">
                                <div className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Completed Trips</span>
                                    <span className="text-white font-mono font-bold tracking-wider">{driver.successfulTrips ?? 0} <span className="text-gray-600 font-normal">/ {driver.totalTrips ?? 0}</span></span>
                                </div>

                                {can('edit_safety_score') ? (
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-400 text-sm">Safety Index</span>
                                            <span className={`font-bold font-mono ${driver.safetyScore >= 8 ? 'text-green-400' : driver.safetyScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{driver.safetyScore ?? 7}/10</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="10"
                                            defaultValue={driver.safetyScore || 7}
                                            onChange={(e) => handleSafetyScoreUpdate(driver._id, e.target.value)}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 text-sm">Safety Index</span>
                                            <span className={`font-bold font-mono ${driver.safetyScore >= 8 ? 'text-green-400' : driver.safetyScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{driver.safetyScore ?? 7}/10</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Drivers;
