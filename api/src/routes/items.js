import { Router }      from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { db }          from '../db/index.js';

const router = Router();

// GET /api/items
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM items ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// POST /api/items
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { name, type = 'misc', description = '', icon = '' } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const { rows } = await db.query(
            `INSERT INTO items (name, type, description, icon)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, type, description, icon]
        );
        res.status(201).json(rows[0]);
    } catch (err) { next(err); }
});

// PATCH /api/items/:id
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { name, type, description, icon } = req.body;
        const { rows } = await db.query(
            `UPDATE items
             SET name=$1, type=$2, description=$3, icon=$4, updated_at=NOW()
             WHERE id=$5 RETURNING *`,
            [name, type, description, icon, req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Item not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// DELETE /api/items/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { rowCount } = await db.query(
            'DELETE FROM items WHERE id=$1', [req.params.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Item not found' });
        res.status(204).end();
    } catch (err) { next(err); }
});

export default router;
