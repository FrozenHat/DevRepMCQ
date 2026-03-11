import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/scenes/:key
// Returns scene configuration (background asset paths, spawn, zones, etc.).
// Accessible to any authenticated user.
// ---------------------------------------------------------------------------

router.get('/:key', authenticate, async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM scenes WHERE key = $1',
            [req.params.key]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: `Scene "${req.params.key}" not found` });
        }

        // The config JSON is stored in the 'data' JSONB column
        res.json(result.rows[0].data);
    } catch (err) {
        next(err);
    }
});

export default router;
