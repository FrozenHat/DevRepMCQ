import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { config } from './config.js';
import authRoutes from './routes/auth.js';
import questRoutes from './routes/quests.js';
import sceneRoutes from './routes/scenes.js';
import playerRoutes from './routes/player.js';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
    origin: config.NODE_ENV === 'production'
        ? false          // Nginx handles CORS in production
        : 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/auth',   authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/player', playerRoutes);

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
