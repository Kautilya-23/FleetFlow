import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useRole hook
 * Simplifies permission checks across the frontend based on the user's role.
 */
const useRole = () => {
    const { user } = useContext(AuthContext);
    const role = user?.role || null;

    // Role booleans
    const isManager = role === 'fleet_manager';
    const isDispatcher = role === 'dispatcher';
    const isSafety = role === 'safety_officer';
    const isFinance = role === 'financial_analyst';

    // Action permission map
    const can = (action) => {
        switch (action) {
            case 'edit_safety_score':
                return isManager; // Only manager can edit safety score
            case 'add_driver':
                return isManager; // Only manager can add drivers
            case 'add_vehicle':
                return isManager; // Only manager can add vehicles
            case 'edit_maintenance':
                return isManager || isSafety; // Manager and Safety can mark vehicles serviced
            case 'dispatch_trip':
                return isManager || isDispatcher; // Manager and Dispatcher can assign trips
            case 'view_costs':
                return isManager || isFinance; // Manager and Finance can see cost data
            case 'view_full_driver':
                return !isFinance; // Finance only sees masked driver data
            default:
                return false;
        }
    };

    return { role, isManager, isDispatcher, isSafety, isFinance, can };
};

export default useRole;
