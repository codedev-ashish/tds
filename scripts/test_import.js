
import fs from 'fs';
import path from 'path';

const API_URL = 'http://127.0.0.1:5001/api';

async function testImportDeductors() {
    console.log('Testing Deductor Import...');
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('./public/samples/sample_deductors.xlsx');
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    formData.append('file', blob, 'sample_deductors.xlsx');

    try {
        const res = await fetch(`${API_URL}/import/deductors`, {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log('Status:', res.status);
        try {
            const data = JSON.parse(text);
            console.log('Success:', data);
            return data;
        } catch (e) {
            console.error('Failed to parse JSON. Response:', text.substring(0, 500));
        }
    } catch (err) {
        console.error('Failed Deductor Import:', err.message);
    }
}

async function testImportDeductees(deductorId) {
    console.log('\nTesting Deductee Import...');
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('./public/samples/sample_deductees.xlsx');
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    formData.append('file', blob, 'sample_deductees.xlsx');
    formData.append('deductorId', deductorId);

    try {
        const res = await fetch(`${API_URL}/import/deductees`, {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log('Status:', res.status);
        try {
            const data = JSON.parse(text);
            console.log('Success:', data);
            return data;
        } catch (e) {
            console.error('Failed to parse JSON. Response:', text.substring(0, 500));
        }
    } catch (err) {
        console.error('Failed Deductee Import:', err.message);
    }
}

async function testImportReturns(deductorId) {
    console.log('\nTesting Returns Import...');
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('./public/samples/sample_returns.xlsx');
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    formData.append('file', blob, 'sample_returns.xlsx');
    formData.append('deductorId', deductorId);
    formData.append('financialYear', '2024-25');
    formData.append('quarter', 'Q4');
    formData.append('formNo', '26Q');
    formData.append('formType', 'TDS Non-Salary');

    try {
        const res = await fetch(`${API_URL}/import/returns`, {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log('Status:', res.status);
        try {
            const data = JSON.parse(text);
            console.log('Success:', data);
            return data;
        } catch (e) {
            console.error('Failed to parse JSON. Response:', text.substring(0, 500));
        }
    } catch (err) {
        console.error('Failed Returns Import:', err.message);
    }
}

async function runTests() {
    try {
        // First get an existing deductor ID or use the imported one
        console.log('Fetching deductors from:', `${API_URL}/deductors`);
        const listRes = await fetch(`${API_URL}/deductors`).catch(e => ({ ok: false, statusText: e.message }));
        if (!listRes.ok) {
            console.error('Failed to fetch deductors:', listRes.status, listRes.statusText);
            return;
        }
        const deductors = await listRes.json();
        let deductorId;

        if (deductors.length > 0) {
            deductorId = deductors[0].id;
        } else {
            console.log('No deductors found, importing one...');
            await testImportDeductors();
            const freshRes = await fetch(`${API_URL}/deductors`);
            const freshDeductors = await freshRes.json();
            deductorId = freshDeductors[0].id;
        }

        console.log('Using Deductor ID:', deductorId);

        await testImportDeductees(deductorId);
        await testImportReturns(deductorId);

    } catch (err) {
        console.error('Global Error:', err.message);
    }
}

runTests();
