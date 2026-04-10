import { TdsGenerator } from '../services/tds_generator.js';

const generator = new TdsGenerator({});

const testDates = [
    "2025-11-05", // Correct format
    "05-11-2025", // Reversed
    "2025-11-05T18:30:00.000Z", // ISO
    "05-11-2025T18:30:00.000Z", // Weird ISO?
    // Based on user report: "05T18:30:00.000Z/11/2025" implies input might be something that splits weirdly
    "2025-11-05 18:30:00",
    new Date("2025-11-05"),
    "05/11/2025"
];

console.log("Testing formatDate...");

testDates.forEach(d => {
    try {
        const res = generator.formatDate(d);
        console.log(`Input: "${d}" | Type: ${typeof d} | Output: "${res}"`);
    } catch (e) {
        console.log(`Input: "${d}" | Error: ${e.message}`);
    }
});
