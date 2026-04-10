import { TdsGenerator } from '../services/tds_generator.js';

// Mock DB/Data objects
const mockDb = {};
const generator = new TdsGenerator(mockDb);

const mockR = {
    financial_year: '2025-2026',
    form_no: '26Q',
    quarter: 'Q3',
    previous_token_number: '000000000012345'
};

const mockD = {
    tan: 'TAN1234567',
    pan: 'PAN1234567',
    name: 'TEST DEDUCTOR',
    email: 'TEST@EXAMPLE.COM',
    state: 'Maharashtra',
    responsible_person: 'TEST RESPONSIBLE',
    responsible_designation: 'PROPRIETOR',
    responsible_mobile: '9876543210',
    responsible_pan: 'RPPAN12345',
    rp_flat: '1',
    rp_building: 'EKAWASPATTI'
};

// Mock 3 Challans
const mockChallans = [
    { total: 1000 },
    { total: 2000 },
    { total: 500 }
];

// Expected Total TDS: 3500.00

console.log('Generating BH Record...');
const bh = generator.generateBH(2, mockR, mockD, mockChallans, []);

console.log('\n--- Generated BH Record (Snippet) ---');
const relevant = bh.substring(bh.indexOf('TEST@EXAMPLE.COM'));
console.log(relevant);

// Verification Logic based on user request
let valid = true;

function check(name, expectedSubstr) {
    if (bh.includes(expectedSubstr)) {
        console.log(`PASS: ${name}`);
    } else {
        console.log(`FAIL: ${name}. Expected substring "${expectedSubstr}" not found.`);
        valid = false;
    }
}

// 1. Email to N separator check
check('Email to N (3 separators)', 'TEST@EXAMPLE.COM^^^N');

// 2. N to Q separator check
check('N to Q (1 separator)', 'N^Q');

// 3. Mobile to N check
// Mobile: 9876543210
check('Mobile to N (3 separators)', '9876543210^^^N');

// 4. Total TDS to N check
// Total: 3500.00
check('Total TDS to N (4 separators)', '3500.00^^^^N');

// 5. N to Total TDS check
// User wants: ...N^^^TOTAL... (3 separators)
// Mock total is 3500.00
check('N to Total TDS (3 separators)', 'N^^^3500.00');

// 6. Y to PAN check
check('Y to PAN (7 separators)', 'Y^^^^^^^RPPAN12345');


console.log('\nOVERALL RESULT:', valid ? 'PASS' : 'FAIL');
