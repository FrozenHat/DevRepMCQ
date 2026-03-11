import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as playerService from '../services/playerService.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/player/progress/:questId
// Returns this player's progress for the given quest, or 404 if none.
// ---------------------------------------------------------------------------

router.get('/progress/:questId', authenticate, async (req, res, next) => {
    try {
        const progress = await playerService.getProgress(
            req.user.userId,
            req.params.questId
        );

        if (!progress) {
            return res.status(404).json({ error: 'No progress found' });
        }

        res.json(progress);
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// POST /api/player/progress/:questId
// Upserts player progress (currentNodeId, context, status).
// ---------------------------------------------------------------------------

router.post('/progress/:questId', authenticate, async (req, res, next) => {
    try {
        const { currentNodeId, context, status } = req.body;

        if (!currentNodeId || !status) {
            return res.status(400).json({ error: 'currentNodeId and status are required' });
        }

        const progress = await playerService.saveProgress(
            req.user.userId,
            req.params.questId,
            currentNodeId,
            context ?? {},
            status
        );

        res.json(progress);
    } catch (err) {
        next(err);
    }
});

export default router;
