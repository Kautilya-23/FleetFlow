import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // decoded JWT payload: { id, name, email, role }
    const [loading, setLoading] = useState(true);

    // On mount: restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem('fleetflow_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check token expiry
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                } else {
                    localStorage.removeItem('fleetflow_token');
                }
            } catch {
                localStorage.removeItem('fleetflow_token');
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('fleetflow_token', token);
        const decoded = jwtDecode(token);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('fleetflow_token');
        setUser(null);
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy access
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
