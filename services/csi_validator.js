import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Validates Challan Status Inquiry (CSI) files against database records
 */
export class CsiValidator {
    constructor(db) {
        this.db = db;
    }

    /**
     * Main validation function
     */
    async validate(returnId, csiContent) {
        // 1. Fetch Return Details
        const r = await this.fetchReturn(returnId);
        if (!r) throw new Error('Return not found');

        const deductor = await this.fetchDeductor(r.deductorId);
        if (!deductor) throw new Error('Deductor details not found');

        // 2. Fetch Challans for this return period
        const dbChallans = await this.fetchChallans(r.deductorId, r.financialYear, r.quarter);
        if (dbChallans.length === 0) {
            return {
                isValid: false,
                errors: ['No challans found in database for this return period.'],
                warnings: [],
                stats: { totalChallans: 0, matched: 0, unmatched: 0 }
            };
        }

        // 3. Parse CSI File
        const csiChallans = this.parseCsiFile(csiContent);
        if (csiChallans.length === 0) {
            return {
                isValid: false,
                errors: ['Could not parse any valid challan records from the CSI file.'],
                warnings: [],
                stats: { totalChallans: dbChallans.length, matched: 0, unmatched: dbChallans.length }
            };
        }

        // 4. Header Validation (TAN & Name)
        const headerWarnings = [];
        const headerChecks = [];

        // Try to find TAN in the first few lines
        const lines = csiContent.split(/\r?\n/).slice(0, 10); // Check first 10 lines
        const tanRegex = new RegExp(deductor.tan, 'i');
        const tanFound = lines.some(line => tanRegex.test(line));

        if (tanFound) {
            headerChecks.push(`TAN Validated: ${deductor.tan} found in CSI file.`);
        } else {
            // Only a warning if we can't find it, as file format might not have it explicitly in some cases?
            // User requested "Validate TAN", so maybe error? Let's treat as warning for robustness, or Error if strict.
            // Given the snippet `3^ALDD...`, it should be there.
            headerWarnings.push(`TAN Mismatch/Missing: Could not find TAN ${deductor.tan} in CSI file header.`);
        }

        // Try to find Name (fuzzy)
        // Split deductor name into parts and check if at least one significant part exists
        if (deductor.name) {
            const nameParts = deductor.name.split(' ').filter(p => p.length > 3);
            const nameFound = nameParts.some(part => lines.some(line => line.toLowerCase().includes(part.toLowerCase())));
            if (nameFound) {
                headerChecks.push(`Deductor Name Validated: '${deductor.name}' matched in CSI file.`);
            } else {
                headerWarnings.push(`Deductor Name Warning: Could not loosely match '${deductor.name}' in CSI file.`);
            }
        }

        // 5. Validate Challans
        const result = await this.validateChallans(dbChallans, csiChallans);

        // Merge results
        result.warnings = [...headerWarnings, ...result.warnings];
        if (result.checks) {
            result.checks = [...headerChecks, ...result.checks];
        } else {
            result.checks = headerChecks;
        }

        // 6. Log Validation Result
        await this.logValidation(returnId, result);

        return result;
    }

