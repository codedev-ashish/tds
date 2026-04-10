import http from 'http';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Connect directly to DB to verify persistence
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const createDeductor = () => {
    return new Promise((resolve, reject) => {
        const id = 'VERIFY_STREET_' + Date.now();
        const data = JSON.stringify({
            id: id,
            name: 'Street Verification Deductor',
            tan: 'STREET001T',
            pan: 'STREET001P',
            type: 'Company',
            // Send legacy 'road' field which should be mapped to 'street'
            road: 'Verified Street Name',
            city: 'Test City',
            state: 'Delhi',
            pincode: '110001',
            phone: '9999999999',
            email: 'verify@example.com',
            responsiblePerson: 'Verifier',
            responsibleDesignation: 'Tester',
            responsiblePan: 'VERIF1234P',
            rpRoad: 'Verified RP Street', // Should map to rp_street
            userId: 'admin' // Mock user ID
        });

        const req = http.request('http://localhost:3002/api/deductors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`API Status: ${res.statusCode}`);
                resolve(id);
            });
        });

        req.on('error', (e) => {
            console.error('API Request error:', e);
            reject(e);
        });

        req.write(data);
        req.end();
    });
};

const verifyDb = async (id) => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM deductors WHERE id = ?', [id]);
    await conn.end();

    if (rows.length === 0) {
        console.log('FAIL: Deductor not found in DB');
        return;
    }

    const d = rows[0];
    console.log(`DB Verification for ID: ${id}`);

    // Check Company Street
    console.log(`Column 'street': '${d.street}'`);
    if (d.street === 'Verified Street Name') {
        console.log('PASS: Company Street column verified.');
    } else {
        console.log('FAIL: Company Street column mismatch.');
    }

    // Check Responsible Person Street
    console.log(`Column 'rp_street': '${d.rp_street}'`);
    if (d.rp_street === 'Verified RP Street') {
        console.log('PASS: RP Street column verified.');
    } else {
        console.log('FAIL: RP Street column mismatch.');
    }
};

const run = async () => {
    try {
        console.log('Creating deductor via API (port 3002)...');
        const id = await createDeductor();
        await verifyDb(id);
    } catch (e) {
        console.error(e);
    }
};

run();
