import 'dotenv/config';
import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true // Enable multiple statements for schema execution
});

const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    console.log('Connected to database. Executing schema...');

    db.query(schemaSql, (err, results) => {
        if (err) {
            console.error('Error executing schema:', err.message);
        } else {
            console.log('Schema executed successfully.');
        }
        db.end();
    });
});
