import { Router }      from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { db }          from '../db/index.js';

const router = Router();

// GET /api/characters
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM characters ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// POST /api/characters
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { name, role = 'npc', description = '', sprite = '' } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const { rows } = await db.query(
            `INSERT INTO characters (name, role, description, sprite)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, role, description, sprite]
        );
        res.status(201).json(rows[0]);
    } catch (err) { next(err); }
});

// PATCH /api/characters/:id
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { name, role, description, sprite } = req.body;
        const { rows } = await db.query(
            `UPDATE characters
             SET name=$1, role=$2, description=$3, sprite=$4, updated_at=NOW()
             WHERE id=$5 RETURNING *`,
            [name, role, description, sprite, req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Character not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// DELETE /api/characters/:id
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { rowCount } = await db.query(
            'DELETE FROM characters WHERE id=$1', [req.params.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Character not found' });
        res.status(204).end();
    } catch (err) { next(err); }
});

export default router;
