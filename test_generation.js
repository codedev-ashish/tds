import { TdsGenerator } from './services/tds_generator.js';
import mysql from 'mysql2/promise';
import fs from 'fs';

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'tds_pro'
    });

    try {
        const generator = new TdsGenerator(connection);
        
        // Test with a known return ID
        const [returns] = await connection.query('SELECT id FROM tds_returns LIMIT 1');
        if (returns.length === 0) {
            console.log('No returns found');
            return;
        }

        const returnId = returns[0].id;
        console.log('Testing with return ID:', returnId);

        const testPath = `generatedfile/test_${Date.now()}.txt`;
        
        try {
            await generator.generate(returnId, testPath);
            console.log('✅ File generated successfully at:', testPath);
            
            // Read and display first 2 lines
            const content = fs.readFileSync(testPath, 'utf8');
            const lines = content.split('\n');
            console.log('\nGenerated file preview:');
            console.log('FH Record:', lines[0].substring(0, 150) + '...');
            console.log('BH Record:', lines[1].substring(0, 200) + '...');
            
            // Check address change flag position
            const bhFields = lines[1].split('^');
            console.log('\nBH Field Count:', bhFields.length);
            console.log('Address Change Flag (should be Y or N):', bhFields[38]);
            
        } catch (genErr) {
            console.error('❌ Generation Error:', genErr.message);
        }

    } finally {
        await connection.end();
    }
}

test().catch(console.error);
