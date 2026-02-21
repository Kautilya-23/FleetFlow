import { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const MEDAL = ['🥇', '🥈', '🥉'];

// Score colour helpers
const perfColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-500';
};

const safetyColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-500';
};

const statusBadge = (status) => {
    const map = {
        'Available': 'bg-green-100 text-green-700',
        'On Trip': 'bg-blue-100 text-blue-700',
        'Off Duty': 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
};

const Leaderboard = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchLeaderboard(); }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get('/api/leaderboard');
            setDrivers(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load leaderboard. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg animate-pulse">Loading Leaderboard...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">{error}</div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Driver Leaderboard</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Ranked by Overall Score = Performance (70%) + Safety Rating (30%)
                </p>
            </div>

            {/* Top 3 Podium */}
            {drivers.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-2">
                    {drivers.slice(0, 3).map((d, i) => (
                        <div
                            key={d._id}
                            className={`rounded-2xl p-5 text-center shadow-md border ${i === 0
                                ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-yellow-300 scale-105'
                                : i === 1
                                    ? 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-300'
                                    : 'bg-gradient-to-b from-orange-50 to-orange-100 border-orange-200'
                                }`}
                        >
                            <div className="text-5xl mb-2">{MEDAL[i]}</div>
                            <p className="font-bold text-gray-800 text-lg">{d.name}</p>
                            <p className="text-3xl font-extrabold mt-2" style={{ color: i === 0 ? '#ca8a04' : i === 1 ? '#6b7280' : '#c2410c' }}>
                                {d.overallScore}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Overall Score</p>
                            <div className="flex justify-center gap-3 mt-3 text-xs text-gray-500">
                                <span>⭐ {d.safetyScore}/10</span>
                                <span>✅ {d.performanceScore}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Full Table */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">All Driver Rankings</h3>
                    <button
                        onClick={() => { setLoading(true); fetchLeaderboard(); }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                        ↻ Refresh
                    </button>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Rank', 'Driver', 'Status', 'Safety (1–10)', 'Performance', 'Trips', 'Cancelled', 'Overall Score'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {drivers.map((d, i) => (
                            <tr key={d._id} className={`hover:bg-gray-50 transition ${i < 3 ? 'font-medium' : ''}`}>
                                {/* Rank */}
                                <td className="px-4 py-4">
                                    <span className="text-xl">{i < 3 ? MEDAL[i] : `#${i + 1}`}</span>
                                </td>
                                {/* Name */}
                                <td className="px-4 py-4 text-gray-800 font-semibold">{d.name}</td>
                                {/* Status */}
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(d.status)}`}>
                                        {d.status}
                                    </span>
                                </td>
                                {/* Safety Score */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-sm ${safetyColor(d.safetyScore)}`}>{d.safetyScore}/10</span>
                                        <div className="flex gap-0.5">
                                            {[...Array(10)].map((_, j) => (
                                                <div key={j} className={`h-1.5 w-1.5 rounded-full ${j < d.safetyScore ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                {/* Performance Score */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-sm ${perfColor(d.performanceScore)}`}>{d.performanceScore}%</span>
                                        <div className="w-20 bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${d.performanceScore >= 80 ? 'bg-green-500' : d.performanceScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                style={{ width: `${d.performanceScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                {/* Total Trips */}
                                <td className="px-4 py-4 text-gray-600 text-sm">
                                    <span className="text-green-600 font-medium">{d.successfulTrips}</span>
                                    <span className="text-gray-400"> / {d.totalTrips}</span>
                                </td>
                                {/* Cancelled */}
                                <td className="px-4 py-4">
                                    {d.cancelledTrips > 0
                                        ? <span className="text-red-500 font-medium text-sm">{d.cancelledTrips}</span>
                                        : <span className="text-gray-300 text-sm">—</span>
                                    }
                                </td>
                                {/* Overall Score */}
                                <td className="px-4 py-4">
                                    <span className={`text-lg font-extrabold ${i === 0 ? 'text-yellow-600' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-orange-600' : 'text-indigo-600'}`}>
                                        {d.overallScore}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {drivers.length === 0 && (
                            <tr>
                                <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                                    No drivers yet. Add some drivers to see the leaderboard.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Score Formula Legend */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">📊 Scoring Formula</p>
                <p><strong>Performance Score</strong> = (Completed Trips ÷ Total Trips) × 100</p>
                <p><strong>Overall Score</strong> = (Performance × 70%) + (Safety Rating × 30%)</p>
            </div>
        </div>
    );
};

export default Leaderboard;
