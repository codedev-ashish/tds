import { TdsGenerator } from '../services/tds_generator.js';

const mockDb = { query: (cb) => cb(null, []) };
const generator = new TdsGenerator(mockDb);

const deduction = {
    id: 'ded1',
    deductee_id: 'd1',
    section: '194Q', // 94Q
    payment_date: '2025-10-31',
    deducted_date: '2025-10-31',
    amount_of_payment: 50000.00,
    rate: 0.1,
    total_tax: 50.00,
    surcharge: 0.00,
    cess: 0.00,
};

const deductee = {
    pan: 'AXFPJ5192A',
    name: 'TEST USER',
    deductee_status: 'O',
    buyer_seller_flag: '2'
};

const line = generator.generateDD(9, deduction, deductee, 1, 1);
console.log(line);

const parts = line.split('^');

// Verification
const totalTaxIndex = 16;
const amountIndex = 19;
const date1Index = 20;
const date2Index = 21;
const rateIndex = 23;

console.log(`Index 16 (Total Tax): ${parts[totalTaxIndex]} (Expected 50.00)`);
console.log(`Index 17 (Sep 1): '${parts[17]}' (Expected '')`);
console.log(`Index 18 (Sep 2): '${parts[18]}' (Expected '')`);
console.log(`Index 19 (Amount): ${parts[amountIndex]} (Expected 50000.00)`);
console.log(`Index 20 (Pay Date): ${parts[date1Index]} (Expected 31102025)`);
console.log(`Index 21 (Ded Date): ${parts[date2Index]} (Expected 31102025)`);
console.log(`Index 22 (Sep 3): '${parts[22]}' (Expected '')`);
console.log(`Index 23 (Rate): ${parts[rateIndex]} (Expected 0.1000)`);

if (
    parts[totalTaxIndex] === '50.00' &&
    parts[17] === '' &&
    parts[18] === '' &&
    parts[amountIndex] === '50000.00' &&
    parts[rateIndex] === '0.1000'
) {
    console.log('SUCCESS: Fields shifted correctly.');
} else {
    console.log('FAILURE: Fields mismatch.');
}
