import fs from 'fs';
import path from 'path';

/**
 * TDS Generator for Form 26Q (Version 8.0)
 * Based on official FVU File Format dated 27/05/2025
 * 
 * Record Structure:
 * - FH (File Header): 16 fields
 * - BH (Batch Header): 72 fields
 * - CD (Challan Detail): 40 fields
 * - DD (Deductee Detail): 54 fields
 * 
 * Field Types:
 * M = Mandatory
 * O = Optional
 * NA = Not Applicable (leave empty)
 */

export class TdsGenerator {
    constructor(db) {
        this.db = db;
    }

    async generate(returnId, filePath) {
        // 1. Fetch all necessary data
        const data = await this.fetchAllData(returnId);
        if (!data) throw new Error('Return data not found');

        const { r, deductor, challans, deductees, deductions } = data;

        // ✅ VALIDATION: At least one deductee required
        if (!deductees || deductees.length === 0) {
            throw new Error(
                'Error T_FV_6381: At least one deductee/collectee record is required in TDS/TCS ' +
                'statement as per Income Tax Department guidelines.'
            );
        }

        // ✅ VALIDATION: At least one deduction required
        if (!deductions || deductions.length === 0) {
            throw new Error('No deductions found. Add deductees to challans before generating file.');
        }

        // 2. Open stream with CRLF line endings (0D 0A)
        const stream = fs.createWriteStream(filePath, { encoding: 'utf8', flags: 'w' });

        try {
            // 3. Generate File Header (FH) - 16 fields
            const fh = this.generateFH(1, r, deductor);
            stream.write(fh + '\r\n');

            // 4. Generate Batch Header (BH) - 72 fields
            const bh = this.generateBH(2, r, deductor, challans, deductions);
            stream.write(bh + '\r\n');

            let lineSerial = 3;
            
            // 5. Generate Challan Details (CD) and Deductee Details (DD)
            let challanSerial = 1;
            for (const challan of challans) {
                const challanDeductions = deductions.filter(d => d.challan_id === challan.id);

                // CD Record - 40 fields
                const cd = this.generateCD(lineSerial++, challan, challanSerial, challanDeductions);
                stream.write(cd + '\r\n');

                // DD Records - 54 fields each
                let deducteeSerial = 1;
                for (const deduction of challanDeductions) {
                    const deductee = deductees.find(d => d.id === deduction.deductee_id);
                    const dd = this.generateDD(lineSerial++, deduction, deductee, challanSerial, deducteeSerial);
                    stream.write(dd + '\r\n');
                    deducteeSerial++;
                }

                challanSerial++;
            }

            stream.end();
            return true;

        } catch (error) {
            console.error('TDS Generation Error:', error);
            stream.destroy();
            throw error;
        }
    }

