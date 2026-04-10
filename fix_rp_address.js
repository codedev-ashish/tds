import 'dotenv/config';
import mysql from 'mysql2';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const sql = `
UPDATE deductors d
SET 
    rp_flat = COALESCE(d.rp_flat, d.flat, 'UNKNOWN'),
    rp_building = COALESCE(d.rp_building, d.building, 'NA'),
    rp_street = COALESCE(d.rp_street, d.street, 'NA'),
    rp_city = COALESCE(d.rp_city, d.city),
    rp_state = COALESCE(d.rp_state, d.state),
    rp_pincode = COALESCE(d.rp_pincode, d.pincode),
    rp_email = COALESCE(d.rp_email, d.email),
    rp_std = COALESCE(d.rp_std, d.std),
    rp_phone = COALESCE(d.rp_phone, d.phone)
WHERE d.rp_flat IS NULL 
   OR d.rp_city IS NULL 
   OR d.rp_state IS NULL 
   OR d.rp_pincode IS NULL;
`;

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    console.log('Connected to database. Executing RP address fix...');

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing fix:', err.message);
        } else {
            console.log('RP address fix applied successfully. Rows updated:', results.affectedRows);
        }
        db.end();
    });
});
