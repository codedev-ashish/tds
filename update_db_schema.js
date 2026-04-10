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
    // Deductors
    "ALTER TABLE deductors ADD COLUMN deductor_code ENUM('D', 'C') DEFAULT 'D';",
    "ALTER TABLE deductors ADD COLUMN pan_reference_number VARCHAR(20);",

    // Challans
    "ALTER TABLE challans ADD COLUMN nil_challan ENUM('Y', 'N') DEFAULT 'N';",
    "ALTER TABLE challans ADD COLUMN tender_date DATE;",
    "ALTER TABLE challans ADD COLUMN nature_of_payment VARCHAR(10);",

    // Deductees
    "ALTER TABLE deductees ADD COLUMN deductee_status ENUM('O', 'A') DEFAULT 'O';",
    "ALTER TABLE deductees ADD COLUMN buyer_seller_flag ENUM('1', '2') DEFAULT '2';",

    // Validation Logs Table
    `CREATE TABLE IF NOT EXISTS csi_validation_logs (
        id VARCHAR(36) PRIMARY KEY,
        return_id VARCHAR(36) NOT NULL,
        status ENUM('success', 'failure') NOT NULL,
        file_name VARCHAR(255),
        total_challans INT DEFAULT 0,
        matched_challans INT DEFAULT 0,
        unmatched_challans INT DEFAULT 0,
        report_json JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (return_id) REFERENCES tds_returns(id) ON DELETE CASCADE,
        INDEX idx_return_id (return_id),
        INDEX idx_status (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;`
];

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    console.log('Applying schema updates...');

    let completed = 0;
    alterQueries.forEach(query => {
        db.query(query, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    console.error('Error executing:', query, err.message);
                }
            } else {
                console.log('Applied:', query);
            }
            completed++;
            if (completed === alterQueries.length) {
                console.log('All updates processed.');
                db.end();
            }
        });
    });
});
