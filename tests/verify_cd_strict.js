import { TdsGenerator } from '../services/tds_generator.js';

const mockDb = { query: (cb) => cb(null, []) };
const generator = new TdsGenerator(mockDb);

const challan = {
    id: 'c1',
    deductor_id: 'd1',
    bsr_code: 'BSR1234',
    date: '2025-11-07',
    serial_no: 'SER5678',
    tds: 100.00,
    surcharge: 0.00,
    education_cess: 0.00,
    interest: 0.00,
    fee: 0.00,
    others: 0.00,
    total: 100.00,
    minor_head: '200',
    nil_challan: 'N'
};

const line = generator.generateCD(3, challan, 1, 1);
console.log(line);

const parts = line.split('^');

// Expected:
// 5: N
// 11: Serial (N + 6 separators => 5 empty fields. 5+1+5 = 11? N is 5. 5+1(sep) = 6. 6+5(gap) = 11? No.)
// 5: N.
// 6: ''
// 7: ''
// 8: ''
// 9: ''
// 10: ''
// 11: Serial
// Separation check:
// N to Serial: ^ (5->6), ^ (6->7), ^ (7->8), ^ (8->9), ^ (9->10), ^ (10->11). 6 carets. Correct.

// 11: Serial
// 12: ''
// 13: ''
// 14: ''
// 15: BSR
// Separation check:
// Serial to BSR: ^ (11->12), ^ (12->13), ^ (13->14), ^ (14->15). 4 carets. Correct.

// 15: BSR
// 16: ''
// 17: Date
// Separation check:
// BSR to Date: ^ (15->16), ^ (16->17). 2 carets. Correct.

console.log(`Index 5 (N): ${parts[5]}`);
console.log(`Index 11 (Serial): ${parts[11]}`);
console.log(`Index 15 (BSR): ${parts[15]}`);
console.log(`Index 17 (Date): ${parts[17]}`);

if (parts[5] === 'N' && parts[11] === 'SER5678' && parts[15] === 'BSR1234') {
    console.log('Indices verified: N=5, Serial=11, BSR=15, Date=17');
} else {
    console.log('Indices mismatch');
}
