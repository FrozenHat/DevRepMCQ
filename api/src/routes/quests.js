import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as questService from '../services/questService.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/quests/:slug/published
// Returns the latest published version of a quest graph.
// Accessible to any authenticated user.
// ---------------------------------------------------------------------------

router.get('/:slug/published', authenticate, async (req, res, next) => {
    try {
        const quest = await questService.getPublishedQuest(req.params.slug);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found or not published' });
        }
        res.json(quest);
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// Admin routes (role: admin)
// ---------------------------------------------------------------------------

// GET /api/quests  — list all quests with their latest version status
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const quests = await questService.listQuests();
        res.json(quests);
    } catch (err) {
        next(err);
    }
});

// POST /api/quests  — create a new quest (returns first draft)
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { title, slug } = req.body;
        if (!title || !slug) {
            return res.status(400).json({ error: 'title and slug are required' });
        }
        const quest = await questService.createQuest(req.user.userId, title, slug);
        res.status(201).json(quest);
    } catch (err) {
        next(err);
    }
});

// GET /api/quests/:id/versions  — list all versions of a quest
router.get('/:id/versions', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const versions = await questService.getQuestVersions(req.params.id);
        res.json(versions);
    } catch (err) {
        next(err);
    }
});

// PUT /api/quests/:id/draft  — save draft (creates new version row or updates current draft)
router.put('/:id/draft', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'data is required' });
        }
        const version = await questService.saveDraft(req.params.id, req.user.userId, data);
        res.json(version);
    } catch (err) {
        next(err);
    }
});

// POST /api/quests/:id/publish  — publish the current draft
router.post('/:id/publish', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { versionId } = req.body;
        const version = await questService.publishVersion(req.params.id, versionId);
        res.json(version);
    } catch (err) {
        next(err);
    }
});

export default router;
