/**
 * Middleware factory: allow only specific roles to access a route.
 * Usage: router.get('/route', authenticate, allowRoles('fleet_manager', 'dispatcher'), handler)
 *
 * @param {...string} roles - Allowed role strings
 */
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
            });
        }
        next();
    };
};

module.exports = { allowRoles };
