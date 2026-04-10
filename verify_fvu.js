import http from 'http';

// 1. First we need a valid Return ID to test with.
// We'll just try a hardcoded one or try to fetch list first.
// Actually, let's just fetch the list of returns first.

const getReturns = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/returns', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const checkFvuEndpoint = (id) => {
    console.log(`Checking FVU endpoint for ID: ${id}`);
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000/api/returns/${id}/fvu`, (res) => {
            console.log(`Status Code: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('Success: Endpoint is active.');
                resolve(true);
            } else if (res.statusCode === 404) {
                console.log('Error: Endpoint returned 404. Server likely NOT restarted.');
                resolve(false);
            } else {
                console.log('Error: Unexpected status code.');
                resolve(false);
            }
        }).on('error', (e) => {
            console.error('Request failed:', e.message);
            resolve(false);
        });
    });
};

async function run() {
    try {
        console.log("Fetching returns...");
        const returns = await getReturns();
        if (returns.length === 0) {
            console.log("No returns found to test with.");
            return;
        }

        const testId = returns[0].id;
        await checkFvuEndpoint(testId);

    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

run();
