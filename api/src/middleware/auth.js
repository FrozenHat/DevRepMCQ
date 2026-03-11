import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Verifies the JWT from the Authorization header.
 * On success, attaches { userId, role } to req.user.
 * On failure, returns 401.
 */
export function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = header.slice(7);

    try {
        const payload = jwt.verify(token, config.JWT_SECRET);
        req.user = { userId: payload.sub, role: payload.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}
