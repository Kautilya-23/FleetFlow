import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * - Redirects to /login if not authenticated
 * - Shows 403 Access Denied if role is not in allowedRoles
 * - allowedRoles = null/undefined means any authenticated user is allowed
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Still restoring session from localStorage
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 animate-pulse">Loading...</div>
            </div>
        );
    }

    // Not logged in → redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role check (skip if no allowedRoles specified)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center max-w-sm shadow-md">
                    <div className="text-5xl mb-4">🚫</div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
                    <p className="text-gray-600 text-sm">
                        Your role <span className="font-semibold text-gray-800">({user.role.replace(/_/g, ' ')})</span> does not have permission to view this page.
                    </p>
                    <p className="text-gray-400 text-xs mt-3">Required: {allowedRoles.map(r => r.replace(/_/g, ' ')).join(', ')}</p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
