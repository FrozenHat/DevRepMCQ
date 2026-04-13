import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import { config }          from './config.js';
import { db }              from './db/index.js';
import { authenticate }    from './middleware/auth.js';
import authRoutes          from './routes/auth.js';
import questRoutes         from './routes/quests.js';
import sceneRoutes         from './routes/scenes.js';
import playerRoutes        from './routes/player.js';
import characterRoutes     from './routes/characters.js';
import itemRoutes          from './routes/items.js';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
    origin: config.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));

app.use(express.json());

// Serve uploaded scene images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/auth',       authRoutes);
app.use('/api/quests',     questRoutes);
app.use('/api/scenes',     sceneRoutes);
app.use('/api/player',     playerRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/items',      itemRoutes);

// ---------------------------------------------------------------------------
// GET /api/locations
// Returns all scenes formatted as [{id, name}] for use in the quest Action node.
// ---------------------------------------------------------------------------

app.get('/api/locations', authenticate, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            'SELECT key, title FROM scenes ORDER BY title ASC'
        );
        res.json(rows.map(r => ({ id: r.key, name: r.title })));
    } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', env: config.NODE_ENV });
});

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message ?? 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(config.PORT, () => {
    console.log(`API listening on http://localhost:${config.PORT}`);
});

export default app;
