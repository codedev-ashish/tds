
import React, { useState } from 'react';
import { useTds } from '../store';
import { FINANCIAL_YEARS } from '../types';
import { Download, Database, FileSpreadsheet, Archive, CheckCircle, AlertTriangle } from 'lucide-react';

export const Backup: React.FC = () => {
    const { deductors, deductees, challans, deductions, returns } = useTds();
    const [selectedFy, setSelectedFy] = useState(FINANCIAL_YEARS[0]);

    const downloadFile = (content: string, filename: string, type: string = 'text/csv;charset=utf-8;') => {
        const blob = new Blob([content], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const convertToCSV = (data: any[], headers: string[]) => {
        if (!data || data.length === 0) return '';
        const headerRow = headers.join(',') + '\n';
        const rows = data.map(row => {
            return headers.map(fieldName => {
                const val = row[fieldName];
                if (val === null || val === undefined) return '';
                return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
            }).join(',');
        }).join('\n');
        return headerRow + rows;
    };

    const handleBackupMasters = () => {
        // Deductors
        if (deductors.length > 0) {
            const keys = Object.keys(deductors[0]);
            const deductorCsv = convertToCSV(deductors, keys);
            downloadFile(deductorCsv, `Deductors_Master_${new Date().toISOString().split('T')[0]}.csv`);
        }

        // Deductees
        if (deductees.length > 0) {
            const keys = Object.keys(deductees[0]);
            const deducteeCsv = convertToCSV(deductees, keys);
            downloadFile(deducteeCsv, `Deductees_Master_${new Date().toISOString().split('T')[0]}.csv`);
        }
        
        if (deductors.length === 0 && deductees.length === 0) {
            alert("No master data available to export.");
        }
    };

    const handleBackupTransactions = () => {
        // Filter by FY
        const fyChallans = challans.filter(c => c.financialYear === selectedFy);
        const fyDeductions = deductions.filter(d => {
             // Find corresponding challan to check FY if available, or check logic context
             const challan = challans.find(c => c.id === d.challanId);
             return challan?.financialYear === selectedFy;
        });

        let exported = false;

        if (fyChallans.length > 0) {
            const challanHeaders = ['id', 'deductorId', 'bsrCode', 'date', 'serialNo', 'tds', 'surcharge', 'educationCess', 'interest', 'fee', 'others', 'total', 'quarter', 'financialYear'];
            const challanCsv = convertToCSV(fyChallans, challanHeaders);
            downloadFile(challanCsv, `Challans_${selectedFy}.csv`);
            exported = true;
        }

        if (fyDeductions.length > 0) {
             const deductionHeaders = ['id', 'deductorId', 'challanId', 'deducteeId', 'section', 'paymentDate', 'deductedDate', 'amountOfPayment', 'rate', 'incomeTax', 'totalTax', 'taxDeposited'];
             const deductionCsv = convertToCSV(fyDeductions, deductionHeaders);
             downloadFile(deductionCsv, `Deductions_${selectedFy}.csv`);
             exported = true;
        }

        if (!exported) {
            alert(`No transactions found for Financial Year ${selectedFy}`);
        }
    };

    const handleFullSystemBackup = () => {
        const systemData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            deductors,
            deductees,
            challans,
            deductions,
            returns
        };
        downloadFile(JSON.stringify(systemData, null, 2), `TDS_System_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Backup & Data Utilities</h2>
                <p className="text-slate-500 text-sm">Export your data for safekeeping or reporting purposes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Master Data Backup */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                        <Database size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Master Data Export</h3>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Download all Deductor (Business) and Deductee profiles in CSV format compatible with Excel.
                    </p>
                    <button 
                        onClick={handleBackupMasters}
                        className="w-full bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg hover:bg-slate-50 font-medium flex items-center justify-center gap-2 transition"
                    >
                        <FileSpreadsheet size={18} /> Export Masters (CSV)
                    </button>
                </div>

                {/* Financial Year Transaction Backup */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4">
                        <FileSpreadsheet size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Year-wise Data Backup</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1">
                        Export Challans and Deduction entries for a specific Financial Year.
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Financial Year</label>
                            <select 
                                value={selectedFy} 
                                onChange={e => setSelectedFy(e.target.value)} 
                                className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none bg-white focus:ring-2 focus:ring-brand-500"
                            >
                                {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={handleBackupTransactions}
                            className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition shadow-sm"
                        >
                            <Download size={18} /> Export FY Data
                        </button>
                    </div>
                </div>

                {/* Full System Backup */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                        <Archive size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Full System Backup</h3>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Create a complete snapshot of the entire application state in JSON format. Useful for restoring data later.
                    </p>
                    <button 
                        onClick={handleFullSystemBackup}
                        className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 transition shadow-sm"
                    >
                        <Archive size={18} /> Download Full Backup (.json)
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-amber-800 text-sm">Data Privacy Note</h4>
                    <p className="text-sm text-amber-700 mt-1">
                        Downloaded files contain sensitive financial information (PAN, Amounts, Contact Details). 
                        Please ensure you store these files in a secure location.
                    </p>
                </div>
            </div>
        </div>
    );
};
