const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Verify JWT + check DB for suspension & role-change invalidation.
 *
 * Security edge cases handled:
 *  1. No / invalid token            → 401
 *  2. Expired token                 → 401
 *  3. User account suspended        → 403
 *  4. Role changed after token issue → 401 (forces re-login)
 */
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    try {
        // Re-fetch from DB to catch suspension or role changes
        const user = await User.findById(decoded.id).select('isActive lastRoleChange role name email');

        // Edge case: user deleted
        if (!user) return res.status(401).json({ message: 'User no longer exists.' });

        // Edge case: suspended account
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account suspended. Contact your administrator.' });
        }

        // Edge case: role changed after this token was issued → force re-login
        if (user.lastRoleChange && decoded.iat < Math.floor(user.lastRoleChange.getTime() / 1000)) {
            return res.status(401).json({ message: 'Your permissions changed. Please log in again.' });
        }

        // Attach live DB role (not just what's in the token)
        req.user = { id: decoded.id, name: user.name, email: user.email, role: user.role };
        next();
    } catch (err) {
        return res.status(500).json({ message: 'Authentication check failed.' });
    }
};

module.exports = { authenticate };