    /**
     * Log validation result to database
     */
    async logValidation(returnId, result) {
        try {
            const id = crypto.randomUUID();
            const sql = `
                INSERT INTO csi_validation_logs 
                (id, return_id, status, total_challans, matched_challans, unmatched_challans, report_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                id,
                returnId,
                result.isValid ? 'success' : 'failure',
                result.stats.totalChallans,
                result.stats.matched,
                result.stats.unmatched,
                JSON.stringify({
                    errors: result.errors,
                    warnings: result.warnings,
                    checks: result.checks
                })
            ];
            await this.query(sql, params);
        } catch (error) {
            console.error('Failed to log validation result:', error);
            // Don't fail the validation itself if logging fails
        }
    }

    /**
     * Parse CSI text content into structured objects
     * Format assumed: BSR Code | Date | Serial | Amount (or variations)
     * Robust parser looks for patterns in each line
     */
    parseCsiFile(content) {
        const lines = content.split(/\r?\n/);
        const parsed = [];

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Regex patterns
            // BSR: 7 digits
            const bsrMatch = cleanLine.match(/\b\d{7}\b/);

            // Date: DD-MM-YYYY, DD/MM/YYYY, DD-MMM-YYYY, DD-MMM-YY
            // Matches: 05-05-2025, 05/05/2025, 05-May-2025, 05-May-25
            const dateMatch = cleanLine.match(/\b\d{1,2}[-/\.](\d{2}|[A-Za-z]{3})[-/\.](\d{4}|\d{2})\b/);

            // Amount: Number with optional decimals, maybe commas
            // Improved: \b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b OR \b\d+(?:\.\d{2})?\b
            // Let's use a simpler one that grabs any number-like sequence
            // that isn't purely a year or BSR.
            // Or stick to improved strict:
            const amountMatches = cleanLine.match(/(\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b)|(\b\d+(?:\.\d{2})?\b)/g);

            // Serial: 5 digits (strictly 5, distinct from BSR)
            // Note: Some banks might use longer serials, but standard is 5.
            const serialMatches = cleanLine.match(/\b\d{5}\b/g);

            if (bsrMatch && dateMatch && amountMatches) {
                // Extract Amount
                // Prioritize amounts with distinct decimal like .XX
                // Or fallback to the last number in the line that looks like an amount
                let amountStr = amountMatches.find(m => m.includes('.')) || amountMatches[amountMatches.length - 1];

                // If we matched BSR or Date parts as "amount", filter them out
                // BSR = 7 digits. Date parts = 2 or 4 digits.
                // Amount usually has decimal or is large.
                // Let's filter amounts that are exactly the BSR or Year
                const potentialAmounts = amountMatches.filter(m => m !== bsrMatch[0] && !dateMatch[0].includes(m));

                if (potentialAmounts.length > 0) {
                    amountStr = potentialAmounts.find(m => m.includes('.')) || potentialAmounts[potentialAmounts.length - 1];
                }

                const amount = parseFloat(amountStr.replace(/,/g, ''));

                // Extract Serial
                let serial = null;
                if (serialMatches) {
                    // Filter out BSR if accidentally matched (though \d{5} shouldn't match \d{7})
                    // Filter out years like 2025 if caught
                    const candidates = serialMatches.filter(s => s !== bsrMatch[0] && !dateMatch[0].includes(s));
                    if (candidates.length > 0) serial = candidates[0];
                }

                if (!isNaN(amount)) {
                    parsed.push({
                        bsr: bsrMatch[0],
                        date: this.standardizeDate(dateMatch[0]),
                        amount: amount,
                        serial: serial,
                        originalLine: cleanLine
                    });
                }
            }
        }
        return parsed;
    }

    /**
     * Cross-reference DB Challans with CSI Records
     */
    async validateChallans(dbChallans, csiChallans) {
        const errors = [];
        const warnings = [];
        const checks = [];
        let matchedCount = 0;

        const remainingCsi = [...csiChallans];

        // --- Header Validation (TAN / Name) ---
        // Assuming the first parsed record containing ONLY text (no amount) might be header?
        // Or if we implemented header extraction separately. For now, let's scan remainingCsi for metadata-like entries if parseCsiFile supports it.
        // Actually, parseCsiFile currently returns only valid BSR+Date+Amount lines.
        // I'll add a separate scan of original content for TAN in `validate` method before calling this.

        for (const challan of dbChallans) {
            const dbDate = this.standardizeDate(challan.date);
            const dbAmount = Number(challan.total);
            const dbBsr = challan.bsr_code?.trim();
            const dbSerial = challan.serial_no?.trim();

            // --- Deductee Details Validation (Internal Consistency) ---
            const deducteeTotal = await this.getDeducteeTotal(challan.id);
            if (Math.abs(deducteeTotal - dbAmount) > 1.00) {
                errors.push(`Internal Mismatch: Challan ID ${challan.id} total (₹${dbAmount}) does not match sum of deductee rows (₹${deducteeTotal}).`);
            }

            // --- Internal Component Consistency Check ---
            // Sum of Tax + Surcharge + Cess + Interest + Fee + Others should equal Total
            const calcTotal = (Number(challan.tax) || 0) + (Number(challan.surcharge) || 0) + (Number(challan.cess) || 0) + (Number(challan.interest) || 0) + (Number(challan.fee) || 0) + (Number(challan.others) || 0);
            if (Math.abs(calcTotal - dbAmount) > 1.00) {
                errors.push(`Challan Internal Mismatch: Calculated components (₹${calcTotal}) != Total Amount (₹${dbAmount}) for Challan ID ${challan.id}`);
            }

            let matchIndex = -1;

            // 1. Strict
            matchIndex = remainingCsi.findIndex(c =>
                c.bsr === dbBsr &&
                c.date === dbDate &&
                Math.abs(c.amount - dbAmount) < 1.00 &&
                (dbSerial && c.serial ? c.serial === dbSerial : true)
            );

            if (matchIndex === -1) {
                // 2. Relaxed (Ignore Serial)
                matchIndex = remainingCsi.findIndex(c =>
                    c.bsr === dbBsr &&
                    c.date === dbDate &&
                    Math.abs(c.amount - dbAmount) < 1.00
                );

                if (matchIndex !== -1) {
                    warnings.push(`Challan matched but Serial No mismatch/missing. DB: ${dbSerial}, CSI: ${remainingCsi[matchIndex].serial || 'N/A'} (Amount: ${dbAmount})`);
                }
            }

            if (matchIndex !== -1) {
                matchedCount++;
                checks.push(`Verified Challan: ₹${dbAmount} on ${dbDate}`);
                remainingCsi.splice(matchIndex, 1);
            } else {
                errors.push(`Challan Missing in CSI: Amount ₹${dbAmount.toFixed(2)}, Date ${dbDate}, BSR ${dbBsr}`);
            }
        }

        // Check for Unconsumed CSI Records (Warning)
        if (remainingCsi.length > 0) {
            remainingCsi.slice(0, 3).forEach(c => {
                warnings.push(`Unused CSI Record: Amount ₹${c.amount}, Date ${c.date}`);
            });
        }

        const isValid = errors.length === 0;

        return {
            isValid,
            message: isValid ? 'Validation Successful: CSI file matches all challan details.' : 'Validation Failed: Mismatches found between CSI file and entered details.',
            errors,
            warnings,
            checks,
            stats: {
                totalChallans: dbChallans.length,
                matched: matchedCount,
                unmatched: dbChallans.length - matchedCount
            }
        };
    }

    // --- Helpers ---

    async getDeducteeTotal(challanId) {
        const sql = `SELECT SUM(total_tax) as total FROM deduction_entries WHERE challan_id = ?`;
        const res = await this.query(sql, [challanId]);
        return res[0].total || 0;
    }

    async fetchReturn(id) {
        const res = await this.query('SELECT * FROM tds_returns WHERE id = ?', [id]);
        return res[0];
    }

    async fetchDeductor(id) {
        const res = await this.query('SELECT * FROM deductors WHERE id = ?', [id]);
        return res[0];
    }

    async fetchChallans(deductorId, fy, qtr) {
        return await this.query(
            'SELECT * FROM challans WHERE deductor_id = ? AND financial_year = ? AND quarter = ?',
            [deductorId, fy, qtr]
        );
    }

    query(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.query(sql, params, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    }

    standardizeDate(dateStr) {
        if (!dateStr) return '';

        let d, m, y;
        const months = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
            'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };

        // Handle DD-MMM-YY or DD-MMM-YYYY
        const alphaMonthMatch = dateStr.match(/(\d{1,2})[-/\.]([A-Za-z]{3})[-/\.](\d{4}|\d{2})/);
        if (alphaMonthMatch) {
            d = alphaMonthMatch[1];
            m = months[alphaMonthMatch[2].toUpperCase()] || '00';
            y = alphaMonthMatch[3];
            if (y.length === 2) y = '20' + y; // Assume 20xx
        } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) { // YYYY-MM-DD
                y = parts[0]; m = parts[1]; d = parts[2];
            } else { // DD-MM-YYYY
                d = parts[0]; m = parts[1]; y = parts[2];
            }
        } else if (dateStr.includes('/')) { // DD/MM/YYYY
            const parts = dateStr.split('/');
            d = parts[0]; m = parts[1]; y = parts[2];
        } else if (dateStr.includes('.')) { // DD.MM.YYYY
            const parts = dateStr.split('.');
            d = parts[0]; m = parts[1]; y = parts[2];
        }

        // Return as DDMMYYYY for comparison
        return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
    }
}