    async fetchAllData(returnId) {
        const q = (sql, params) => {
            return new Promise((resolve, reject) => {
                this.db.query(sql, params, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            });
        };

        const returns = await q('SELECT * FROM tds_returns WHERE id = ?', [returnId]);
        if (returns.length === 0) return null;
        const r = returns[0];

        const deductors = await q('SELECT * FROM deductors WHERE id = ?', [r.deductor_id]);
        const deductor = deductors[0];

        const challans = await q(
            'SELECT * FROM challans WHERE deductor_id = ? AND financial_year = ? AND quarter = ?',
            [r.deductor_id, r.financial_year, r.quarter]
        );

        const challanIds = challans.map(c => c.id);
        let deductions = [];
        if (challanIds.length > 0) {
            deductions = await q('SELECT * FROM deduction_entries WHERE challan_id IN (?)', [challanIds]);
        }

        const deducteeIds = [...new Set(deductions.map(d => d.deductee_id))];
        let deductees = [];
        if (deducteeIds.length > 0) {
            deductees = await q('SELECT * FROM deductees WHERE id IN (?)', [deducteeIds]);
        }

        return { r, deductor, challans, deductees, deductions };
    }

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Uppercase and trim string
     */
    upper(str) {
        if (str === null || str === undefined) return '';
        return String(str).toUpperCase().trim();
    }

    /**
     * Pad right with spaces to exact length
     */
    padRight(str, length) {
        if (str === null || str === undefined) str = '';
        str = String(str).trim();
        if (str.length > length) return str.substring(0, length);
        return str.padEnd(length, ' ');
    }

    /**
     * Format date to DDMMYYYY
     */
    formatDate(dateStr) {
        if (!dateStr) return '';

        let dateObj = new Date(dateStr);

        // Try parsing DD-MM-YYYY or DD/MM/YYYY format
        if (isNaN(dateObj.getTime())) {
            const parts = String(dateStr).split(/[-/]/);
            if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[2], 10);
                if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                    dateObj = new Date(y, m, d);
                }
            }
        }

        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date format:', dateStr);
            return '';
        }

        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();

        return `${dd}${mm}${yyyy}`;
    }

    /**
     * Format amount with 2 decimal places (e.g., 1000.50)
     */
    formatAmount(amount) {
        return Number(amount || 0).toFixed(2);
    }

    /**
     * Format rate with 4 decimal places (e.g., 10.0000)
     */
    formatRate(rate) {
        return Number(rate || 0).toFixed(4);
    }

    /**
     * Get state code from state name or abbreviation
     * FIXED: Corrected state code mapping
     */
    getStateCode(stateName) {
        const stateCodeMap = {
            // States (28 States + Telangana)
            "Andhra Pradesh": "28", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10",
            "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24", "Haryana": "06",
            "Himachal Pradesh": "02", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32",
            "Madhya Pradesh": "23", "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
            "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Punjab": "03",
            "Rajasthan": "08", "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36",
            "Tripura": "16", "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19",
            
            // Union Territories (8 UTs)
            "Delhi": "07", "Chandigarh": "04", "Andaman & Nicobar": "35",
            "Andaman and Nicobar Islands": "35", "Puducherry": "34",
            "Dadra & Nagar Haveli": "26", "Dadra and Nagar Haveli and Daman and Diu": "26",
            "Lakshadweep": "37", // FIXED: was 31
            "Jammu & Kashmir": "01", "Jammu and Kashmir": "01",
            "Ladakh": "38"
        };

        const stateAbbrMap = {
            "AP": "28", "AR": "12", "AS": "18", "BR": "10", "CG": "22", "GA": "30", "GJ": "24",
            "HR": "06", "HP": "02", "JH": "20", "KA": "29", "KL": "32", "MP": "23", "MH": "27",
            "MN": "14", "ML": "17", "MZ": "15", "NL": "13", "OD": "21", "OR": "21", "PB": "03",
            "RJ": "08", "SK": "11", "TN": "33", "TG": "36", "TR": "16", "UP": "09", "UK": "05",
            "UT": "05", "WB": "19", "DL": "07", "CH": "04", "AN": "35", "PY": "34", "DN": "26",
            "DD": "26", "LD": "37", "JK": "01", "LA": "38"
        };

        if (!stateName) return '09'; // Default to Uttar Pradesh

        const stateStr = String(stateName).trim();

        // If already a 2-digit code, validate and return
        if (/^\d{2}$/.test(stateStr)) {
            return stateStr;
        }

        // Check abbreviation
        const abbr = stateAbbrMap[stateStr.toUpperCase()];
        if (abbr) return abbr;

        // Check full name
        const code = stateCodeMap[stateStr];
        return code || '09'; // Default to UP
    }

    /**
     * Validate PAN format
     */
    validatePAN(pan) {
        if (!pan) return false;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    }

    /**
     * Validate TAN format
     */
    validateTAN(tan) {
        if (!tan) return false;
        const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
        return tanRegex.test(tan);
    }

    // ==================== RECORD GENERATORS ====================

    /**
     * FILE HEADER (FH) - 16 FIELDS
     * Single record for entire file
     */
    generateFH(lineNo, r, d) {
        const delim = '^';
        
        return [
            lineNo,                                  // 1. Line Number (M)
            'FH',                                    // 2. Record Type (M)
            'NS1',                                   // 3. File Type (M) - Non-Salary
            r.type === 'Correction' ? 'C' : 'R',    // 4. Upload Type (M) - R=Regular, C=Correction
            this.formatDate(new Date()),            // 5. File Creation Date (M) - DDMMYYYY
            '1',                                     // 6. File Sequence No. (M)
            'D',                                     // 7. Uploader Type (M) - D=Deductor
            this.upper(d.tan),                      // 8. TAN of Deductor (M)
            '1',                                     // 9. Total No. of Batches (M)
            'Protean RPU 8.0',                      // 10. Name of Return Preparation Utility (M)
            '',                                      // 11. Record Hash (NA)
            '',                                      // 12. FVU Version (NA)
            '',                                      // 13. File Hash (NA)
            '',                                      // 14. Sam Version (NA)
            '',                                      // 15. SAM Hash (NA)
            ''                                       // 16. SCM Version (NA)
                                                     // Field 17: SCM Hash (NA) - No separator after last field
                                                     // Field 18: Consolidated file hash (NA)
        ].join(delim);
    }

    /**
     * BATCH HEADER (BH) - 72 FIELDS
     * One per batch
     */
    generateBH(lineNo, r, d, challans, deductions) {
        const delim = '^';
        
        // Calculate total TDS deposited
        const totalTds = challans.reduce((sum, c) => sum + Number(c.total || 0), 0);

        // Financial Year calculation
        let fyStart = parseInt(r.financial_year.split('-')[0]);
        if (isNaN(fyStart)) fyStart = 2024;

        const ayStr = `${fyStart + 1}${String(fyStart + 2).substring(2)}`; // e.g., 202526
        const fyStr = `${fyStart}${String(fyStart + 1).substring(2)}`;     // e.g., 202425

        // Token Number: 15 digits for correction, empty for regular
        let token = '';
        if (r.type === 'Correction' && r.previous_token_number) {
            const digits = String(r.previous_token_number).replace(/\D/g, '');
            token = digits.length > 15 ? digits.substring(0, 15) : digits.padStart(15, '0');
        }

        return [
            lineNo,                                      // 1. Line Number (M)
            'BH',                                        // 2. Record Type (M)
            '1',                                         // 3. Batch Number (M)
            challans.length,                            // 4. Count of Challan Records (M)
            this.upper(r.form_no),                      // 5. Form Number (M) - 26Q
            r.correction_type || '',                    // 6. Transaction Type (O) - C1, C2, C3, C5, C9
            '',                                          // 7. Batch Updation Indicator (NA)
            '',                                          // 8. Token Number of original statement (NA)
            token,                                       // 9. Previous statement Token Number (O) - 15 digits
            '',                                          // 10. Token Number of statement submitted (NA)
            '',                                          // 11. Token Number date (NA)
            '',                                          // 12. Last TAN (NA)
            this.upper(d.tan),                          // 13. TAN of Deductor (M)
            '',                                          // 14. Receipt number (NA)
            this.upper(d.pan),                          // 15. PAN of Deductor (M)
            ayStr,                                       // 16. Assessment Year (M) - 6 digits
            fyStr,                                       // 17. Financial Year (M) - 6 digits
            this.upper(r.quarter),                      // 18. Period (M) - Q1/Q2/Q3/Q4
            this.padRight(d.name, 75),                  // 19. Name of Deductor (M)
            this.padRight(d.branch || '', 75),          // 20. Branch/Division (O)
            this.padRight(d.flat || d.address1 || '', 25),         // 21. Address1 (M)
            this.padRight(d.building || d.address2 || '', 25),     // 22. Address2 (O)
            this.padRight(d.road || d.street || d.address3 || '', 25),   // 23. Address3 (O)
            this.padRight(d.area || d.locality || d.address4 || '', 25), // 24. Address4 (O)
            this.padRight(d.city || d.address5 || '', 25),         // 25. Address5 (O)
            this.padRight(this.getStateCode(d.state), 2),          // 26. State (M) - 2 digits
            this.padRight(d.pincode || '', 6),          // 27. Pincode (M) - 6 digits
            this.upper(d.email || ''),                  // 28. Email ID (O)
            d.std_code || '',                           // 29. STD Code (O)
            d.telephone || '',                          // 30. Telephone No (O)
            'N',                                         // 31. Change of Address (M) - Y/N
            d.deductor_type || 'Q',                     // 32. Deductor Type (M) - Q=Company
            this.padRight(d.responsible_person || d.name, 75),     // 33. Responsible Person Name (M)
            this.padRight(d.responsible_designation || 'DIRECTOR', 20), // 34. Designation (M)
            this.padRight(d.rp_flat || d.flat || d.address1 || '', 25),     // 35. RP Address1 (M)
            this.padRight(d.rp_building || d.building || d.address2 || '', 25), // 36. RP Address2 (O)
            this.padRight(d.rp_road || d.rp_street || d.road || d.street || d.address3 || '', 25), // 37. RP Address3 (O)
            this.padRight(d.rp_area || d.rp_locality || d.area || d.locality || d.address4 || '', 25), // 38. RP Address4 (O)
            this.padRight(d.rp_city || d.city || d.address5 || '', 25),    // 39. RP Address5 (O)
            this.padRight(this.getStateCode(d.rp_state || d.state), 2),    // 40. RP State (M)
            this.padRight(d.rp_pincode || d.pincode || '', 6),    // 41. RP PIN (M)
            this.upper(d.rp_email || d.email || ''),    // 42. RP Email ID-1 (O)
            d.responsible_mobile || d.mobile || '',     // 43. Mobile number (O)
            d.rp_std_code || d.std_code || '',          // 44. RP STD Code (O)
            d.rp_telephone || d.telephone || '',        // 45. RP Telephone (O)
            'N',                                         // 46. Change of RP Address (M) - Y/N
            this.formatAmount(totalTds),                // 47. Batch Total Deposit Amount (M)
            '',                                          // 48. Unmatched challan count (O)
            '',                                          // 49. Count of Salary Details (NA)
            '',                                          // 50. Batch Total Gross Income (NA)
            'N',                                         // 51. AO Approval (M) - Y/N
            '',                                          // 52. Whether regular statement filed (O)
            '',                                          // 53. Last Deductor Type (NA)
            '',                                          // 54. State Name (O)
            d.pao_code || '',                           // 55. PAO Code (O)
            d.ddo_code || '',                           // 56. DDO Code (O)
            d.ministry_name || '',                      // 57. Ministry Name (O)
            d.ministry_name_other || '',                // 58. Ministry Name Other (O)
            this.upper(d.responsible_pan || d.pan),     // 59. PAN of Responsible Person (O)
            d.pao_registration || '',                   // 60. PAO Registration No (O)
            d.ddo_registration || '',                   // 61. DDO Registration No (O)
            d.std_code_alt || '',                       // 62. Deductor STD code (Alternate) (O)
            d.telephone_alt || '',                      // 63. Deductor Telephone (Alternate) (O)
            this.upper(d.email_alt || ''),              // 64. Deductor Email (Alternate) (O)
            d.rp_std_code_alt || '',                    // 65. RP STD Code (Alternate) (O)
            d.rp_telephone_alt || '',                   // 66. RP Telephone (Alternate) (O)
            this.upper(d.rp_email_alt || ''),           // 67. RP Email (Alternate) (O)
            d.ain_number || '',                         // 68. AIN Number (O)
            d.gstn || '',                               // 69. GSTN (O)
            '',                                          // 70. Count of Salary Details (NA)
            '',                                          // 71. Batch Total Gross Income (NA)
            ''                                           // 72. Record Hash (NA)
        ].join(delim);
    }

    /**
     * CHALLAN DETAIL (CD) - 40 FIELDS
     * One per challan
     */
    generateCD(lineNo, challan, challanSerial, challanDeductions) {
        const delim = '^';
        
        // Calculate totals from deductions
        const totalIncomeTax = challanDeductions.reduce((sum, d) => sum + Number(d.total_tax || 0), 0);
        const totalSurcharge = challanDeductions.reduce((sum, d) => sum + Number(d.surcharge || 0), 0);
        const totalCess = challanDeductions.reduce((sum, d) => sum + Number(d.cess || 0), 0);
        const totalTaxDeposited = totalIncomeTax + totalSurcharge + totalCess;

        return [
            lineNo,                                     // 1. Line Number (M)
            'CD',                                       // 2. Record Type (M)
            '1',                                        // 3. Batch Number (M)
            challanSerial,                             // 4. Challan-Detail Record Number (M)
            challanDeductions.length,                  // 5. Count of Deductee Records (M)
            challan.nil_challan || 'N',               // 6. NIL Challan Indicator (M) - Y/N
            '',                                         // 7. Challan Updation Indicator (NA)
            '',                                         // 8. Filler 3 (NA)
            '',                                         // 9. Filler 4 (NA)
            '',                                         // 10. Filler 5 (NA)
            '',                                         // 11. Last Bank Challan No (NA)
            challan.serial_no || '',                   // 12. Bank Challan No (O) - 5 digits
            '',                                         // 13. Last DDO serial number (NA)
            challan.ddo_serial || '',                  // 14. DDO serial number (O)
            '',                                         // 15. Last Bank-Branch Code (NA)
            this.upper(challan.bsr_code || ''),       // 16. Bank-Branch Code/Form 24G Receipt (M) - 7 digits
            '',                                         // 17. Last Date of Bank Challan (NA)
            this.formatDate(challan.date),             // 18. Date of Bank Challan (M) - DDMMYYYY
            '',                                         // 19. Filler 6 (NA)
            '',                                         // 20. Filler 7 (NA)
            '',                                         // 21. Section (NA)
            this.formatAmount(challan.tds || 0),      // 22. Oltas TDS - Income Tax (M)
            this.formatAmount(challan.surcharge || 0), // 23. Oltas TDS - Surcharge (M)
            this.formatAmount(challan.education_cess || 0), // 24. Oltas TDS - Cess (M)
            this.formatAmount(challan.interest || 0),  // 25. Oltas TDS - Interest (M)
            this.formatAmount(challan.fee || 0),       // 26. Oltas TDS - Others (M)
            this.formatAmount(challan.total || 0),     // 27. Total Deposit Amount (M)
            '',                                         // 28. Last Total Deposit Amount (NA)
            this.formatAmount(totalTaxDeposited),      // 29. Total Tax Deposit as per deductee annexure (M)
            this.formatAmount(totalIncomeTax),         // 30. TDS - Income Tax (M)
            this.formatAmount(totalSurcharge),         // 31. TDS - Surcharge (M)
            this.formatAmount(totalCess),              // 32. TDS - Cess (M)
            this.formatAmount(totalTaxDeposited),      // 33. Sum of Total Income Tax Deducted (M)
            this.formatAmount(challan.interest || 0),  // 34. TDS - Interest Amount (M)
            this.formatAmount(challan.fee || 0),       // 35. TDS - Others (M)
            challan.cheque_dd_no || '',                // 36. Cheque/DD No (O)
            challan.book_entry_indicator || 'N',       // 37. Book Entry/Cash (O) - B/C/N
            challan.remarks || '',                     // 38. Remarks (O)
            this.formatAmount(challan.fee || 0),       // 39. Fee (O)
            challan.minor_head || '200'                // 40. Minor Head (O) - 200/400
                                                        // No separator after last field
        ].join(delim);
    }

    /**
     * DEDUCTEE DETAIL (DD) - 54 FIELDS
     * One per deductee per challan
     */
    generateDD(lineNo, deduction, deductee, challanSerial, deducteeSerial) {
        const delim = '^';

        // Default deductee if not found
        if (!deductee) {
            console.warn(`Warning: No deductee found for deduction ${deduction.id}`);
            deductee = {
                pan: 'AAAPA0000A',
                name: 'UNKNOWN',
                deductee_status: 'O',
                buyer_seller_flag: '2'
            };
        }

        // Section code conversion (194Q → 94Q)
        let sectionCode = this.upper(deduction.section || '');
        if (sectionCode === '194Q') {
            sectionCode = '94Q';
        }

        // Calculate total tax
        const totalTax = Number(deduction.total_tax || 0) +
                        Number(deduction.surcharge || 0) +
                        Number(deduction.cess || 0);

        return [
            lineNo,                                     // 1. Line Number (M)
            'DD',                                       // 2. Record Type (M)
            '1',                                        // 3. Batch Number (M)
            challanSerial,                             // 4. Challan-Detail Record Number (M)
            deducteeSerial,                            // 5. Deductee Detail Record No (M)
            deductee.deductee_status || 'O',          // 6. Mode (M) - O=Original, A=Addition
            '',                                         // 7. Employee Serial No (NA)
            deductee.buyer_seller_flag || '2',        // 8. Deductee Code (M) - 1=Buyer, 2=Seller
            '',                                         // 9. Last Employee PAN (NA)
            this.upper(deductee.pan),                  // 10. Deductee's PAN (M)
            '',                                         // 11. Last Deductee Ref No (NA)
            deductee.reference_no || '',               // 12. Deductee Ref No (O) - 10 chars
            this.padRight(deductee.name, 75),          // 13. Name of deductee (M)
            this.formatAmount(deduction.total_tax || 0), // 14. TDS - Income Tax (M)
            this.formatAmount(deduction.surcharge || 0), // 15. TDS - Surcharge (M)
            this.formatAmount(deduction.cess || 0),    // 16. Health and Education Cess (M)
            this.formatAmount(totalTax),               // 17. Total Income Tax Deducted (M)
            '',                                         // 18. Last Total Income Tax (NA)
            this.formatAmount(totalTax),               // 19. Total Tax Deposited (M)
            '',                                         // 20. Last Total Tax Deposited (NA)
            '',                                         // 21. Total Value of Purchase (NA)
            this.formatAmount(deduction.amount_of_payment || 0), // 22. Amount Paid/Credited (M)
            this.formatDate(deduction.payment_date),   // 23. Date Amount Paid/Credited (M)
            this.formatDate(deduction.deducted_date || deduction.payment_date), // 24. Date Tax Deducted (O)
            '',                                         // 25. Date of Deposit (NA)
            this.formatRate(deduction.rate || 0),      // 26. Rate of Tax (M) - 4 decimals
            '',                                         // 27. Grossing up Indicator (NA)
            deduction.book_entry_indicator || 'C',     // 28. Book Entry/Cash (M) - B/C
            '',                                         // 29. Date of furnishing Certificate (NA)
            deduction.remarks1 || '',                  // 30. Remarks 1 (O) - A/B/C/D/T/Z
            deduction.remarks2 || '',                  // 31. Remarks 2 (O)
            deduction.remarks3 || '',                  // 32. Remarks 3 (O)
            sectionCode,                               // 33. Section Code (O) - e.g., 94Q, 194J
            deduction.certificate_number || '',        // 34. Certificate number u/s 197 (O)
            
            // Fields 35-54: Fillers and 194N fields (All NA)
            '', '', '', '', '', '', '', '',            // 35-42: Fillers 1-8
            '', '', '', '', '', '',                    // 43-48: 194N cash withdrawal fields (NA)
            '', '', '', '', '',                        // 49-53: Fillers 9-13
            ''                                          // 54: Record Hash (NA)
        ].join(delim);
    }
}

