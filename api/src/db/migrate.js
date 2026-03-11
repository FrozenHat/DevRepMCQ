/**
 * Database migration runner.
 * Applies SQL files from src/db/migrations/ in order.
 *
 * Run with: npm run db:migrate
 */

import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

async function run() {
    // Ensure migrations tracking table exists
    await db.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id      SERIAL PRIMARY KEY,
            name    VARCHAR(255) UNIQUE NOT NULL,
            run_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const files = (await readdir(migrationsDir))
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const existing = await db.query(
            'SELECT id FROM _migrations WHERE name = $1',
            [file]
        );

        if (existing.rows.length > 0) {
            console.log(`  skip  ${file}`);
            continue;
        }

        const sql = await readFile(join(migrationsDir, file), 'utf-8');

        await db.query('BEGIN');
        try {
            await db.query(sql);
            await db.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
            await db.query('COMMIT');
            console.log(`  apply ${file}`);
        } catch (err) {
            await db.query('ROLLBACK');
            console.error(`  ERROR ${file}:`, err.message);
            process.exit(1);
        }
    }

    await db.end();
    console.log('Migrations complete.');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
