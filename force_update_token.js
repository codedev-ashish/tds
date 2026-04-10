import http from 'http';

// Helper to execute SQL via a temporary route or direct DB connection?
// Since I don't have direct DB access from here (only via `run_command` and existing scripts), 
// I'll reuse `check_returns.js` approach but modify it to UPDATE.
// Wait, `check_returns.js` reads. `init_db.js` writes schema.

// I'll create a standalone script `force_update_token.js` that connects to DB.
// I need `mysql2` which is installed.

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tds_pro_assistant'
        });

        console.log('Connected to database.');

        // Get the first return
        const [rows] = await connection.execute('SELECT id FROM tds_returns LIMIT 1');
        if (rows.length === 0) {
            console.log('No returns found.');
            await connection.end();
            return;
        }

        const id = rows[0].id;
        console.log(`Updating return ${id}...`);

        await connection.execute('UPDATE tds_returns SET previous_token_number = ? WHERE id = ?', ['DEBUG_12345', id]);
        console.log('Update successful. previous_token_number set to "DEBUG_12345".');

        await connection.end();

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
