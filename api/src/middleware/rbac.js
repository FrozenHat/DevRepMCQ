/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.post('/publish', authenticate, requireRole('admin'), handler);
 *
 * @param {...string} roles  One or more allowed role strings.
 * @returns {Function}       Express middleware.
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
