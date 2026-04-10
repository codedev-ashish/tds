
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const samplesDir = './public/samples';
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// 1. Deductor Sample
const deductorData = [
    {
        'Company / Deductor Name *': 'ABC Corp Pvt Ltd',
        'TAN *': 'ABCD12345E',
        'PAN *': 'ABCDE1234F',
        'GSTIN': '27ABCDE1234F1Z5',
        'Branch / Division *': 'Main Branch',
        'Deductor Type *': 'Company', // Individual, Company, Partnership, Government
        'Flat / Door / Block *': '101',
        'Building *': 'Business Tower',
        'Road / Street / Lane *': 'Main Road',
        'Area / Locality *': 'Industrial Area',
        'Town / District *': 'Mumbai',
        'State *': 'Maharashtra',
        'Pin *': '400001',
        'STD': '022',
        'Phone Number *': '23456789',
        'Alt STD': '',
        'Alt Phone Number': '',
        'Email ID *': 'contact@abccorp.com',
        'Alternate Email ID': '',
        'Responsible Person Name *': 'John Doe',
        'Responsible Designation *': 'CEO',
        'Responsible Father Name': '',
        'Responsible Mobile *': '9876543210',
        'Responsible PAN *': 'BCDEF5678G',
        'RP Flat / Door / Block *': '202',
        'RP Building *': 'Residency Heights',
        'RP Road / Street / Lane *': 'Station Road',
        'RP Area / Locality *': 'Suburb Area',
        'RP Town / District *': 'Mumbai',
        'RP State *': 'Maharashtra',
        'RP Pin *': '400002',
        'RP STD': '',
        'RP Phone Number *': '9876543210',
        'RP Alt STD': '',
        'RP Alt Phone Number': '',
        'RP Email ID *': 'john.doe@example.com',
        'RP Alternate Email ID': '',
        'Gov PAO Code': '',
        'Gov PAO Reg No': '',
        'Gov DDO Code': '',
        'Gov DDO Reg No': '',
        'Gov State': '',
        'Gov Ministry': '',
        'Gov Other Ministry': '',
        'Gov AIN': '',
        'Deductor Code *': 'D', // D - Deductor, C - Collector
        'Address Change Flag *': 'N' // Y/N
    }
];

// 2. Deductee Sample
const deducteeData = [
    {
        'PAN *': 'BCDEF5678G',
        'Name *': 'Jane Smith',
        'Deductee Code *': '02', // 01: Company, 02: Non-Company
        'Deductee Status': 'O', // O: Ordinary, A: Alternate
        'Buyer/Seller Flag': '2', // 1: Buyer, 2: Seller
        'Email': 'jane@example.com',
        'Mobile': '9999888877',
        'Address': '123, Some Street, Mumbai'
    }
];

// 3. Returns Sample (Challans & Deductions) - Keeping as is for now unless requested
const challansData = [
    {
        'Challan Sl No': '1',
        'BSR Code': '0123456',
        'Deposit Date': '2025-01-15',
        'Challan Serial No': '00123',
        'TDS': 5000,
        'Surcharge': 0,
        'Education Cess': 0,
        'Interest': 0,
        'Fees': 0,
        'Others': 0,
        'Minor Head': '200' // 200 or 400
    }
];

const deductionsData = [
    {
        'Challan Sl No': '1',
        'Deductee PAN': 'BCDEF5678G',
        'Deductee Name': 'Jane Smith',
        'Section': '194C',
        'Payment Date': '2025-01-10',
        'Deducted Date': '2025-01-10',
        'Amount Paid': 100000,
        'Rate': 1,
        'Income Tax': 1000,
        'Surcharge': 0,
        'Cess': 0,
        'Total Tax': 1000,
        'Tax Deposited': 1000,
        'Remarks': 'Normal'
    }
];

const createExcel = (data, fileName, sheetName = 'Sheet1') => {
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-adjust column width (simple heuristic)
    const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length + 5, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, path.join(samplesDir, fileName));
    console.log(`Generated ${fileName}`);
};

createExcel(deductorData, 'sample_deductors.xlsx', 'Deductors');
createExcel(deducteeData, 'sample_deductees.xlsx', 'Deductees');

// Multi-sheet for Returns
const wbReturns = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbReturns, XLSX.utils.json_to_sheet(challansData), 'Challans');
XLSX.utils.book_append_sheet(wbReturns, XLSX.utils.json_to_sheet(deductionsData), 'Deductions');
XLSX.writeFile(wbReturns, path.join(samplesDir, 'sample_returns.xlsx'));
console.log('Generated sample_returns.xlsx');
