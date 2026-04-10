
import { CsiValidator } from '../services/csi_validator.js';
import crypto from 'crypto';

// Mock DB Driver
class MockDB {
    constructor(data) {
        this.data = data;
        this.queries = []; // Store executed queries for verification
    }
    query(sql, params, callback) {
        this.queries.push({ sql, params }); // Log the query

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
            // For INSERT/UPDATE/DELETE or unknown SELECTs
            callback(null, { affectedRows: 1, insertId: 1 });
        }
    }
}

// Test Data
const testData = {
    return: { id: 1, deductorId: 101, financialYear: '2024-2025', quarter: 'Q1', formNo: '24Q' },
    deductor: { id: 101, tan: 'MOCK12345T', name: 'MOCK COMPANY LTD' },
    challans: [
        { id: 1, deductor_id: 101, financial_year: '2024-2025', quarter: 'Q1', bsr_code: '0510308', date: '2024-05-05', serial_no: '12345', total: 1000.00, tax: 1000, surcharge: 0, cess: 0, interest: 0, fee: 0, others: 0 }
    ],
    deductions: [
        { challanId: 1, total: 1000.00 }
    ]
};

const validCsi = `
TAN: MOCK12345T
Name: MOCK COMPANY LTD
0510308 05-05-2024 1000.00 12345
`;

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
    const logFile = path.join(__dirname, 'logging_results.txt');
    const log = (msg) => {
        fs.appendFileSync(logFile, msg + '\n');
        process.stdout.write(msg + '\n');
    };

    // Clean log file
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    log('--- Starting Validation Logging Verification ---');

    // Mock crypto.randomUUID for consistent testing environment if needed, 
    // but CsiValidator uses crypto.randomUUID(), which is available in Node.
    // If running in older node without crypto.randomUUID:
    if (!crypto.randomUUID) {
        crypto.randomUUID = () => 'mock-uuid-' + Math.random();
    }

    const db = new MockDB(testData);
    const validator = new CsiValidator(db);

    try {
        log('\n--- Test: Valid CSI File (Checking Log Insertion) ---');
        const res = await validator.validate(1, validCsi);

        // Check if INSERT query was executed
        const insertLogQuery = db.queries.find(q => q.sql.includes('INSERT INTO csi_validation_logs'));

        if (insertLogQuery) {
            log('PASSED: Log insertion query detected.');
            log('Query SQL: ' + insertLogQuery.sql.trim());
            log('Query Params: ' + JSON.stringify(insertLogQuery.params));

            // Verify params
            const [id, returnId, status, total, matched, unmatched, reportJson] = insertLogQuery.params;

            if (returnId === 1 && status === 'success' && total === 1 && matched === 1 && unmatched === 0) {
                log('PASSED: Log parameters match expected values.');
            } else {
                log('FAILED: Log parameters mismatch.');
                log(`Expected: ReturnId=1, Status=success, Total=1, Matched=1, Unmatched=0`);
                log(`Actual: ReturnId=${returnId}, Status=${status}, Total=${total}, Matched=${matched}, Unmatched=${unmatched}`);
            }

            // Verify report JSON string
            try {
                const report = JSON.parse(reportJson);
                if (report.checks && report.checks.length > 0) {
                    log('PASSED: Report JSON contains checks.');
                } else {
                    log('FAILED: Report JSON missing checks.');
                }
            } catch (e) {
                log('FAILED: Report JSON is invalid JSON.');
            }

        } else {
            log('FAILED: No INSERT INTO csi_validation_logs query found.');
        }

    } catch (e) {
        log('Test Exception: ' + e);
        log(e.stack);
    }
}

runTests();
