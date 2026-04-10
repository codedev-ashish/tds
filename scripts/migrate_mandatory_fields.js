import 'dotenv/config';
import mysql from 'mysql2';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

const migrateQueries = [
    // Update existing NULL values to empty string or a placeholder if necessary
    // to avoid errors when applying NOT NULL constraint.
    // However, usually it's better to let them be empty strings.
    "UPDATE deductors SET branch = IFNULL(branch, ''), building = IFNULL(building, ''), street = IFNULL(street, ''), area = IFNULL(area, ''), rp_building = IFNULL(rp_building, ''), rp_street = IFNULL(rp_street, ''), rp_area = IFNULL(rp_area, ''), rp_phone = IFNULL(rp_phone, '');",

    // Apply NOT NULL constraints
    "ALTER TABLE deductors MODIFY COLUMN branch VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN building VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN street VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN area VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN rp_building VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN rp_street VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN rp_area VARCHAR(255) NOT NULL;",
    "ALTER TABLE deductors MODIFY COLUMN rp_phone VARCHAR(20) NOT NULL;"
];

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    console.log('Running migration...');

    let completed = 0;
    const runQuery = (index) => {
        if (index >= migrateQueries.length) {
            console.log('Migration complete.');
            db.end();
            return;
        }

        const q = migrateQueries[index];
        db.query(q, (err) => {
            if (err) {
                console.error('Error executing query:', q, err.message);
            } else {
                console.log('Success:', q.substring(0, 50) + '...');
            }
            runQuery(index + 1);
        });
    };

    runQuery(0);
});
