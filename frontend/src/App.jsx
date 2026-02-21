import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Leaderboard from './pages/Leaderboard';
import Costs from './pages/Costs';
import Login from './pages/Login';

// Role permission maps
const ROLE_NAV = {
    fleet_manager: ['/', '/vehicles', '/drivers', '/trips', '/costs', '/leaderboard'],
    dispatcher: ['/', '/vehicles', '/drivers', '/trips'],
    safety_officer: ['/', '/vehicles', '/drivers', '/leaderboard'],
    financial_analyst: ['/', '/costs'],
};

const ROUTE_ROLES = {
    '/': ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
    '/vehicles': ['fleet_manager', 'dispatcher', 'safety_officer'],
    '/drivers': ['fleet_manager', 'dispatcher', 'safety_officer'],
    '/trips': ['fleet_manager', 'dispatcher'],
    '/costs': ['fleet_manager', 'financial_analyst'],
    '/leaderboard': ['fleet_manager', 'safety_officer'],
};

const ALL_NAV = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/vehicles', label: 'Vehicles', icon: '🚛' },
    { to: '/drivers', label: 'Drivers', icon: '👤' },
    { to: '/trips', label: 'Trips', icon: '🗺️' },
    { to: '/costs', label: 'Costs', icon: '💵' },
    { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

const ROLE_BADGE_COLOR = {
    fleet_manager: 'bg-blue-600',
    dispatcher: 'bg-green-600',
    safety_officer: 'bg-yellow-600',
    financial_analyst: 'bg-purple-600',
};

const ROLE_LABEL = {
    fleet_manager: 'Fleet Manager',
    dispatcher: 'Dispatcher',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
};

function NavLink({ to, label, icon }) {
    const { pathname } = useLocation();
    const isActive = pathname === to;
    return (
        <li>
            <Link
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium text-sm
          ${isActive
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
            >
                <span>{icon}</span>
                {label}
            </Link>
        </li>
    );
}

function Sidebar() {
    const { user, logout } = useAuth();
    if (!user) return null;

    const allowedPaths = ROLE_NAV[user.role] || [];
    const visibleNav = ALL_NAV.filter(item => allowedPaths.includes(item.to));
    const badgeColor = ROLE_BADGE_COLOR[user.role] || 'bg-gray-600';

    return (
        <nav className="w-56 bg-gray-900 text-white flex flex-col p-4 shadow-xl shrink-0">
            <div className="mb-8">
                <h1 className="text-xl font-extrabold text-blue-400 tracking-tight">FleetFlow</h1>
                <p className="text-gray-500 text-xs mt-0.5">Fleet Management</p>
            </div>
            <ul className="space-y-1 flex-1">
                {visibleNav.map(item => (
                    <NavLink key={item.to} {...item} />
                ))}
            </ul>
            <div className="border-t border-gray-800 pt-3 mt-3 space-y-2">
                {/* User info */}
                <div className="px-1">
                    <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 text-white ${badgeColor}`}>
                        {ROLE_LABEL[user.role] || user.role}
                    </span>
                </div>
                {/* Logout */}
                <button
                    onClick={logout}
                    id="logout-btn"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition font-medium"
                >
                    <span>🚪</span> Logout
                </button>
            </div>
        </nav>
    );
}

function AppLayout() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <p className="animate-pulse text-lg">Loading FleetFlow...</p>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            {isAuthenticated && <Sidebar />}
            <main className="flex-1 p-8 overflow-y-auto">
                <Routes>
                    {/* Public route */}
                    <Route path="/login" element={
                        isAuthenticated ? <Navigate to="/" replace /> : <Login />
                    } />

                    {/* Protected routes */}
                    {Object.entries(ROUTE_ROLES).map(([path, roles]) => {
                        const pageMap = {
                            '/': <Dashboard />,
                            '/vehicles': <Vehicles />,
                            '/drivers': <Drivers />,
                            '/trips': <Trips />,
                            '/costs': <Costs />,
                            '/leaderboard': <Leaderboard />,
                        };
                        return (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <ProtectedRoute allowedRoles={roles}>
                                        {pageMap[path]}
                                    </ProtectedRoute>
                                }
                            />
                        );
                    })}

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppLayout />
            </AuthProvider>
        </Router>
    );
}

export default App;
