
import mysql from 'mysql2';
import 'dotenv/config';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function debugData() {
    const q = (sql, params) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, res) => {
                if (err) {
                    console.error("Query Error:", sql, params);
                    reject(err);
                }
                else resolve(res);
            });
        });
    };

    try {
        console.log("Checking tables...");
        const tables = await q('SHOW TABLES');
        console.log("Tables:", JSON.stringify(tables, null, 2));

        const [returns] = await db.promise().query('SELECT * FROM tds_returns LIMIT 1');
        if (returns.length === 0) throw new Error("No returns");
        const r = returns[0];
        console.log("Return found:", r.id);

        console.log("Fetching deductor...");
        const deductor = await q('SELECT * FROM deductors WHERE id = ?', [r.deductor_id]);
        console.log("Deductor:", deductor.length > 0 ? "Found" : "NOT FOUND");

        console.log("Fetching challans...");
        const challans = await q('SELECT * FROM challans WHERE deductor_id = ? AND financial_year = ? AND quarter = ?', [r.deductor_id, r.financial_year, r.quarter]);
        console.log("Challans count:", challans.length);

        if (challans.length > 0) {
            const challanIds = challans.map(c => c.id);
            console.log("Fetching deductions for IDs:", challanIds);
            const deductions = await q('SELECT * FROM deduction_entries WHERE challan_id IN (?)', [challanIds]);
            console.log("Deductions count:", deductions.length);
        }

        console.log("Done debugging.");
        process.exit(0);
    } catch (err) {
        console.error("DEBUG FAILED:", err);
        process.exit(1);
    }
}

debugData();
