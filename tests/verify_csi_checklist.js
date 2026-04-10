
import { CsiValidator } from '../services/csi_validator.js';

// Mock DB Driver
class MockDB {
    constructor(data) {
        this.data = data;
    }
    query(sql, params, callback) {
        // Return dummy data based on query type
        if (sql.includes('SELECT * FROM tds_returns')) {
            callback(null, [this.data.return]);
        } else if (sql.includes('SELECT * FROM deductors')) {
            callback(null, [this.data.deductor]);
        } else if (sql.includes('SELECT * FROM challans')) {
            callback(null, this.data.challans);
        } else if (sql.includes('SELECT SUM(total_tax)')) {
            const challanId = params[0];
            const deduction = this.data.deductions.find(d => d.challanId === challanId);
            callback(null, [{ total: deduction ? deduction.total : 0 }]);
        } else {
            callback(null, []);
        }
    }
}

// Test Data
const testData = {
    return: { id: 1, deductorId: 101, financialYear: '2024-2025', quarter: 'Q1', formNo: '24Q' },
    deductor: { id: 101, tan: 'MOCK12345T', name: 'MOCK COMPANY LTD' },
    challans: [
        { id: 1, deductor_id: 101, financial_year: '2024-2025', quarter: 'Q1', bsr_code: '0510308', date: '2024-05-05', serial_no: '12345', total: 1000.00, tax: 1000, surcharge: 0, cess: 0, interest: 0, fee: 0, others: 0 },
        { id: 2, deductor_id: 101, financial_year: '2024-2025', quarter: 'Q1', bsr_code: '0510308', date: '2024-06-05', serial_no: '67890', total: 2000.50, tax: 2000.50, surcharge: 0, cess: 0, interest: 0, fee: 0, others: 0 }
    ],
    deductions: [
        { challanId: 1, total: 1000.00 },
        { challanId: 2, total: 2000.50 }
    ]
};

// CSI Content Samples
const validCsi = `
Generic Header Line
TAN: MOCK12345T
Name: MOCK COMPANY LTD
----------------------
0510308 05-05-2024 1000.00 12345
0510308 05/06/2024 2000.50 67890
Footer Line
`;

const invalidAmountCsi = `
TAN: MOCK12345T
Name: MOCK COMPANY LTD
0510308 05-05-2024 999.00 12345
`;

const invalidTanCsi = `
TAN: WRONG12345T
Name: MOCK COMPANY LTD
0510308 05-05-2024 1000.00 12345
`;

const invalidNameCsi = `
TAN: MOCK12345T
Name: WRONG NAME LTD
0510308 05-05-2024 1000.00 12345
`;

const dateFormatsCsi = `
TAN: MOCK12345T
Name: MOCK COMPANY LTD
0510308 05-MAY-24 1000.00 12345
`;

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
    const logFile = path.join(__dirname, 'results.txt');
    const log = (msg) => {
        fs.appendFileSync(logFile, msg + '\n');
        process.stdout.write(msg + '\n');
    };

    // Clean log file
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    log('--- Starting CSI Validation Verification ---');
    log(`Time: ${new Date().toISOString()}`);

    const db = new MockDB(testData);
    const validator = new CsiValidator(db);

    // Test 1: Full Valid
    try {
        log('\n--- Test 1: Valid CSI File ---');
        const res = await validator.validate(1, validCsi);
        log(`Result: ${res.isValid ? 'PASSED' : 'FAILED'}`);
        if (!res.isValid) {
            log('Errors: ' + JSON.stringify(res.errors));
            // Debug parsing
            const parsed = validator.parseCsiFile(validCsi);
            log('Parsed Data: ' + JSON.stringify(parsed));
        }
        log('Checks: ' + JSON.stringify(res.checks));
    } catch (e) {
        log('Test 1 Exception: ' + e);
        log(e.stack);
    }

    // Test 2: Invalid Amount
    try {
        log('\n--- Test 2: Invalid Amount ---');
        const res = await validator.validate(1, invalidAmountCsi);
        log(`Result: ${!res.isValid ? 'PASSED (Correctly Failed)' : 'FAILED (Unexpected Pass)'}`);
        if (!res.isValid) log('Errors: ' + JSON.stringify(res.errors));
    } catch (e) { log(e); }

    // Test 3: Invalid TAN
    try {
        log('\n--- Test 3: Invalid TAN ---');
        const res = await validator.validate(1, invalidTanCsi);
        const warnings = res.warnings.filter(w => w.includes('TAN Mismatch') || w.includes('TAN'));
        log(`Result: ${warnings.length > 0 ? 'PASSED (Warning Found)' : 'FAILED (No Warning)'}`);
        log('Warnings: ' + JSON.stringify(res.warnings));
    } catch (e) { log(e); }

    // Test 4: Invalid Name
    try {
        log('\n--- Test 4: Invalid Name ---');
        const res = await validator.validate(1, invalidNameCsi);
        const warnings = res.warnings.filter(w => w.includes('Name Warning') || w.includes('Deductor Name'));
        log(`Result: ${warnings.length > 0 ? 'PASSED (Warning Found)' : 'FAILED (No Warning)'}`);
        log('Warnings: ' + JSON.stringify(res.warnings));
    } catch (e) { log(e); }

    // Test 5: Date Formats (05-MAY-24)
    try {
        log('\n--- Test 5: Date Formats (05-MAY-24) ---');
        const res = await validator.validate(1, dateFormatsCsi);
        // Should match challan 1 (1000.00 on 05-05-2024)
        // Note: Matched count in stats
        const matched = res.stats.matched === 1;
        log(`Result: ${matched ? 'PASSED' : 'FAILED'}`);
        if (!matched) {
            log('Errors: ' + JSON.stringify(res.errors));
            const parsed = validator.parseCsiFile(dateFormatsCsi);
            log('Parsed Data: ' + JSON.stringify(parsed));
        }
    } catch (e) { log(e); }
}

runTests();
