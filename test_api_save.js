
import fetch from 'node-fetch';

async function run() {
    const deductor = {
        id: 'debug_persistence_id',
        userId: 'test_user',
        tan: 'TEST000001',
        pan: 'ABCDE1234F',
        name: 'PERSISTENCE TEST',
        type: 'Individual',
        email: 'debug@test.com',
        mobile: '9999999999',
        phone: '9999999999',
        address: 'Test Address',
        city: 'Test City',
        state: '31',
        pincode: '110001',
        responsiblePerson: 'Test Responsible',
        responsibleDesignation: 'Manager',
        responsiblePan: 'ABCDE1234F',
        responsibleMobile: '9999999999',
    };

    try {
        // 1. Create User
        console.log("Creating Test User...");
        const userRes = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 'test_user',
                name: 'Test Persistent User',
                email: 'debug@test.com',
                role: 'User',
                status: 'Active',
                plan: 'Free'
            })
        });
        console.log(`User Create Status: ${userRes.status}`);

        // 2. Create Deductor
        console.log("Sending POST to /api/deductors...");
        const res = await fetch('http://localhost:5000/api/deductors', {
            method: 'POST',

            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deductor)
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', data);

        if (res.ok) {
            console.log("Data submitted successfully.");
            // Verify by fetching
            console.log("Fetching /api/deductors...");
            const getRes = await fetch('http://localhost:5000/api/deductors');
            const list = await getRes.json();
            const found = list.find(d => d.id === deductor.id);
            if (found) {
                console.log("SUCCESS: Data verified in DB.");
            } else {
                console.error("FAILURE: Data not found in GET response.");
            }
        } else {
            console.error("FAILURE: POST returned error.");
        }

    } catch (e) {
        console.error("Error connecting to server:", e.message);
    }
}

run();
