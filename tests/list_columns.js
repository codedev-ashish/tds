import 'dotenv/config';
import mysql from 'mysql2';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    db.query('SHOW COLUMNS FROM deductors', (err, results) => {
        if (err) console.error(err);
        else {
            results.forEach(r => console.log(r.Field));
        }
        db.end();
    });
});
