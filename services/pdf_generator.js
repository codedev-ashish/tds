import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class PdfGenerator {
    constructor(db) {
        this.db = db;
    }

    async generate(returnId, filePath) {
        // Fetch all necessary data
        const data = await this.fetchAllData(returnId);
        if (!data) throw new Error('Return data not found');

        const { r, deductor, challans, deductees, deductions } = data;

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 30,
                    bufferPages: true
                });

                const stream = fs.createWriteStream(filePath);

                doc.on('error', reject);
                stream.on('error', reject);

                doc.pipe(stream);

                // Generate PDF content
                this.generatePdfContent(doc, r, deductor, challans, deductees, deductions);

                doc.end();

                stream.on('finish', () => {
                    resolve(true);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    generatePdfContent(doc, r, deductor, challans, deductees, deductions) {
        const margins = 35;
        const pageWidth = 595;
        const pageHeight = 842;

        // Premium Professional Colors (HSL based)
        this.colors = {
            primary: '#0f172a',    // Slate 900
            secondary: '#475569',  // Slate 600
            accent: '#2563eb',     // Blue 600
            success: '#16a34a',    // Green 600
            headerBg: '#f8fafc',   // Slate 50
            stripeBg: '#f1f5f9',   // Slate 100
            border: '#e2e8f0',     // Slate 200
            text: '#1e293b',       // Slate 800
            white: '#ffffff'
        };

        // Page Border
        doc.rect(margins / 2, margins / 2, pageWidth - margins, pageHeight - margins).lineWidth(0.5).strokeColor(this.colors.border).stroke();

        // Header
        this.addHeader(doc, r, margins, pageWidth);

        // Deductor Information Section
        this.addDeductorInfo(doc, deductor, margins, pageWidth);

        // Challan Details Section
        this.addChallanDetails(doc, challans, margins, pageWidth);

        // Deductee Details Section
        this.addDeducteeDetails(doc, deductees, deductions, margins, pageWidth);

        // Summary Section
        this.addSummary(doc, challans, deductions, margins, pageWidth);

        // Footer
        this.addFooter(doc, r, margins, pageWidth, pageHeight);
    }

    addHeader(doc, r, margins, pageWidth) {
        const headerY = margins + 10;

        // Title area
        doc.fontSize(18).font('Helvetica-Bold').fillColor(this.colors.primary).text('INCOME TAX DEPARTMENT', margins, headerY, { align: 'center' });
        doc.fontSize(12).font('Helvetica-Bold').fillColor(this.colors.secondary).text('GOVERNMENT OF INDIA', { align: 'center' });

        doc.moveDown(0.5);
        const formNo = (r && r.form_no) || '27A';
        const fy = (r && r.financial_year) || '-';
        const qtr = (r && r.quarter) || '-';

        doc.fontSize(12).font('Helvetica-Bold').fillColor(this.colors.accent).text(`Form No. ${formNo} • Quarterly TDS Statement`, { align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor(this.colors.secondary).text(`FVU Version 9.3 | Financial Year: ${fy} | Quarter: ${qtr}`, { align: 'center' });

        const lineY = doc.y + 12;
        doc.moveTo(margins, lineY).lineTo(pageWidth - margins, lineY).lineWidth(1).strokeColor(this.colors.accent).stroke();
        doc.moveDown(1.5);
    }

    addDeductorInfo(doc, deductor, margins, pageWidth) {
        const startY = doc.y;
        doc.fontSize(12).font('Helvetica-Bold').fillColor(this.colors.primary).text('DEDUCTOR INFORMATION', margins);
        doc.moveDown(0.4);

        const boxWidth = pageWidth - (2 * margins);
        const padding = 10;
        const col1Width = 120;
        const col2Width = boxWidth - col1Width - (2 * padding);

        const infoBoxHeight = 85;
        // Box background
        doc.fillColor(this.colors.headerBg).rect(margins, doc.y, boxWidth, infoBoxHeight).fill();
        doc.rect(margins, doc.y - infoBoxHeight, boxWidth, infoBoxHeight).lineWidth(0.5).strokeColor(this.colors.border).stroke();

        const data = [
            ['Deductor Name:', deductor.name || '-'],
            ['TAN / PAN:', `${deductor.tan || '-'}  /  ${deductor.pan || '-'}`],
            ['Entity Type:', deductor.type || '-'],
            ['Address:', `${deductor.flat || ''} ${deductor.building || ''} ${deductor.street || ''} ${deductor.area || ''}, ${deductor.city || ''}, ${deductor.state || ''} - ${deductor.pincode || ''}`]
        ];

        let currentY = doc.y - (infoBoxHeight - 8);
        data.forEach(([label, value]) => {
            doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.secondary).text(label, margins + padding, currentY);
            doc.font('Helvetica').fillColor(this.colors.text).text(String(value), margins + padding + col1Width, currentY, { width: col2Width });
            currentY += (label === 'Address:') ? 14 : 18;
        });

        doc.y = startY + 110;
    }

    addChallanDetails(doc, challans, margins, pageWidth) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor(this.colors.primary).text('CHALLAN DETAILS', margins);
        doc.moveDown(0.4);

        const colWidths = [30, 65, 65, 65, 50, 50, 50, 45, 45, 60];
        const startX = margins;
        const tableWidth = pageWidth - (2 * margins);
        let y = doc.y;

        const headers = ['S.No', 'Date', 'Challan #', 'BSR Code', 'TDS', 'Surch.', 'Int.', 'Fees', 'Cess', 'Total'];

        // Header Background
        doc.fillColor(this.colors.primary).rect(startX, y, tableWidth, 22).fill();

        let x = startX;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.white);
        headers.forEach((header, i) => {
            doc.text(header, x, y + 7, { width: colWidths[i], align: 'center' });
            x += colWidths[i];
        });

        doc.y = y + 22;
        doc.fillColor(this.colors.text);

        let rowNum = 1;

        if (challans.length === 0) {
            this.drawEmptyRow(doc, startX, tableWidth, 'No challans found', 8);
        } else {
            challans.forEach((challan) => {
                const safeNum = (val) => isNaN(Number(val)) ? 0 : Number(val);
                y = doc.y;

                if (y > 750) {
                    doc.addPage();
                    y = margins;
                }

                if (rowNum % 2 === 0) {
                    doc.fillColor(this.colors.stripeBg).rect(startX, y, tableWidth, 20).fill();
                }

                doc.rect(startX, y, tableWidth, 20).lineWidth(0.2).strokeColor(this.colors.border).stroke();
                doc.fontSize(7.5).font('Helvetica').fillColor(this.colors.text);

                x = startX;
                doc.text(String(rowNum), x, y + 6, { width: colWidths[0], align: 'center' });
                x += colWidths[0];
                const d = challan.date || challan.challan_date;
                doc.text(d ? new Date(d).toLocaleDateString() : '-', x, y + 6, { width: colWidths[1], align: 'center' });
                x += colWidths[1];
                doc.text(challan.serial_no || challan.challan_no || '-', x, y + 6, { width: colWidths[2], align: 'center' });
                x += colWidths[2];
                doc.text(challan.bsr_code || challan.bsrCode || '-', x, y + 6, { width: colWidths[3], align: 'center' });
                x += colWidths[3];
                const nums = [safeNum(challan.tds), safeNum(challan.surcharge), safeNum(challan.interest), safeNum(challan.fee), safeNum(challan.education_cess || challan.cess), safeNum(challan.total)];
                nums.forEach((val, i) => {
                    doc.text(val.toFixed(2), x + 2, y + 6, { width: colWidths[i + 4] - 4, align: 'right' });
                    x += colWidths[i + 4];
                });

                doc.y = y + 20;
                rowNum++;
            });
        }
        doc.moveDown(1);
    }

    addDeducteeDetails(doc, deductees, deductions, margins, pageWidth) {
        if (doc.y > 600) doc.addPage();

        doc.fontSize(12).font('Helvetica-Bold').fillColor(this.colors.primary).text('DEDUCTEE DETAILS', margins);
        doc.moveDown(0.4);

        const colWidths = [25, 90, 60, 42, 42, 48, 38, 32, 28, 42, 22, 28, 29];
        const startX = margins;
        const tableWidth = pageWidth - (2 * margins);
        let y = doc.y;

        const headers = ['S.No', 'Deductee Name', 'PAN', 'Pay Dt', 'Ded Dt', 'Taxable', 'TDS', 'Sur.', 'Cess', 'Total', '%', 'Sec', 'Rem'];

        doc.fillColor(this.colors.accent).rect(startX, y, tableWidth, 22).fill();

        let x = startX;
        doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.white);
        headers.forEach((header, i) => {
            doc.text(header, x, y + 7, { width: colWidths[i], align: 'center' });
            x += colWidths[i];
        });

        doc.y = y + 22;
        doc.fillColor(this.colors.text);

        let rowNum = 1;

        if (deductions.length === 0) {
            this.drawEmptyRow(doc, startX, tableWidth, 'No deductee entries found', 7);
        } else {
            deductions.forEach((entry) => {
                const deductee = deductees.find(d => d.id === entry.deductee_id) || {};
                const safeNum = (val) => isNaN(Number(val)) ? 0 : Number(val);
                y = doc.y;

                if (y > 780) {
                    doc.addPage();
                    y = margins;
                }

                if (rowNum % 2 === 0) {
                    doc.fillColor(this.colors.stripeBg).rect(startX, y, tableWidth, 18).fill();
                }

                doc.rect(startX, y, tableWidth, 18).lineWidth(0.2).strokeColor(this.colors.border).stroke();
                doc.fontSize(6).font('Helvetica').fillColor(this.colors.text);

                x = startX;
                doc.text(String(rowNum), x, y + 6, { width: colWidths[0], align: 'center' }); x += colWidths[0];
                doc.text(deductee.name || '-', x + 2, y + 6, { width: colWidths[1] - 4, align: 'left', lineBreak: false }); x += colWidths[1];
                doc.text(deductee.pan || '-', x, y + 6, { width: colWidths[2], align: 'center' }); x += colWidths[2];
                const dt1 = entry.payment_date ? new Date(entry.payment_date).toLocaleDateString() : '-';
                const dt2 = entry.deducted_date ? new Date(entry.deducted_date).toLocaleDateString() : '-';
                doc.text(dt1, x, y + 6, { width: colWidths[3], align: 'center' }); x += colWidths[3];
                doc.text(dt2, x, y + 6, { width: colWidths[4], align: 'center' }); x += colWidths[4];

                const nums = [safeNum(entry.amount_of_payment), safeNum(entry.income_tax), safeNum(entry.surcharge), safeNum(entry.cess), safeNum(entry.tax_deposited)];
                nums.forEach((val, i) => {
                    doc.text(val.toFixed(2), x + 1, y + 6, { width: colWidths[i + 5] - 2, align: 'right' });
                    x += colWidths[i + 5];
                });

                doc.text(safeNum(entry.rate).toFixed(2), x, y + 6, { width: colWidths[10], align: 'center' }); x += colWidths[10];
                doc.text(entry.section || '-', x, y + 6, { width: colWidths[11], align: 'center' }); x += colWidths[11];
                doc.text(entry.remarks || '-', x, y + 6, { width: colWidths[12], align: 'center' });

                doc.y = y + 18;
                rowNum++;
            });
        }
        doc.moveDown(1);
    }

    addSummary(doc, challans, deductions, margins, pageWidth) {
        if (doc.y > 650) doc.addPage();

        doc.fontSize(12).font('Helvetica-Bold').fillColor(this.colors.primary).text('SUMMARY', margins);
        doc.moveDown(0.4);

        const safeNum = (val) => isNaN(Number(val)) ? 0 : Number(val);

        const totalTds = deductions.reduce((sum, d) => sum + safeNum(d.income_tax), 0);
        const totalSurcharge = deductions.reduce((sum, d) => sum + safeNum(d.surcharge), 0);
        const totalCess = deductions.reduce((sum, d) => sum + safeNum(d.cess), 0);
        const totalInterest = challans.reduce((sum, c) => sum + safeNum(c.interest), 0);
        const totalFees = challans.reduce((sum, c) => sum + safeNum(c.fee), 0);
        const totalTaxDeposited = safeNum(totalTds + totalSurcharge + totalCess + totalInterest + totalFees);

        const boxWidth = (pageWidth - (2 * margins)) / 2 - 10;
        const startX = margins;
        const startY = doc.y;

        this.drawSummaryBox(doc, startX, startY, boxWidth, 'Statistics', [
            ['Total Challans', challans.length],
            ['Total Deductees', new Set(deductions.map(d => d.deductee_id)).size],
            ['Total Entries', deductions.length]
        ]);

        this.drawSummaryBox(doc, startX + boxWidth + 20, startY, boxWidth, 'Financial Totals', [
            ['Income Tax', totalTds.toFixed(2)],
            ['Interest / Fees', (totalInterest + totalFees).toFixed(2)],
            ['Grand Total', totalTaxDeposited.toFixed(2)]
        ], true);

        doc.y = startY + 85;
    }

    drawSummaryBox(doc, x, y, width, title, data, highlight = false) {
        doc.fillColor(this.colors.headerBg).rect(x, y, width, 75).fill();
        doc.rect(x, y, width, 75).lineWidth(0.5).strokeColor(this.colors.border).stroke();

        doc.fontSize(10).font('Helvetica-Bold').fillColor(highlight ? this.colors.accent : this.colors.primary).text(title, x + 8, y + 8);

        let rowY = y + 25;
        data.forEach(([label, value], i) => {
            const isLast = i === data.length - 1;
            if (isLast && highlight) doc.font('Helvetica-Bold').fillColor(this.colors.accent);
            else doc.font('Helvetica').fillColor(this.colors.text);

            doc.fontSize(9).text(label, x + 8, rowY);
            doc.text(String(value), x + width - 80, rowY, { width: 72, align: 'right' });
            rowY += 16;
        });
    }

    drawEmptyRow(doc, x, width, text, fontSize) {
        const y = doc.y;
        doc.rect(x, y, width, 25).strokeColor(this.colors.border).stroke();
        doc.fontSize(fontSize).font('Helvetica-Oblique').fillColor(this.colors.secondary).text(text, x, y + 8, { width: width, align: 'center' });
        doc.y = y + 25;
    }

    addFooter(doc, r, margins, pageWidth, pageHeight) {
        const footerY = pageHeight - margins - 50;
        doc.moveTo(margins, footerY).lineTo(pageWidth - margins, footerY).lineWidth(0.5).strokeColor(this.colors.border).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.primary).text('Verification & Certification', margins, footerY + 10);
        doc.fontSize(7).font('Helvetica').fillColor(this.colors.secondary).text('Certified that the information furnished above is correct and complete as per system records.', margins, footerY + 22);

        const timestamp = new Date().toLocaleString();
        const returnIdShort = (r && r.id) ? r.id.substring(0, 8) : 'N/A';
        doc.fontSize(7).fillColor(this.colors.secondary).text(`TDS Pro Assistant • System ID: ${returnIdShort} • Generated: ${timestamp}`, { align: 'right' });

        // Add Page Numbers
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(7).fillColor(this.colors.secondary).text(
                `Page ${i + 1} of ${range.count}`,
                margins,
                pageHeight - (margins / 2) - 10,
                { align: 'center', width: pageWidth - (2 * margins) }
            );
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

        const challans = await q('SELECT * FROM challans WHERE deductor_id = ? AND financial_year = ? AND quarter = ?', [r.deductor_id, r.financial_year, r.quarter]);

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
}
