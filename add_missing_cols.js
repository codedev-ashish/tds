
import 'dotenv/config';
import mysql from 'mysql2';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

const alterQueries = [
    // Deductor Address Fields
    "ALTER TABLE deductors ADD COLUMN flat VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN building VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN road VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN area VARCHAR(50);",

    // RP Address Fields
    "ALTER TABLE deductors ADD COLUMN rp_flat VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN rp_building VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN rp_road VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN rp_area VARCHAR(50);",

    // Gov Fields
    "ALTER TABLE deductors ADD COLUMN gov_pao_code VARCHAR(20);",
    "ALTER TABLE deductors ADD COLUMN gov_pao_reg_no VARCHAR(20);",
    "ALTER TABLE deductors ADD COLUMN gov_ddo_code VARCHAR(20);",
    "ALTER TABLE deductors ADD COLUMN gov_ddo_reg_no VARCHAR(20);",
    "ALTER TABLE deductors ADD COLUMN gov_state VARCHAR(50);",
    "ALTER TABLE deductors ADD COLUMN gov_ministry VARCHAR(100);",
    "ALTER TABLE deductors ADD COLUMN gov_other_ministry VARCHAR(100);",
    "ALTER TABLE deductors ADD COLUMN gov_ain VARCHAR(20);"
];

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    console.log('Applying detailed schema updates...');

    let completed = 0;
    alterQueries.forEach(query => {
        db.query(query, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    // console.log('Column already exists.');
                } else {
                    console.error('Error executing query:', err.message);
                }
            } else {
                console.log('Applied update.');
            }
            completed++;
            if (completed === alterQueries.length) {
                console.log('Schema update complete.');
                db.end();
            }
        });
    });
});
