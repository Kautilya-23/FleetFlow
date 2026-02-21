import { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import useRole from '../hooks/useRole';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({ name: '', licensePlate: '', maxCapacity: '', maintenanceThreshold: 5000 });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const { can } = useRole();

    const fetchVehicles = async () => {
        try {
            const res = await axios.get('/api/vehicles');
            setVehicles(res.data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!can('add_vehicle')) return;

        try {
            await axios.post('/api/vehicles', formData);
            setFormData({ name: '', licensePlate: '', maxCapacity: '', maintenanceThreshold: 5000 });
            fetchVehicles(); // Refresh list
        } catch (error) {
            console.error('Error adding vehicle:', error);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in mt-16">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="text-blue-500">🚛</span> Vehicle Stack
                        {!can('add_vehicle') && (
                            <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full ml-4 font-medium border border-gray-600">
                                🔒 Read-only access
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-400 mt-2">Manage your fleet registry</p>
                </div>
            </header>

            {can('add_vehicle') && (
                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700/50 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
                        <span className="text-blue-400">➕</span> Add New Vehicle
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Vehicle Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Delivery Van A"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-2">License Plate</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.licensePlate}
                                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Max Capacity (kg)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.maxCapacity}
                                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Service Interval (km)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={formData.maintenanceThreshold}
                                onChange={(e) => setFormData({ ...formData, maintenanceThreshold: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-4 mt-2">
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                                Save Vehicle
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Card */}
            <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 text-gray-200">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Plate</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Odometer</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Next Service</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {vehicles.map(v => (
                            <tr key={v._id} className="hover:bg-gray-800/80 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap font-medium">{v.name}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-gray-400 font-mono">{v.licensePlate}</td>
                                <td className="px-6 py-5 whitespace-nowrap">{v.maxCapacity} kg</td>
                                <td className="px-6 py-5 whitespace-nowrap text-blue-400 font-mono">{(v.currentOdometer || 0).toLocaleString()} km</td>
                                <td className="px-6 py-5 whitespace-nowrap text-gray-400 text-sm">
                                    {((v.lastMaintenanceOdometer || 0) + (v.maintenanceThreshold || 5000)).toLocaleString()} km
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${v.status === 'Available' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                            v.status === 'On Trip' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                                'bg-orange-500/20 text-orange-400 border border-orange-500/20'}`}>
                                        {v.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {vehicles.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No vehicles found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Vehicles;
