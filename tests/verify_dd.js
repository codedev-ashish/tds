import { TdsGenerator } from '../services/tds_generator.js';

const mockDb = { query: (cb) => cb(null, []) };
const generator = new TdsGenerator(mockDb);

const deduction = {
    id: 'ded1',
    deductee_id: 'd1',
    section: '194Q',
    payment_date: '2025-10-30',
    deducted_date: '2025-10-30',
    amount_of_payment: 10096.00, // Exact amount requested
    rate: 0.1,
    total_tax: 100.00,
    tax_deposited: 100.00,
    surcharge: 0.00,
    cess: 0.00,
};

const deductee = {
    pan: 'AXFPJ5192A',
    name: 'ASHISH KUMAR JAISWAL',
    deductee_status: 'O',
    buyer_seller_flag: '2'
};

const line = generator.generateDD(4, deduction, deductee, 1, 1);
console.log(line);

const parts = line.split('^');

// Check Amount (Index 21)
const amount = parts[21];
console.log(`Amount (Index 21): ${amount}`);

// Check Rate (Index 25)
const rate = parts[25];
console.log(`Rate (Index 25): ${rate}`);

// Check Section (Index 32) (194Q -> 94Q)
const section = parts[32];
console.log(`Section (Index 32): ${section}`);

// Separator Checks
// Rate (25) to Section (32) => 7 separations (indices 26-31 should be empty)
const gap1 = parts.slice(26, 32);
console.log(`Gap Rate-Section (size ${gap1.length}):`, gap1);

// After Section => 21 separations (indices 33-53 match empty)
const gap2 = parts.slice(33);
console.log(`Trailing gap size: ${gap2.length} (Expected 21)`);

if (amount === '10096.00' && gap1.length === 6 && gap2.length === 21) {
    console.log('SUCCESS: Amount matched and separator counts verified.');
} else {
    console.log('FAILURE: Mismatch detected.');
}
