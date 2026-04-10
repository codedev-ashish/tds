import http from 'http';

const createDeductor = () => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            id: 'TEST_DED_' + Date.now(),
            name: 'Test Deductor',
            tan: 'TEST12345T',
            pan: 'TEST12345P',
            type: 'Company', // "Company" in frontend -> "Company" in DB enum? DB Enum: 'Individual', 'Company', 'Partnership', 'Government'. Case matches.
            flat: '101',
            building: 'Tower A',
            road: 'MG Road', // This should fail if column is 'street'
            area: 'Sector 1',
            city: 'Test City',
            state: 'Delhi',
            pincode: '110001',
            phone: '9999999999',
            email: 'test@example.com',
            responsiblePerson: 'Test Person',
            responsibleDesignation: 'Director',
            responsiblePan: 'RESP12345P',
            responsibleMobile: '8888888888',
            // RP Address
            rpFlat: '202',
            rpRoad: 'RP Road' // This should fail if column is 'rp_street'
        });

        const req = http.request('http://localhost:3000/api/deductors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log('Response:', body);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            resolve();
        });

        req.write(data);
        req.end();
    });
};

createDeductor();
