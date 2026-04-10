const { PdfGenerator } = require('./services/pdf_generator');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

async function testPdf() {
    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'tds_pro'
    });

    const generator = new PdfGenerator(db);
    const returnId = '97b00e39'; // Use a known return ID from previous logs
    const outputDir = path.join(__dirname, 'generatedfile');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputPath = path.join(outputDir, 'test_premium.pdf');

    console.log('Generating premium PDF...');
    try {
        await generator.generate(returnId, outputPath);
        console.log('PDF generated successfully at:', outputPath);
    } catch (err) {
        console.error('PDF generation failed:', err);
    } finally {
        db.end();
    }
}

testPdf();
