import { TdsGenerator } from '../services/tds_generator.js';

const mockDb = { query: (sql, cb) => cb(null, []) };
const generator = new TdsGenerator(mockDb);

const r = {
    previous_token_number: '770000348396204',
    financial_year: '2025-2026',
    quarter: 'Q3',
    form_no: '26Q'
};

const d = {
    tan: 'ALDD03200B',
    pan: 'ARPPJ1400R',
    name: 'DEEPAK KUMAR JAISWAL',
    branch: 'N/A',
    flat: '1',
    building: '',
    road: 'BHITARI TARAF SADUR',
    area: '',
    city: 'VARANASI', // Assuming town based on pin
    state: 'Uttar Pradesh', // 31
    pincode: '233304',
    email: 'SHIVAMJAISWAL1010@GMAIL.COM',

    responsible_person: 'DEEPAK KUMAR JAISWAL',
    responsible_designation: 'PROPRIETOR',
    rp_state: 'Uttar Pradesh',

    responsible_mobile: '7754893600',
    responsible_pan: 'ARPPJ1400R'
};

const challans = [];
const deductions = [{ total_tax: 23985.00 }]; // Mock total TDS

// Output BH
const bh = generator.generateBH(2, r, d, challans, deductions);
console.log(bh);

// Verify specific sequence around Email -> N -> Q
// ...SHIVAMJAISWAL1010@GMAIL.COM^^^^N^Q^DEEPAK...
// Split by ^
const parts = bh.split('^');

// Helper to find index of a value
const emailIndex = parts.indexOf('SHIVAMJAISWAL1010@GMAIL.COM');
console.log(`Email Index: ${emailIndex}`);

if (emailIndex !== -1) {
    // Check subsequent fields
    // Email is at index N. 
    // N+1: ''
    // N+2: ''
    // N+3: ''
    // N+4: 'N'
    // N+5: ''
    // N+6: 'Q'
    // N+7: Responsible Person Name

    console.log(`Email+1: '${parts[emailIndex + 1]}' (Expected '')`);
    console.log(`Email+2: '${parts[emailIndex + 2]}' (Expected '')`);
    console.log(`Email+3: '${parts[emailIndex + 3]}' (Expected '')`);
    console.log(`Email+4: '${parts[emailIndex + 4]}' (Expected 'N')`);
    console.log(`Email+5: '${parts[emailIndex + 5]}' (Expected '')`);
    console.log(`Email+6: '${parts[emailIndex + 6]}' (Expected 'Q')`);
    console.log(`Email+7: '${parts[emailIndex + 7]}' (Expected '${d.responsible_person}')`);
}

// Check Mobile -> N -> Total TDS
const mobileIndex = parts.indexOf('7754893600');
console.log(`Mobile Index: ${mobileIndex}`);

if (mobileIndex !== -1) {
    // Mobile at M
    // M+1: ''
    // M+2: ''
    // M+3: ''
    // M+4: 'N'
    // M+5: Total TDS
    // M+6: ''
    // M+7: ''
    // M+8: ''
    // M+9: ''
    // M+10: 'N' (Address change)
    // M+11: ''
    // M+12: 'Y' (Valid)

    console.log(`Mobile+4: '${parts[mobileIndex + 4]}' (Expected 'N')`);
    console.log(`Mobile+5: '${parts[mobileIndex + 5]}' (Expected '23985.00')`);
    console.log(`Mobile+10: '${parts[mobileIndex + 10]}' (Expected 'N')`);
    console.log(`Mobile+12: '${parts[mobileIndex + 12]}' (Expected 'Y')`);

    // Check separators after Y
    // Y at K
    // K+1 - K+7: ''
    // K+8: RP PAN

    const yIndex = mobileIndex + 12;
    console.log(`Y Index: ${yIndex}, Value: '${parts[yIndex]}'`);

    console.log(`Y+8: '${parts[yIndex + 8]}' (Expected '${d.responsible_pan}')`);

    // Check trailing separators
    // RP PAN at P
    // P+1 - P+13: ''
    // Total parts check
    const panIndex = yIndex + 8;
    const trailingStart = panIndex + 1;
    const trailingEnd = parts.length; // slice is exclusive end
    const trailing = parts.slice(trailingStart);
    console.log(`Trailing separators count: ${trailing.length} (Expected 13)`);
}
