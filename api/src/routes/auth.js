import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/index.js';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// Returns: { accessToken, role }
// ---------------------------------------------------------------------------

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const result = await db.query(
            'SELECT id, password_hash, role FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { sub: user.id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: config.JWT_ACCESS_EXPIRES }
        );

        res.json({ accessToken, role: user.role });
    } catch (err) {
        next(err);
    }
});

export default router;
