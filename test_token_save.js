import http from 'http';

// 1. Create a dummy return with a token number
const postData = JSON.stringify({
    deductorId: 'd1', // Assuming d1 exists, or we might need to fetch deductors first. 
    // Actually, let's just try to update the existing return found in previous step if possible, 
    // or create a new one if we can get a valid deductor ID.
    // Let's just fetch deductors first to be safe.
});

const getDeductors = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/deductors', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

const createReturn = (deductorId) => {
    const testToken = "TEST-TOKEN-12345";
    const payload = JSON.stringify({
        id: `test-return-${Date.now()}`, // New ID
        deductorId: deductorId,
        financialYear: "2024-2025",
        quarter: "Q1",
        formNo: "26Q",
        formType: "TDS Non-Salary",
        status: "Draft",
        type: "Regular",
        previousTokenNumber: testToken
    });

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/returns',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Create Response:', data);
                resolve({ id: JSON.parse(data).id, token: testToken });
            });
        });
        req.write(payload);
        req.end();
    });
};

const checkReturn = (id, expectedToken) => {
    http.get('http://localhost:3000/api/returns', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const returns = JSON.parse(data);
            const found = returns.find(r => r.id === id);
            if (found) {
                console.log(`Found Return: ${found.id}`);
                console.log(`Expected Token: "${expectedToken}"`);
                console.log(`Actual Token:   "${found.previousTokenNumber}"`);
                if (found.previousTokenNumber === expectedToken) {
                    console.log("SUCCESS: Token saved and retrieved correctly.");
                } else {
                    console.log("FAILURE: Token mismatch.");
                }
            } else {
                console.log("FAILURE: Return not found.");
            }
        });
    });
};

async function run() {
    try {
        const deductors = await getDeductors();
        if (deductors.length === 0) {
            console.log("No deductors found. Cannot test.");
            return;
        }
        const deductorId = deductors[0].id;
        const { id, token } = await createReturn(deductorId);
        // Wait a bit just in case
        setTimeout(() => checkReturn(id, token), 1000);
    } catch (e) {
        console.error("Test Error:", e);
    }
}

run();
