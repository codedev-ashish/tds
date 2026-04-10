
import mysql from 'mysql2';
import { PdfGenerator } from './services/pdf_generator.js';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function testPdfGen() {
    try {
        console.log("Starting PDF Generation Test...");

        // Find a return to test with
        const [returns] = await db.promise().query('SELECT id FROM tds_returns LIMIT 1');
        if (returns.length === 0) {
            console.error("No returns found in database. Please create a return first.");
            process.exit(1);
        }

        const returnId = returns[0].id;
        console.log(`Testing with Return ID: ${returnId}`);

        const testFilePath = path.join(process.cwd(), 'test_output.pdf');
        const generator = new PdfGenerator(db);

        await generator.generate(returnId, testFilePath);

        if (fs.existsSync(testFilePath)) {
            const stats = fs.statSync(testFilePath);
            console.log(`SUCCESS: PDF generated at ${testFilePath}`);
            console.log(`File size: ${stats.size} bytes`);
            // fs.unlinkSync(testFilePath); // Leave it for manual inspection if needed
        } else {
            console.error("FAILURE: PDF file was not created.");
        }

        process.exit(0);
    } catch (error) {
        console.error("TEST FAILED with error:", error);
        process.exit(1);
    }
}

testPdfGen();
