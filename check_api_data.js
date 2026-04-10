import http from 'http';

http.get('http://localhost:3000/api/returns', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const returns = JSON.parse(data);
            console.log('Total Returns:', returns.length);
            returns.forEach(r => {
                console.log(`ID: ${r.id}, Form: ${r.formNo}, Token: "${r.previousTokenNumber}" (${typeof r.previousTokenNumber})`);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Request failed:', err.message);
});
