import { TdsGenerator } from '../services/tds_generator.js';

// Mock DB
const mockDb = {
    query: (sql, params, callback) => {
        // We don't need actual DB for this unit test if we mock fetchAllData
        // But TdsGenerator is tightly coupled. 
        // Instead, we can verify generateCD directly if we instantiate TdsGenerator.
        callback(null, []);
    }
};

const generator = new TdsGenerator(mockDb);

// Sample Challan Data based on user request/schema
const challan = {
    id: 'c1',
    deductor_id: 'd1',
    bsr_code: '0180002',       // BSR Code
    date: '2025-11-07',        // Date
    serial_no: '0180002',      // Challan Serial (User example shows same as BSR? or 07112025? No. 0180002)
    // User Example: ...^N^^^^^^0180002^^^^^0180002^^07112025...
    // N + 6 carets + Serial + 4 carets + BSR + 2 carets + Date
    tds: 10096.00,
    surcharge: 0.00,
    education_cess: 0.00,
    interest: 303.00,
    fee: 0.00,
    others: 0.00,
    total: 10399.00,
    minor_head: '200',
    nil_challan: 'N'
};

// Override formatAmount/formatDate for simple testing if needed, or use real ones
// Real ones are fine.

const line = generator.generateCD(3, challan, 1, 1);
console.log(line);

// Verification Logic
// Pattern: 3^CD^1^1^1^N^^^^^^<Serial>^^^^<BSR>^^<Date>...
// ^N (index 5)
// ^ (6)
// ^ (7)
// ^ (8)
// ^ (9)
// ^ (10)
// ^ (11)
// serial (12)
// ^ (13)
// ^ (14)
// ^ (15)
// ^ (16)
// bsr (17)

const parts = line.split('^');
const nilInd = parts[5]; // N
const serial = parts[12]; // Should be serial_no
const bsr = parts[17];    // Should be bsr_code

console.log(`Nil Indicator (Index 5): ${nilInd}`);
console.log(`Serial (Index 12): ${serial}`);
console.log(`BSR (Index 17): ${bsr}`);

if (nilInd === 'N' && serial === challan.serial_no && bsr === challan.bsr_code) {
    // Check separators
    // Dist from N to Serial: 12 - 5 = 7 items. N, empty, empty, empty, empty, empty, empty, Serial.
    // So 6 empty fields? No.
    // split behavior: 'a^b' -> ['a', 'b']. 'a^^b' -> ['a', '', 'b'].
    // 'N^^^^^^S' -> 'N' (5), '' (6), '' (7), ''(8), ''(9), ''(10), 'S'(11)?
    // User requested: "N^^^^^^" -> 6 carets. 
    // parts[5] = N
    // parts[6] = ''
    // parts[7] = ''
    // parts[8] = ''
    // parts[9] = ''
    // parts[10] = ''
    // parts[11] = Serial?

    // Let's count empty strings in between.
    const betNandS = parts.slice(6, 12);
    console.log('Fields between N and Serial:', betNandS);

    const betSandB = parts.slice(13, 17);
    console.log('Fields between Serial and BSR:', betSandB);
}
