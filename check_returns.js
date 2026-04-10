import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [returns] = await connection.execute('SELECT * FROM tds_returns');
        console.log('--- TDS Returns ---');
        console.table(returns);

        const [challans] = await connection.execute('SELECT * FROM challans');
        console.log('\n--- Challans ---');
        console.table(challans);

        const [deductions] = await connection.execute('SELECT * FROM deduction_entries');
        console.log('\n--- Deductions ---');
        console.table(deductions);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
