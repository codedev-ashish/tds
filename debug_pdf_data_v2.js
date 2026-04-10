
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
                if (err) reject(err);
                else resolve(res);
            });
        });
    };

    try {
        console.log("--- START DEBUG ---");
        const returns = await q('SELECT * FROM tds_returns LIMIT 1');
        const r = returns[0];
        console.log("Return ID:", r.id);

        console.log("Querying deductor...");
        const d = await q('SELECT * FROM deductors WHERE id = ?', [r.deductor_id]);
        console.log("Deductor count:", d.length);

        console.log("Querying challans...");
        const c = await q('SELECT * FROM challans WHERE deductor_id = ? AND financial_year = ? AND quarter = ?', [r.deductor_id, r.financial_year, r.quarter]);
        console.log("Challans count:", c.length);

        if (c.length > 0) {
            const ids = c.map(ch => ch.id);
            console.log("Querying deductions for IDs:", ids);
            const deds = await q('SELECT * FROM deduction_entries WHERE challan_id IN (?)', [ids]);
            console.log("Deductions count:", deds.length);

            if (deds.length > 0) {
                const dedtIds = [...new Set(deds.map(de => de.deductee_id))];
                console.log("Querying deductees for IDs:", dedtIds);
                const dedts = await q('SELECT * FROM deductees WHERE id IN (?)', [dedtIds]);
                console.log("Deductees count:", dedts.length);
            }
        }

        console.log("--- END DEBUG: ALL DATA FETCHED SUCCESS ---");
        process.exit(0);
    } catch (err) {
        console.log("--- DEBUG FAILED ---");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
        process.exit(1);
    }
}

debugData();
