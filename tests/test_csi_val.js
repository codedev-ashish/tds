import http from 'http';

const getReturn = () => {
    return new Promise((resolve) => {
        http.get('http://localhost:3000/api/returns', (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });
};

const getChallans = () => {
    return new Promise((resolve) => {
        http.get('http://localhost:3000/api/challans', (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });
}

const validate = (returnId, content) => {
    return new Promise((resolve, reject) => {
        const req = http.request(`http://localhost:3000/api/returns/${returnId}/validate-csi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    // console.log('Raw response:', data);
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    console.log('Raw Data was:', data);
                    resolve({ isValid: false, errors: ['Server returned non-JSON response'] });
                }
            });
        });

        req.write(JSON.stringify({ csiContent: content }));
        req.end();
    });
};

async function run() {
    try {
        const returns = await getReturn();
        if (returns.length === 0) {
            console.log("No returns found");
            return;
        }

        const r = returns[0];
        console.log(`Testing with Return ID: ${r.id}`);

        const allChallans = await getChallans();
        const myChallans = allChallans.filter(c => c.deductorId === r.deductorId && c.quarter === r.quarter);

        if (myChallans.length === 0) {
            console.log("No challans for this return to test with.");
            return;
        }

        const challan = myChallans[0];
        console.log(`Testing against Challan Amount: ${challan.total}`);

        // 1. Valid CSI Content
        const validContent = `
            State Bank of India
            Cindy | 05-05-2025 | ${Number(challan.total).toFixed(2)} | BSR12345
        `;

        console.log("Testing matching content...");
        const res1 = await validate(r.id, validContent);
        console.log("Result 1 (Should be Valid):", res1.isValid ? 'PASS' : 'FAIL');
        if (!res1.isValid) console.log(res1.errors);

        // 2. Invalid CSI Content
        const invalidContent = `
            State Bank of India
            Cindy | 05-05-2025 | 999999.00 | BSR12345
        `;

        console.log("Testing mismatch content...");
        const res2 = await validate(r.id, invalidContent);
        console.log("Result 2 (Should be Invalid):", !res2.isValid ? 'PASS' : 'FAIL');

        // 3. Comma Separated Content (The Issue)
        // Format amount with commas
        const amountC = Number(challan.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const commaContent = `
            State Bank of India
            Cindy | 05-05-2025 | ${amountC} | BSR12345
        `;

        console.log(`Testing comma separated content: ${amountC}`);
        const res3 = await validate(r.id, commaContent);

        // We expect validation to fail overall because other challans are missing
        // BUT we expect the SPECIFIC challan (amountC) to be FOUND (i.e. NOT in errors list)

        const specificError = res3.errors.find(e => e.includes(`Amount ₹${Number(challan.total).toFixed(2)}`));

        if (!specificError) {
            console.log("VERIFICATION PASS: Comma-separated amount was correctly identified!");
        } else {
            console.log("VERIFICATION FAIL: Challan was still marked as missing.");
            console.log("Error found:", specificError);
        }

    } catch (e) {
        console.error(e);
    }
}

run();
