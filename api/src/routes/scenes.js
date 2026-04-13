import { Router }      from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { db }          from '../db/index.js';
import multer          from 'multer';
import path            from 'path';
import { mkdirSync }   from 'fs';

// ─── Multer setup ─────────────────────────────────────────────────────────────

const uploadDir = path.join(process.cwd(), 'uploads', 'scenes');
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${req.params.key}_${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits:      { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter:  (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/scenes
// List all scenes (admin only — used by Scene Editor index).
// ---------------------------------------------------------------------------

router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { rows } = await db.query(
            'SELECT id, key, title, data, created_at, updated_at FROM scenes ORDER BY title ASC'
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// PUT /api/scenes/:key
// Create or update a scene (upsert). Used by the admin Scene Editor.
// Body: { title, data }  where data is the full navmesh/marker export JSON.
// ---------------------------------------------------------------------------

router.put('/:key', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
        const { title, data } = req.body;
        if (!title || !data) {
            return res.status(400).json({ error: 'title and data are required' });
        }

        const { rows } = await db.query(
            `INSERT INTO scenes (key, title, data)
             VALUES ($1, $2, $3)
             ON CONFLICT (key) DO UPDATE
             SET title = EXCLUDED.title,
                 data  = EXCLUDED.data
             RETURNING *`,
            [req.params.key, title, data]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// POST /api/scenes/:key/image
// Upload a background image for a scene. Returns { url }.
// ---------------------------------------------------------------------------

router.post('/:key/image', authenticate, requireRole('admin'), upload.single('image'), (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });
        const url = `/uploads/scenes/${req.file.filename}`;
        res.json({ url });
    } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// GET /api/scenes/:key
// Returns single scene config (background paths, spawn, zones, navmesh, etc.).
// Accessible to any authenticated user (game client uses this).
// ---------------------------------------------------------------------------

router.get('/:key', authenticate, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM scenes WHERE key = $1',
            [req.params.key]
        );

        if (!rows.length) {
            return res.status(404).json({ error: `Scene "${req.params.key}" not found` });
        }

        res.json(rows[0].data);
    } catch (err) { next(err); }
});

export default router;
