import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
    fleet_manager: '🏢 Fleet Manager',
    dispatcher: '📡 Dispatcher',
    safety_officer: '🛡️ Safety Officer',
    financial_analyst: '💰 Financial Analyst',
};

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleDemoFill = (email) => {
        setForm({ email, password: 'pass123' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Use axios directly to /api/auth/login to avoid relying on interceptors that might require a token
            const res = await axios.post('/api/auth/login', form);
            login(res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-blue-400 tracking-tight">⚡ FleetFlow</h1>
                    <p className="text-gray-400 text-sm mt-2">Fleet Management System</p>
                </div>

                {/* Card */}
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
                    <p className="text-gray-400 text-sm mb-6">Sign in to your account to continue</p>

                    {error && (
                        <div className="mb-4 bg-red-900/40 border border-red-600 text-red-300 rounded-lg px-4 py-3 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
                            <input
                                type="email"
                                name="email"
                                id="login-email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="you@company.com"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="login-password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            id="login-btn"
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Role hint for demo */}
                    <div className="mt-6 pt-5 border-t border-gray-700">
                        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Demo Accounts</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            <button type="button" onClick={() => handleDemoFill('manager@test.com')} className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors border border-gray-600">🏢 Manager</button>
                            <button type="button" onClick={() => handleDemoFill('dispatcher@test.com')} className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors border border-gray-600">📡 Dispatcher</button>
                            <button type="button" onClick={() => handleDemoFill('safety@test.com')} className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors border border-gray-600">🛡️ Safety</button>
                            <button type="button" onClick={() => handleDemoFill('finance@test.com')} className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors border border-gray-600">💰 Finance</button>
                            <button type="button" onClick={() => handleDemoFill('suspended@test.com')} className="col-span-2 md:col-span-4 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 py-2 rounded-lg transition-colors border border-red-800">🚫 Suspended User Test</button>
                        </div>
                        <p className="text-xs text-gray-600 mt-3">All demo accounts use password: <span className="text-gray-400 font-mono">pass123</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
