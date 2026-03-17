/**
 * Admin user setup script
 * Creates or updates an admin user in the database
 *
 * Usage: npm run admin:create -- --email admin@example.com --password mypassword
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index.js';

async function createAdmin(email, password) {
    if (!email || !password) {
        console.error('Usage: npm run admin:create -- --email <email> --password <password>');
        process.exit(1);
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (email, password_hash, role)
             VALUES ($1, $2, 'admin')
             ON CONFLICT (email) DO UPDATE SET password_hash = $2
             RETURNING id, email, role`,
            [email.toLowerCase(), passwordHash]
        );

        const user = result.rows[0];
        console.log(`✓ Admin user created/updated:`);
        console.log(`  ID:    ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role:  ${user.role}`);

        await db.end();
    } catch (err) {
        console.error('Error creating admin:', err.message);
        process.exit(1);
    }
}

// Parse CLI args
const args = process.argv.slice(2);
let email = '';
let password = '';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
        email = args[i + 1];
    }
    if (args[i] === '--password' && args[i + 1]) {
        password = args[i + 1];
    }
}

createAdmin(email, password);