// ==================== FIELD REFERENCE ====================

/**
 * MANDATORY vs OPTIONAL vs NOT APPLICABLE
 * 
 * FILE HEADER (FH) - All 10 fields Mandatory, 6 NA fields
 * 
 * BATCH HEADER (BH) - 72 fields:
 * Mandatory (M): 1,2,3,4,5,13,15,16,17,18,19,21,26,27,31,32,33,34,35,40,41,46,47,51
 * Optional (O): 6,9,20,22,23,24,25,28,29,30,42,43,44,45,48,52,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69
 * Not Applicable (NA): 7,8,10,11,12,14,49,50,53,70,71,72
 * 
 * CHALLAN DETAIL (CD) - 40 fields:
 * Mandatory (M): 1,2,3,4,5,6,16,18,22,23,24,25,26,27,29,30,31,32,33,34,35
 * Optional (O): 12,14,36,37,38,39,40
 * Not Applicable (NA): 7,8,9,10,11,13,15,17,19,20,21,28
 * 
 * DEDUCTEE DETAIL (DD) - 54 fields:
 * Mandatory (M): 1,2,3,4,5,6,8,10,13,14,15,16,17,19,22,23,26,28
 * Optional (O): 12,24,30,31,32,33,34
 * Not Applicable (NA): 7,9,11,18,20,21,25,27,29,35-54
 * 
 * REMARKS1 VALUES (Field 30 in DD):
 * A - Lower deduction u/s 197
 * B - No tax due to NIL/lower rate in DTAA
 * C - No tax due to other reasons
 * D - Higher deduction due to non-availability of PAN
 * T - Tax paid on presumptive basis u/s 194M
 * Z - Tax deducted at threshold limit
 * 
 * DEDUCTOR TYPE (Field 32 in BH):
 * Q - Company
 * G - Government
 * S - State Government
 * O - Others
 * 
 * SECTION CODES (Field 33 in DD):
 * Common: 94Q, 192A, 192B, 193, 194A, 194B, 194C, 194D, 194G, 194H, 194I, 194J, 194K, etc.
 * Note: 194Q in database → 94Q in file
 */
