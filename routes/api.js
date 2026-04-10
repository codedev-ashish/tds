import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import XLSX from 'xlsx';
import multer from 'multer';
import crypto from 'crypto';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Helper to execute queries
const query = (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const results = await query(req.db, 'SELECT * FROM users WHERE email = ? AND password_hash = ?', [email, password]);
        if (results.length > 0) {
            const user = results[0];
            // Don't send password back
            delete user.password_hash;
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Deductors ---

router.get('/deductors', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM deductors');
        const mapped = results.map(r => ({
            id: r.id,
            userId: r.user_id,
            tan: r.tan,
            pan: r.pan,
            gstin: r.gstin,
            name: r.name,
            branch: r.branch,
            type: r.type,
            flat: r.flat,
            building: r.building,
            road: r.road,
            area: r.area,
            city: r.city,
            state: r.state,
            pincode: r.pincode,
            std: r.std,
            phone: r.phone,
            altStd: r.alt_std,
            altPhone: r.alt_phone,
            email: r.email,
            altEmail: r.alt_email,
            responsiblePerson: r.responsible_person,
            responsibleDesignation: r.responsible_designation,
            responsibleFatherName: r.responsible_father_name,
            responsibleMobile: r.responsible_mobile,
            responsiblePan: r.responsible_pan,
            rpFlat: r.rp_flat,
            rpBuilding: r.rp_building,
            rpRoad: r.rp_road,
            rpArea: r.rp_area,
            rpCity: r.rp_city,
            rpState: r.rp_state,
            rpPincode: r.rp_pincode,
            rpStd: r.rp_std,
            rpPhone: r.rp_phone,
            rpAltStd: r.rp_alt_std,
            rpAltPhone: r.rp_alt_phone,
            rpEmail: r.rp_email,
            rpAltEmail: r.rp_alt_email,
            govPaoCode: r.gov_pao_code,
            govPaoRegNo: r.gov_pao_reg_no,
            govDdoCode: r.gov_ddo_code,
            govDdoRegNo: r.gov_ddo_reg_no,
            govState: r.gov_state,
            govMinistry: r.gov_ministry,
            govOtherMinistry: r.gov_other_ministry,
            govAin: r.gov_ain,
            deductorCode: r.deductor_code,
            addressChangeFlag: r.address_change_flag,
            itPassword: r.it_password
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/deductors', async (req, res) => {
    const d = req.body;

    const dbDeductor = {
        id: d.id,
        user_id: d.userId,
        tan: d.tan,
        pan: d.pan,
        gstin: d.gstin,
        name: d.name,
        branch: d.branch,
        type: d.type,
        flat: d.flat,
        building: d.building,
        road: d.road,
        area: d.area,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        std: d.std,
        phone: d.phone,
        alt_std: d.altStd,
        alt_phone: d.altPhone,
        email: d.email,
        alt_email: d.altEmail,
        responsible_person: d.responsiblePerson,
        responsible_designation: d.responsibleDesignation,
        responsible_father_name: d.responsibleFatherName,
        responsible_mobile: d.responsibleMobile,
        responsible_pan: d.responsiblePan,
        rp_flat: d.rpFlat,
        rp_building: d.rpBuilding,
        rp_road: d.rpRoad,
        rp_area: d.rpArea,
        rp_city: d.rpCity,
        rp_state: d.rpState,
        rp_pincode: d.rpPincode,
        rp_std: d.rpStd,
        rp_phone: d.rpPhone,
        rp_alt_std: d.rpAltStd,
        rp_alt_phone: d.rpAltPhone,
        rp_email: d.rpEmail,
        rp_alt_email: d.rpAltEmail,
        gov_pao_code: d.govPaoCode,
        gov_pao_reg_no: d.govPaoRegNo,
        gov_ddo_code: d.govDdoCode,
        gov_ddo_reg_no: d.govDdoRegNo,
        gov_state: d.govState,
        gov_ministry: d.govMinistry,
        gov_other_ministry: d.govOtherMinistry,
        gov_ain: d.govAin,
        deductor_code: d.deductorCode || 'D',
        address_change_flag: d.addressChangeFlag || 'N',
        it_password: d.itPassword,

        // Fix: Map fields to DB schema expectations
        user_id: d.userId, // Ensure ownership
        street: d.road,    // Map frontend 'road' to DB 'street'
        rp_street: d.rpRoad, // Map frontend 'rpRoad' to DB 'rp_street'

        // Legacy/Duplicate column support (if they exist)
        road: d.road,
        rp_road: d.rpRoad
    };
    const sql = `INSERT INTO deductors SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        // Handle potential missing fields or formatting here if needed
        await query(req.db, sql, [dbDeductor, dbDeductor]);
        res.json({ message: 'Deductor saved', id: d.id });
    } catch (err) {
        console.error('Error saving deductor:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Challans ---

router.get('/challans', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM challans');
        const mapped = results.map(r => ({
            id: r.id,
            deductorId: r.deductor_id,
            bsrCode: r.bsr_code,
            date: r.date,
            serialNo: r.serial_no,
            tds: Number(r.tds),
            surcharge: Number(r.surcharge),
            educationCess: Number(r.education_cess),
            interest: Number(r.interest),
            fee: Number(r.fee),
            others: Number(r.others),
            total: Number(r.total),
            minorHead: r.minor_head,
            interestAllocated: Number(r.interest_allocated),
            othersAllocated: Number(r.others_allocated),
            quarter: r.quarter,
            financialYear: r.financial_year,
            status: r.status
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/challans', async (req, res) => {
    const c = req.body;
    const sql = `INSERT INTO challans SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        const dbChallan = {
            id: c.id,
            deductor_id: c.deductorId,
            bsr_code: c.bsrCode,
            date: c.date,
            serial_no: c.serialNo,
            tds: c.tds,
            surcharge: c.surcharge,
            education_cess: c.educationCess,
            interest: c.interest,
            fee: c.fee,
            others: c.others,
            total: c.total,
            minor_head: c.minorHead,
            interest_allocated: c.interestAllocated,
            others_allocated: c.othersAllocated,
            quarter: c.quarter,
            financial_year: c.financialYear,
            status: c.status || 'Draft'
        };
        const result = await query(req.db, sql, [dbChallan, dbChallan]);
        res.json({ message: 'Challan saved', id: c.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/challans/:id', async (req, res) => {
    try {
        await query(req.db, 'DELETE FROM challans WHERE id = ?', [req.params.id]);
        res.json({ message: 'Challan deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Deductees ---

router.get('/deductees', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM deductees');
        const mapped = results.map(r => ({
            id: r.id,
            deductorId: r.deductor_id,
            name: r.name,
            pan: r.pan,
            code: r.code,
            deducteeStatus: r.deductee_status,
            buyerSellerFlag: r.buyer_seller_flag,
            email: r.email,
            mobile: r.mobile,
            address: r.address
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/deductees', async (req, res) => {
    const d = req.body;

    const dbDeductee = {
        id: d.id,
        deductor_id: d.deductorId,
        name: d.name,
        pan: d.pan,
        code: d.code,
        deductee_status: d.deducteeStatus || 'O',
        buyer_seller_flag: d.buyerSellerFlag || '2',
        email: d.email,
        mobile: d.mobile,
        address: d.address
    };
    const sql = `INSERT INTO deductees SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        console.log('Saving deductee:', d.id);
        const result = await query(req.db, sql, [dbDeductee, dbDeductee]);
        console.log('Deductee saved result:', result.affectedRows);
        res.json({ message: 'Deductee saved', id: d.id });
    } catch (err) {
        console.error('Error saving deductee:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Deductions ---

router.get('/deductions', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM deduction_entries');
        const mapped = results.map(r => ({
            id: r.id,
            deductorId: r.deductor_id,
            challanId: r.challan_id,
            deducteeId: r.deductee_id,
            section: r.section,
            paymentDate: r.payment_date,
            deductedDate: r.deducted_date,
            amountOfPayment: Number(r.amount_of_payment),
            rate: Number(r.rate),
            incomeTax: Number(r.income_tax),
            surcharge: Number(r.surcharge),
            cess: Number(r.cess),
            totalTax: Number(r.total_tax),
            taxDeposited: Number(r.tax_deposited),
            remarks: r.remarks,
            certificateNo: r.certificate_no,
            status: r.status
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/deductions', async (req, res) => {
    const d = req.body;
    // Map camelCase to snake_case if needed, but if we use SET ? it expects object keys to match column names.
    // We need to ensure the frontend sends snake_case or we map it here.
    // For simplicity, let's assume we'll map it in the frontend or here.
    // Let's map it here to be safe, as the frontend uses camelCase.

    const dbEntry = {
        id: d.id,
        deductor_id: d.deductorId,
        challan_id: d.challanId,
        deductee_id: d.deducteeId,
        section: d.section,
        payment_date: d.paymentDate,
        deducted_date: d.deductedDate,
        amount_of_payment: d.amountOfPayment,
        rate: d.rate,
        income_tax: d.incomeTax,
        surcharge: d.surcharge,
        cess: d.cess,
        total_tax: d.totalTax,
        tax_deposited: d.taxDeposited,
        remarks: d.remarks,
        certificate_no: d.certificateNo,
        status: d.status || 'Draft'
    };

    const sql = `INSERT INTO deduction_entries SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        const result = await query(req.db, sql, [dbEntry, dbEntry]);
        res.json({ message: 'Deduction saved', id: d.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/deductions/:id', async (req, res) => {
    try {
        await query(req.db, 'DELETE FROM deduction_entries WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deduction deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Returns ---

router.get('/returns', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM tds_returns');
        // Map back to camelCase for frontend
        const mapped = results.map(r => ({
            id: r.id,
            deductorId: r.deductor_id,
            financialYear: r.financial_year,
            quarter: r.quarter,
            formNo: r.form_no,
            formType: r.form_type,
            status: r.status,
            type: r.type,
            updatedAt: r.updated_at,
            previousTokenNumber: r.previous_token_number
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/returns', async (req, res) => {
    const r = req.body;
    const dbReturn = {
        id: r.id,
        deductor_id: r.deductorId,
        financial_year: r.financialYear,
        quarter: r.quarter,
        form_no: r.formNo,
        form_type: r.formType,
        status: r.status,
        type: r.type,
        updated_at: new Date(r.updatedAt),
        previous_token_number: r.previousTokenNumber
    };

    const sql = `INSERT INTO tds_returns SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        await query(req.db, sql, [dbReturn, dbReturn]);
        res.json({ message: 'Return saved', id: r.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/returns/:id', async (req, res) => {
    const returnId = req.params.id;
    console.log('DELETE request for return ID:', returnId);
    try {
        // 1. Get return details to identify the period
        const returns = await query(req.db, 'SELECT * FROM tds_returns WHERE id = ?', [returnId]);
        if (returns.length === 0) {
            return res.status(404).json({ error: 'Return not found' });
        }
        const r = returns[0];

        // 2. Delete the return
        const result = await query(req.db, 'DELETE FROM tds_returns WHERE id = ?', [returnId]);
        console.log('Delete result:', result.affectedRows, 'rows affected');

        // 3. If it was a Draft return, also delete associated Draft Challans (which cascades to deductions)
        if (r.status === 'Draft') {
            const deleteChallansSql = `
                DELETE FROM challans 
                WHERE deductor_id = ? 
                AND financial_year = ? 
                AND quarter = ? 
                AND status = 'Draft'
            `;
            const challanResult = await query(req.db, deleteChallansSql, [r.deductor_id, r.financial_year, r.quarter]);
            console.log('Deleted associated draft challans:', challanResult.affectedRows);
        }

        res.json({ message: 'Return and associated drafts deleted' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Helper to get storage path
const getStoragePath = (deductorName, fy, quarter) => {
    const sanitize = (name) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const baseDir = path.join(process.cwd(), 'files');
    return path.join(baseDir, sanitize(deductorName), sanitize(fy), sanitize(quarter));
};

router.get('/returns/:id/fvu', async (req, res) => {
    try {
        const returnId = req.params.id;
        // Join with deductors to get name
        const result = await query(req.db, `
            SELECT r.*, d.name as deductor_name, d.tan 
            FROM tds_returns r 
            JOIN deductors d ON r.deductor_id = d.id 
            WHERE r.id = ?
        `, [returnId]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Return not found' });
        }

        const r = result[0];
        const dirPath = getStoragePath(r.deductor_name, r.financial_year, r.quarter);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const fileName = `return_${r.id.substring(0, 8)}.fvu`;
        const filePath = path.join(dirPath, fileName);

        // Create dummy file if not exists
        if (!fs.existsSync(filePath)) {
            const fvuContent = `
FVU File Details
----------------
Return ID: ${r.id}
Deductor: ${r.deductor_name} (${r.tan})
Financial Year: ${r.financial_year}
Quarter: ${r.quarter}
Form: ${r.form_no}
Status: ${r.status}
FVU Version: 9.3
Generated On: ${new Date().toISOString()}

This is a placeholder for the actual FVU file content.
            `.trim();
            fs.writeFileSync(filePath, fvuContent);
        }

        res.download(filePath, fileName);

    } catch (err) {
        console.error('FVU Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/returns/:id/fvu', async (req, res) => {
    try {
        const returnId = req.params.id;
        const { content } = req.body;

        if (!content) return res.status(400).json({ error: 'No content provided' });

        const result = await query(req.db, `
            SELECT r.*, d.name as deductor_name 
            FROM tds_returns r 
            JOIN deductors d ON r.deductor_id = d.id 
            WHERE r.id = ?`, [returnId]);

        if (result.length === 0) return res.status(404).json({ error: 'Return not found' });

        const r = result[0];
        const dirPath = getStoragePath(r.deductor_name, r.financial_year, r.quarter);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const fileName = `return_${r.id.substring(0, 8)}.fvu`;
        const filePath = path.join(dirPath, fileName);

        fs.writeFileSync(filePath, content);
        console.log(`Saved FVU content to ${filePath}`);
        res.json({ message: 'FVU file saved successfully' });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
});


// Import generators
import { TdsGenerator } from '../services/tds_generator.js';
import { PdfGenerator } from '../services/pdf_generator.js';
import { CsiValidator } from '../services/csi_validator.js';
import { PortalAutomation } from '../services/portal_automation.js';

router.post('/returns/:id/download-csi', async (req, res) => {
    try {
        const returnId = req.params.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Income Tax password is required' });
        }

        // 1. Fetch Return & Deductor (TAN)
        const result = await query(req.db, `
            SELECT r.*, d.tan 
            FROM tds_returns r 
            JOIN deductors d ON r.deductor_id = d.id 
            WHERE r.id = ?
        `, [returnId]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Return not found' });
        }

        const r = result[0];

        // 2. Determine Date Range
        const automation = new PortalAutomation();
        const { from, to } = automation.getDateRangeForReturn(r.quarter, r.financial_year);

        // 3. Trigger Automation
        console.log(`[API] Triggering CSI Download for TAN ${r.tan} (${from} - ${to})`);
        const csiContent = await automation.downloadCsi(r.tan, password, from, to);

        res.json({
            message: 'CSI file downloaded successfully from portal',
            csiContent: csiContent
        });

    } catch (err) {
        console.error('CSI Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/portal/launch', async (req, res) => {
    try {
        const { tan, password } = req.body;

        if (!tan) {
            return res.status(400).json({ error: 'TAN is required to launch portal.' });
        }

        const automation = new PortalAutomation();
        console.log(`[API] Launching Portal for TAN: ${tan}`);

        // We trigger this asynchronously because we want the browser to stay open but the API to return quickly
        automation.launchPortal(tan, password).catch(err => {
            console.error('[API] Async Portal Launch Error:', err);
        });

        res.json({
            success: true,
            message: 'Income Tax Portal is launching in a new window. Please wait...'
        });
    } catch (err) {
        console.error('Portal Launch Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/returns/:id/validate-csi', async (req, res) => {
    try {
        const returnId = req.params.id;
        const { csiContent } = req.body;

        if (!csiContent) {
            return res.status(400).json({ error: 'CSI content is required' });
        }

        const validator = new CsiValidator(req.db);
        const result = await validator.validate(returnId, csiContent);

        res.json(result);

    } catch (err) {
        console.error('CSI Validation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/returns/:id/txt', async (req, res) => {
    try {
        const returnId = req.params.id;
        const result = await query(req.db, `
            SELECT r.*, d.name as deductor_name, d.tan 
            FROM tds_returns r 
            JOIN deductors d ON r.deductor_id = d.id 
            WHERE r.id = ?
        `, [returnId]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Return not found' });
        }

        const r = result[0];
        const dirPath = getStoragePath(r.deductor_name, r.financial_year, r.quarter);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const fileName = `return_${r.id.substring(0, 8)}.txt`;
        const filePath = path.join(dirPath, fileName);
        const errorLogPath = path.join('generatedfile', `${r.id.substring(0, 8)}_errors.log`);

        // Ensure generatedfile directory exists
        if (!fs.existsSync('generatedfile')) {
            fs.mkdirSync('generatedfile', { recursive: true });
        }

        // Generate using TdsGenerator
        console.log(`Generating TDS file for return ${returnId}...`);
        const generator = new TdsGenerator(req.db);

        try {
            await generator.generate(returnId, filePath);
            console.log(`Saved TXT content to ${filePath}`);

            // Clear error log on successful generation
            if (fs.existsSync(errorLogPath)) {
                fs.unlinkSync(errorLogPath);
            }

            res.download(filePath, fileName);
        } catch (genErr) {
            console.error('Generation Error:', genErr);

            // Log error details
            const errorLog = {
                timestamp: new Date().toISOString(),
                returnId: returnId,
                deductorName: r.deductor_name,
                tan: r.tan,
                financialYear: r.financial_year,
                quarter: r.quarter,
                formNo: r.form_no,
                error: genErr.message,
                stack: genErr.stack,
                details: genErr.toString()
            };

            fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
            console.log(`Error log saved to ${errorLogPath}`);

            res.status(500).json({
                error: genErr.message,
                errorLogFile: errorLogPath,
                hint: 'Check error log in generatedfile folder for details'
            });
        }

    } catch (err) {
        console.error('TXT Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/returns/:id/pdf', async (req, res) => {
    try {
        const returnId = req.params.id;
        console.log(`[PDF] Request received for return: ${returnId}`);

        const result = await query(req.db, `
            SELECT r.*, d.name as deductor_name, d.tan 
            FROM tds_returns r 
            JOIN deductors d ON r.deductor_id = d.id 
            WHERE r.id = ?
        `, [returnId]);

        if (result.length === 0) {
            console.log(`[PDF] Return not found: ${returnId}`);
            return res.status(404).json({ error: 'Return not found' });
        }

        const r = result[0];
        console.log(`[PDF] Return found: ${r.deductor_name} - ${r.form_no}`);

        const dirPath = getStoragePath(r.deductor_name, r.financial_year, r.quarter);

        if (!fs.existsSync(dirPath)) {
            console.log(`[PDF] Creating directory: ${dirPath}`);
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Professional Filename Convention: 27A_[TAN]_[FORM]_[QTR]_[FY].pdf
        const fySanitized = r.financial_year.replace('-', ''); // 2024-25 -> 202425
        const fileName = `27A_${r.tan}_${r.form_no}_${r.quarter}_${fySanitized}.pdf`;
        const filePath = path.join(dirPath, fileName);
        const errorLogPath = path.join('generatedfile', `${r.id.substring(0, 8)}_pdf_errors.log`);

        // Ensure generatedfile directory exists
        if (!fs.existsSync('generatedfile')) {
            fs.mkdirSync('generatedfile', { recursive: true });
        }

        // Generate using PdfGenerator
        console.log(`[PDF] Generating PDF file for return ${returnId}...`);
        const generator = new PdfGenerator(req.db);

        try {
            await generator.generate(returnId, filePath);
            console.log(`[PDF] Saved PDF content to ${filePath}`);

            // Clear error log on successful generation
            if (fs.existsSync(errorLogPath)) {
                fs.unlinkSync(errorLogPath);
            }

            console.log(`[PDF] Sending file download...`);
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error(`[PDF] Error during download: ${err.message}`);
                } else {
                    console.log(`[PDF] Download completed successfully`);
                }
            });
        } catch (genErr) {
            console.error('[PDF] Generation Error:', genErr);

            // Log error details
            const errorLog = {
                timestamp: new Date().toISOString(),
                returnId: returnId,
                deductorName: r.deductor_name,
                tan: r.tan,
                financialYear: r.financial_year,
                quarter: r.quarter,
                formNo: r.form_no,
                error: genErr.message,
                stack: genErr.stack,
                details: genErr.toString()
            };

            fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
            console.log(`[PDF] Error log saved to ${errorLogPath}`);

            res.status(500).json({
                error: genErr.message,
                errorLogFile: errorLogPath,
                hint: 'Check error log in generatedfile folder for details'
            });
        }

    } catch (err) {
        console.error('[PDF] Download Error:', err);
        res.status(500).json({ error: err.message });
    }
});


// --- News ---
router.post('/news', async (req, res) => {
    const n = req.body;
    const sql = `INSERT INTO news SET ?`;
    try {
        await query(req.db, sql, n);
        res.json({ message: 'News added', id: n.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/news/:id', async (req, res) => {
    try {
        await query(req.db, 'DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ message: 'News deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Support Tickets ---

router.get('/tickets', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM support_tickets ORDER BY date DESC');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tickets', async (req, res) => {
    const t = req.body;
    const dbTicket = {
        id: t.id,
        user_id: t.userId,
        type: t.type,
        subject: t.subject,
        description: t.description,
        status: t.status,
        date: new Date(t.date),
        resolution: t.resolution
    };
    const sql = `INSERT INTO support_tickets SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        await query(req.db, sql, [dbTicket, dbTicket]);
        res.json({ message: 'Ticket saved', id: t.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Users ---

router.get('/users', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM users');
        const mapped = results.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            plan: u.plan,
            lastLogin: u.last_login,
            location: u.location,
            joinedAt: u.joined_at
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/users', async (req, res) => {
    const u = req.body;
    const dbUser = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        plan: u.plan,
        last_login: u.lastLogin ? new Date(u.lastLogin) : null,
        location: u.location,
        joined_at: u.joinedAt ? new Date(u.joinedAt) : null
    };
    const sql = `INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        await query(req.db, sql, [dbUser, dbUser]);
        res.json({ message: 'User saved', id: u.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await query(req.db, 'DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Subscription Plans ---

router.get('/plans', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM subscription_plans');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/plans', async (req, res) => {
    const p = req.body;
    const sql = `INSERT INTO subscription_plans SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        await query(req.db, sql, [p, p]);
        res.json({ message: 'Plan saved', id: p.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/plans/:id', async (req, res) => {
    try {
        await query(req.db, 'DELETE FROM subscription_plans WHERE id = ?', [req.params.id]);
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Ad Units ---

router.get('/ads', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM ad_units');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/ads', async (req, res) => {
    const ad = req.body;
    const sql = `INSERT INTO ad_units SET ? ON DUPLICATE KEY UPDATE ?`;
    try {
        await query(req.db, sql, [ad, ad]);
        res.json({ message: 'Ad saved', id: ad.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/ads/:id', async (req, res) => {
    try {
        await query(req.db, 'DELETE FROM ad_units WHERE id = ?', [req.params.id]);
        res.json({ message: 'Ad deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Chat Messages ---

router.get('/chat/:userId', async (req, res) => {
    try {
        const results = await query(req.db,
            'SELECT * FROM chat_messages WHERE sender_id = ? OR receiver_id = ? ORDER BY timestamp ASC',
            [req.params.userId, req.params.userId]
        );
        const mapped = results.map(m => ({
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            timestamp: m.timestamp
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/chat', async (req, res) => {
    const m = req.body;
    const dbMsg = {
        id: m.id,
        sender_id: m.senderId,
        receiver_id: m.receiverId,
        text: m.text,
        timestamp: new Date(m.timestamp)
    };
    const sql = `INSERT INTO chat_messages SET ?`;
    try {
        await query(req.db, sql, dbMsg);
        res.json({ message: 'Message sent', id: m.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Notifications ---

router.get('/notifications', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM notifications ORDER BY sent_at DESC');
        const mapped = results.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            audience: n.audience,
            sentAt: n.sent_at,
            type: n.type
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/notifications', async (req, res) => {
    const n = req.body;
    const dbNotif = {
        id: n.id,
        title: n.title,
        message: n.message,
        image_url: n.imageUrl,
        link_url: n.linkUrl,
        audience: n.audience,
        sent_at: new Date(n.sentAt),
        type: n.type
    };
    const sql = `INSERT INTO notifications SET ?`;
    try {
        await query(req.db, sql, dbNotif);
        res.json({ message: 'Notification sent', id: n.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Settings ---

router.get('/settings', async (req, res) => {
    try {
        const results = await query(req.db, 'SELECT * FROM settings');
        const settings = {};
        results.forEach(r => {
            try {
                settings[r.key] = JSON.parse(r.value);
            } catch (e) {
                settings[r.key] = r.value;
            }
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/settings', async (req, res) => {
    const settings = req.body;
    try {
        const promises = Object.entries(settings).map(([key, value]) => {
            const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return query(req.db, 'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [key, valStr, valStr]);
        });
        await Promise.all(promises);
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- System Tools ---

router.post('/system/backup', async (req, res) => {
    try {
        // In a real scenario, we'd use mysqldump. For now, we'll return a JSON of all tables.
        const tables = ['users', 'deductors', 'deductees', 'challans', 'deduction_entries', 'tds_returns', 'news', 'support_tickets', 'ad_units', 'subscription_plans', 'notifications', 'settings'];
        const backup = { timestamp: new Date().toISOString(), data: {} };

        for (const table of tables) {
            backup.data[table] = await query(req.db, `SELECT * FROM ${table}`);
        }

        res.json(backup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Analytics ---

router.get('/analytics', async (req, res) => {
    try {
        const [userCount, planStats, locationStats] = await Promise.all([
            query(req.db, 'SELECT COUNT(*) as count FROM users'),
            query(req.db, 'SELECT plan as name, COUNT(*) as value FROM users GROUP BY plan'),
            query(req.db, 'SELECT location as name, COUNT(*) as value FROM users WHERE location IS NOT NULL GROUP BY location')
        ]);

        res.json({
            totalUsers: userCount[0].count,
            plans: planStats,
            locations: locationStats,
            // Mocking visit trends for now as we don't have a visits table yet
            visits: [
                { name: 'Mon', count: 120 }, { name: 'Tue', count: 145 }, { name: 'Wed', count: 132 },
                { name: 'Thu', count: 180 }, { name: 'Fri', count: 210 }, { name: 'Sat', count: 85 }, { name: 'Sun', count: 60 }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TXT Validation & Debugging ---

router.post('/returns/:id/validate-txt', async (req, res) => {
    try {
        const returnId = req.params.id;
        const validation = {
            returnId: returnId,
            timestamp: new Date().toISOString(),
            checks: [],
            errors: [],
            warnings: [],
            isValid: true
        };

        // Check 1: Return exists
        const returnResult = await query(req.db, `
            SELECT r.*, d.name as deductor_name, d.tan 
            FROM tds_returns r 
            JOIN deductors d ON r.deductor_id = d.id 
            WHERE r.id = ?
        `, [returnId]);

        if (returnResult.length === 0) {
            validation.errors.push('Return not found in database');
            validation.isValid = false;
        } else {
            const ret = returnResult[0];
            validation.checks.push(`✓ Return found: ${ret.deductor_name} (${ret.tan})`);

            // Check for token validity (15 digits for corrections/regular if provided)
            if (ret.previous_token_number) {
                const tokenDigits = String(ret.previous_token_number).replace(/\D/g, '');
                if (tokenDigits.length > 0 && tokenDigits.length !== 15) {
                    validation.warnings.push(`Receipt Reference Number should be exactly 15 digits, currently ${tokenDigits.length} digits. Will be padded to 15 digits.`);
                } else if (tokenDigits.length === 15) {
                    validation.checks.push(`✓ Receipt Reference Number valid: ${tokenDigits}`);
                }
            }

            // Check 2: Verify deductor data
            const deductorResult = await query(req.db, 'SELECT * FROM deductors WHERE id = ?', [ret.deductor_id]);
            if (deductorResult.length > 0) {
                const deductor = deductorResult[0];
                validation.checks.push(`✓ Deductor verified: ${deductor.name}`);
                if (!deductor.tan) validation.errors.push('Deductor TAN is missing');
                if (!deductor.pan) validation.errors.push('Deductor PAN is missing');
                if (!deductor.state) validation.errors.push('Deductor State is missing (MANDATORY)');
                if (!deductor.rp_state) {
                    validation.warnings.push('Responsible Person State is missing - will use Deductor State');
                }
            }

            // Check 3: Verify challans exist
            const challanResult = await query(req.db,
                'SELECT COUNT(*) as count FROM challans WHERE deductor_id = ? AND financial_year = ? AND quarter = ?',
                [ret.deductor_id, ret.financial_year, ret.quarter]
            );
            if (challanResult[0].count > 0) {
                validation.checks.push(`✓ Challans found: ${challanResult[0].count}`);
            } else {
                validation.warnings.push('No challans found - file may not generate properly');
            }

            // Check 4: Verify deductions exist
            const deductionResult = await query(req.db,
                'SELECT COUNT(*) as count FROM deduction_entries WHERE deductor_id = ? AND deducted_date >= ? AND deducted_date <= ?',
                [ret.deductor_id, `${ret.financial_year.split('-')[0]}-04-01`, `${ret.financial_year.split('-')[1]}-03-31`]
            );
            if (deductionResult[0].count > 0) {
                validation.checks.push(`✓ Deductions found: ${deductionResult[0].count}`);
            } else {
                validation.warnings.push('No deductions found - file may be invalid');
            }

            // Check 5: Verify deductees exist AND have deductions
            const deducteeResult = await query(req.db,
                'SELECT COUNT(*) as count FROM deductees WHERE deductor_id = ?',
                [ret.deductor_id]
            );
            if (deducteeResult[0].count > 0) {
                validation.checks.push(`✓ Deductees configured: ${deducteeResult[0].count}`);
            } else {
                validation.errors.push('No deductees found - at least one deductee/collectee record is required (Income Tax Department guideline)');
                validation.isValid = false;
            }

            // Check 6: Verify deductee-deduction links (DD records that will be generated)
            const deducteeDeductionResult = await query(req.db, `
                SELECT COUNT(DISTINCT de.deductee_id) as count 
                FROM deduction_entries de 
                WHERE de.deductor_id = ? 
                AND de.deducted_date >= ? 
                AND de.deducted_date <= ?
            `, [ret.deductor_id, `${ret.financial_year.split('-')[0]}-04-01`, `${ret.financial_year.split('-')[1]}-03-31`]);

            if (deducteeDeductionResult[0].count > 0) {
                validation.checks.push(`✓ Deductee Deduction Links found: ${deducteeDeductionResult[0].count} deductees with deductions`);
            } else {
                validation.errors.push('No deduction entries linked to deductees - at least one deductee/collectee detail record (DD record) is required');
                validation.isValid = false;
            }
        }

        // Save validation report
        if (!fs.existsSync('generatedfile')) {
            fs.mkdirSync('generatedfile', { recursive: true });
        }

        const reportPath = path.join('generatedfile', `${returnId.substring(0, 8)}_validation.json`);
        fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));

        res.json({
            ...validation,
            reportFile: reportPath
        });
    } catch (err) {
        console.error('Validation Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Excel Imports ---

router.post('/import/deductors', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        if (data.length > 0) {
            console.log('Debugging Deductor Excel Row Keys:', Object.keys(data[0]));
        }
        let count = 0;

        for (const row of data) {
            const id = crypto.randomUUID();
            // Helper to get value loosely (ignoring check for * if strictly needed, but better to match exact key)
            // We'll use strict keys based on template
            const deductor = {
                id,
                name: row['Company / Deductor Name *'] || row['Company / Deductor Name'] || row['Company Name'],
                tan: row['TAN *'] || row['TAN'],
                pan: row['PAN *'] || row['PAN'],
                gstin: row['GSTIN'],
                branch: row['Branch / Division *'] || row['Branch / Division'] || row['Branch'],
                type: row['Deductor Type *'] || row['Deductor Type'],
                flat: row['Flat / Door / Block *'] || row['Flat / Door / Block'] || row['Flat'],
                building: row['Building *'] || row['Building'],
                street: row['Road / Street / Lane *'] || row['Road / Street / Lane'] || row['Street'] || row['Road'],
                area: row['Area / Locality *'] || row['Area / Locality'] || row['Area'],
                city: row['Town / District *'] || row['Town / District'] || row['City'],
                state: row['State *'] || row['State'],
                pincode: row['Pin *'] || row['Pin'] || row['Pincode'],
                std: row['STD'],
                phone: row['Phone Number *'] || row['Phone Number'] || row['Phone'],
                alt_std: row['Alt STD'],
                alt_phone: row['Alt Phone Number'],
                email: row['Email ID *'] || row['Email ID'] || row['Email'],
                alt_email: row['Alternate Email ID'],

                responsible_person: row['Responsible Person Name *'] || row['Responsible Person Name'],
                responsible_designation: row['Responsible Designation *'] || row['Responsible Designation'],
                responsible_father_name: row['Responsible Father Name'],
                responsible_mobile: row['Responsible Mobile *'] || row['Responsible Mobile'],
                responsible_pan: row['Responsible PAN *'] || row['Responsible PAN'],

                rp_flat: row['RP Flat / Door / Block *'] || row['RP Flat / Door / Block'] || row['RP Flat'],
                rp_building: row['RP Building *'] || row['RP Building'],
                rp_street: row['RP Road / Street / Lane *'] || row['RP Road / Street / Lane'] || row['RP Street'] || row['RP Road'],
                rp_area: row['RP Area / Locality *'] || row['RP Area / Locality'] || row['RP Area'],
                rp_city: row['RP Town / District *'] || row['RP Town / District'] || row['RP City'],
                rp_state: row['RP State *'] || row['RP State'],
                rp_pincode: row['RP Pin *'] || row['RP Pincode'] || row['RP Pin'],
                rp_std: row['RP STD'],
                rp_phone: row['RP Phone Number *'] || row['RP Phone Number'] || row['RP Phone'],
                rp_alt_std: row['RP Alt STD'],
                rp_alt_phone: row['RP Alt Phone Number'],
                rp_email: row['RP Email ID *'] || row['RP Email ID'] || row['RP Email'],
                rp_alt_email: row['RP Alternate Email ID'],

                gov_pao_code: row['Gov PAO Code'],
                gov_pao_reg_no: row['Gov PAO Reg No'],
                gov_ddo_code: row['Gov DDO Code'],
                gov_ddo_reg_no: row['Gov DDO Reg No'],
                gov_state: row['Gov State'],
                gov_ministry: row['Gov Ministry'],
                gov_other_ministry: row['Gov Other Ministry'],
                gov_ain: row['Gov AIN'],

                deductor_code: row['Deductor Code *'] || row['Deductor Code'] || 'D',
                address_change_flag: row['Address Change Flag *'] || row['Address Change Flag'] || 'N'
            };

            // Map frontend-like keys to DB keys if they differ (api.js map logic above seems to handle both or expect snake_case in SET ?)
            // The INSERT INTO ... SET ? expects keys to match column names.
            // Validation
            const missing = [];
            if (!deductor.name) missing.push('Company Name');
            if (!deductor.tan) missing.push('TAN');
            if (!deductor.pan) missing.push('PAN');
            if (!deductor.branch) missing.push('Branch / Division');
            if (!deductor.type) missing.push('Deductor Type');
            if (!deductor.building) missing.push('Building');
            if (!deductor.street) missing.push('Road/Street');
            if (!deductor.area) missing.push('Area/Locality');
            // if (!deductor.city) missing.push('City/District'); // Not mandatory in schema script? Wait, schema has NOT NULL? Yes.
            if (!deductor.state) missing.push('State');
            if (!deductor.pincode) missing.push('Pincode');
            if (!deductor.phone) missing.push('Phone Number');
            if (!deductor.email) missing.push('Email');
            if (!deductor.responsible_person) missing.push('Responsible Person Name');
            if (!deductor.responsible_designation) missing.push('Responsible Designation');
            // if (!deductor.responsible_mobile) missing.push('Responsible Mobile'); // Nullable in schema? Schema says varchar(20), NO NOT NULL? Wait.
            if (!deductor.responsible_pan) missing.push('Responsible PAN'); // Schema says VARCHAR(10). Is it not null? 
            if (!deductor.rp_building) missing.push('Responsible Person Building');
            if (!deductor.rp_street) missing.push('Responsible Person Street');
            if (!deductor.rp_area) missing.push('Responsible Person Area');
            if (!deductor.rp_phone) missing.push('Responsible Person Phone');

            // Let's check schema again briefly. 
            // deductors.responsible_mobile VARCHAR(20) - is it NOT NULL?
            // In step 156 view_file: 
            // 62:     responsible_mobile VARCHAR(20),
            // It is nullable! So keep it optional.
            // 63:     responsible_pan VARCHAR(10),
            // Nullable!

            // Adjust validation based on schema:
            // Mandatory in Schema: 
            // tan, pan, name, branch, type, building, street, area, city, state, pincode, phone, email,
            // responsible_person, responsible_designation,
            // rp_building, rp_street, rp_area, rp_phone.

            // Re-refine checks:
            if (!deductor.city) missing.push('City'); // Schema: city VARCHAR(255) NOT NULL

            if (missing.length > 0) {
                throw new Error(`Row ${count + 1}: Missing mandatory fields - ${missing.join(', ')}`);
            }

            // Let's create a clean DB object to be sure.
            const dbDeductor = {
                id: deductor.id,
                name: deductor.name,
                tan: deductor.tan,
                pan: deductor.pan,
                gstin: deductor.gstin,
                branch: deductor.branch,
                type: deductor.type,
                flat: deductor.flat,
                building: deductor.building,
                street: deductor.street,
                area: deductor.area,
                city: deductor.city,
                state: deductor.state,
                pincode: deductor.pincode,
                std: deductor.std,
                phone: deductor.phone,
                alt_std: deductor.alt_std,
                alt_phone: deductor.alt_phone,
                email: deductor.email,
                alt_email: deductor.alt_email,
                responsible_person: deductor.responsible_person,
                responsible_designation: deductor.responsible_designation,
                responsible_father_name: deductor.responsible_father_name,
                responsible_mobile: deductor.responsible_mobile,
                responsible_pan: deductor.responsible_pan,
                rp_flat: deductor.rp_flat,
                rp_building: deductor.rp_building,
                rp_street: deductor.rp_street,
                rp_area: deductor.rp_area,
                rp_city: deductor.rp_city,
                rp_state: deductor.rp_state,
                rp_pincode: deductor.rp_pincode,
                rp_std: deductor.rp_std,
                rp_phone: deductor.rp_phone,
                rp_alt_std: deductor.rp_alt_std,
                rp_alt_phone: deductor.rp_alt_phone,
                rp_email: deductor.rp_email,
                rp_alt_email: deductor.rp_alt_email,
                gov_pao_code: deductor.gov_pao_code,
                gov_pao_reg_no: deductor.gov_pao_reg_no,
                gov_ddo_code: deductor.gov_ddo_code,
                gov_ddo_reg_no: deductor.gov_ddo_reg_no,
                gov_state: deductor.gov_state,
                gov_ministry: deductor.gov_ministry,
                gov_other_ministry: deductor.gov_other_ministry,
                gov_ain: deductor.gov_ain,
                deductor_code: deductor.deductor_code,
                address_change_flag: deductor.address_change_flag,

                // Defaults/Fixes
                user_id: req.body.userId || 'admin' // Ensure user_id if needed, or let API handle it
            };

            // Note: In a real app we would validate dbDeductor fields here

            await query(req.db, 'INSERT INTO deductors SET ? ON DUPLICATE KEY UPDATE ?', [dbDeductor, dbDeductor]);
            count++;
        }

        fs.unlinkSync(req.file.path); // Clean up
        res.json({ success: true, message: `Successfully imported ${count} deductors`, count });
    } catch (err) {
        console.error('Import Deductor Error details:', err);
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ error: "Import failed: " + err.message });
    }
});

router.post('/import/deductees', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { deductorId } = req.body;
    if (!deductorId) return res.status(400).json({ error: 'Deductor ID is required' });

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        if (data.length > 0) {
            console.log('Debugging Excel Row Keys:', Object.keys(data[0]));
        }
        let count = 0;

        for (const row of data) {
            const id = crypto.randomUUID();

            const pan = row['PAN *'] || row['PAN'];
            const name = row['Name *'] || row['Name'];
            const code = row['Deductee Code *'] || row['Deductee Code'];

            const missing = [];
            if (!pan) missing.push('PAN');
            if (!name) missing.push('Name');
            if (!code) missing.push('Deductee Code');

            if (missing.length > 0) {
                try { fs.unlinkSync(req.file.path); } catch (e) { }
                return res.status(400).json({ error: `Row ${count + 1}: Missing mandatory fields - ${missing.join(', ')}` });
            }

            const deductee = {
                id,
                deductor_id: deductorId,
                pan: pan,
                name: name,
                code: code,
                deductee_status: row['Deductee Status'] || 'O',
                buyer_seller_flag: row['Buyer/Seller Flag'] || '2',
                email: row['Email'],
                mobile: row['Mobile'],
                address: row['Address'] || row['Address *'] || row['Address'] // Fallback just in case
            };

            await query(req.db, 'INSERT INTO deductees SET ? ON DUPLICATE KEY UPDATE ?', [deductee, deductee]);
            count++;
        }

        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `Successfully imported ${count} deductees`, count });
    } catch (err) {
        console.error('Import Error:', err);
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ error: err.message });
    }
});

router.post('/import/returns', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { deductorId, financialYear, quarter, formNo, formType } = req.body;

    try {
        const workbook = XLSX.readFile(req.file.path);
        const challans = XLSX.utils.sheet_to_json(workbook.Sheets['Challans']);
        const deductions = XLSX.utils.sheet_to_json(workbook.Sheets['Deductions']);

        // 1. Create Return
        const returnId = crypto.randomUUID();
        const ret = {
            id: returnId,
            deductor_id: deductorId,
            financial_year: financialYear,
            quarter: quarter,
            form_no: formNo,
            form_type: formType,
            status: 'Draft',
            type: 'Regular'
        };
        await query(req.db, 'INSERT INTO tds_returns SET ?', [ret]);

        // 2. Import Challans
        const challanMap = new Map(); // Map Excel SL No -> DB ID
        for (const row of challans) {
            const id = crypto.randomUUID();
            const challan = {
                id,
                deductor_id: deductorId,
                bsr_code: row['BSR Code'],
                date: row['Deposit Date'],
                serial_no: row['Challan Serial No'] || row['Serial No'],
                tds: row['TDS'] || 0,
                surcharge: row['Surcharge'] || 0,
                education_cess: row['Education Cess'] || 0,
                interest: row['Interest'] || 0,
                fee: row['Fees'] || 0,
                others: row['Others'] || 0,
                total: row['Total'] || (Number(row['TDS'] || 0) + Number(row['Surcharge'] || 0) + Number(row['Education Cess'] || 0) + Number(row['Interest'] || 0) + Number(row['Fees'] || 0) + Number(row['Others'] || 0)),
                minor_head: row['Minor Head'] || '200',
                quarter,
                financial_year: financialYear,
                status: 'Draft'
            };
            await query(req.db, 'INSERT INTO challans SET ?', [challan]);
            challanMap.set(String(row['Challan Sl No']), id);
        }

        // 3. Import Deductions
        let deductionCount = 0;
        for (const row of deductions) {
            const challanId = challanMap.get(String(row['Challan Sl No']));
            if (!challanId) continue;

            // Find deductee by PAN and deductorId
            let deducteeId;
            const deductees = await query(req.db, 'SELECT id FROM deductees WHERE pan = ? AND deductor_id = ?', [row['Deductee PAN'], deductorId]);

            if (deductees.length > 0) {
                deducteeId = deductees[0].id;
            } else {
                // If not found, create a new deductee record
                deducteeId = crypto.randomUUID();
                await query(req.db, 'INSERT INTO deductees SET ?', [{
                    id: deducteeId,
                    deductor_id: deductorId,
                    pan: row['Deductee PAN'],
                    name: row['Deductee Name'],
                    code: '02'
                }]);
            }

            const deduction = {
                id: crypto.randomUUID(),
                deductor_id: deductorId,
                challan_id: challanId,
                deductee_id: deducteeId,
                section: row['Section'],
                payment_date: row['Payment Date'],
                deducted_date: row['Deducted Date'],
                amount_of_payment: row['Amount Paid'],
                rate: row['Rate'],
                income_tax: row['Income Tax'],
                surcharge: row['Surcharge'] || 0,
                cess: row['Cess'] || 0,
                total_tax: row['Total Tax'] || (Number(row['Income Tax'] || 0) + Number(row['Surcharge'] || 0) + Number(row['Cess'] || 0)),
                tax_deposited: row['Tax Deposited'],
                remarks: row['Remarks'] || 'Normal',
                status: 'Draft'
            };
            await query(req.db, 'INSERT INTO deduction_entries SET ?', [deduction]);
            deductionCount++;
        }

        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: `Successfully imported return with ${challans.length} challans and ${deductionCount} deductions.`, count: challans.length });
    } catch (err) {
        console.error('Import Error:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

export default router;

