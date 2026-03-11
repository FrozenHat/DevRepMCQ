import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

/**
 * Shared PostgreSQL connection pool.
 * Imported by services and routes as: import { db } from '../db/index.js'
 */
export const db = new Pool({
    connectionString: config.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

// Log and exit on unrecoverable pool errors
db.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
    process.exit(1);
});
