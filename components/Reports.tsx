import React, { useState, useMemo } from 'react';
import { useTds } from '../store';
import { TDS_SECTIONS, FINANCIAL_YEARS, FORMS, QUARTERS } from '../types';
import { FileSpreadsheet, FileText, Printer, Filter, Download, PieChart as PieChartIcon, ArrowDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ReportType = 'TRANSACTION' | 'SUMMARY_FY' | 'SUMMARY_SECTION' | 'SUMMARY_FORM';

export const Reports: React.FC = () => {
    const { deductions, challans, deductors } = useTds();

    // --- Filter State ---
    const [reportType, setReportType] = useState<ReportType>('TRANSACTION');
    const [filterFy, setFilterFy] = useState<string>('');
    const [filterForm, setFilterForm] = useState<string>('');
    const [filterSection, setFilterSection] = useState<string>('');
    const [filterDeductor, setFilterDeductor] = useState<string>('');

    // --- Data Processing ---
    const processedData = useMemo(() => {
        // 1. Join Tables
        const joined = deductions.map(d => {
            const challan = challans.find(c => c.id === d.challanId);
            const deductor = deductors.find(ded => ded.id === d.deductorId);
            return {
                ...d,
                financialYear: challan?.financialYear || 'N/A',
                quarter: challan?.quarter || 'N/A',
                formNo: '26Q', // Simplified logic: In real app, derive from return context or challan linkage
                deductorName: deductor?.name || 'Unknown',
                tan: deductor?.tan || 'Unknown',
                challanDate: challan?.date || 'N/A',
                bsr: challan?.bsrCode || 'N/A',
                taxDeposited: d.taxDeposited || 0 // Ensure value exists
            };
        });

        // 2. Apply Filters
        return joined.filter(item => {
            if (filterFy && item.financialYear !== filterFy) return false;
            if (filterForm && item.formNo !== filterForm) return false; // Note: In this demo data, formNo isn't strictly stored on deduction, assuming context
            if (filterSection && item.section !== filterSection) return false;
            if (filterDeductor && item.deductorId !== filterDeductor) return false;
            return true;
        });
    }, [deductions, challans, deductors, filterFy, filterForm, filterSection, filterDeductor]);

    // --- Aggregation Logic for Summaries ---
    const summaryData = useMemo(() => {
        if (reportType === 'TRANSACTION') return processedData;

        const map = new Map<string, any>();

        processedData.forEach(item => {
            let key = '';
            if (reportType === 'SUMMARY_FY') key = item.financialYear;
            else if (reportType === 'SUMMARY_SECTION') key = item.section;
            else if (reportType === 'SUMMARY_FORM') key = item.formNo;

            if (!map.has(key)) {
                map.set(key, {
                    groupKey: key,
                    count: 0,
                    amountOfPayment: 0,
                    taxDeposited: 0,
                });
            }
            const entry = map.get(key);
            entry.count += 1;
            entry.amountOfPayment += (item.amountOfPayment || 0);
            entry.taxDeposited += (item.taxDeposited || 0);
        });

        return Array.from(map.values());
    }, [processedData, reportType]);

    // --- Chart Data Preparation ---
    const chartData = useMemo(() => {
        const fyMap: Record<string, number> = {};
        const sectionMap: Record<string, number> = {};
        const formMap: Record<string, number> = {};

        processedData.forEach(item => {
            fyMap[item.financialYear] = (fyMap[item.financialYear] || 0) + item.taxDeposited;
            sectionMap[item.section] = (sectionMap[item.section] || 0) + item.taxDeposited;
            formMap[item.formNo] = (formMap[item.formNo] || 0) + item.taxDeposited;
        });

        return {
            fyData: Object.entries(fyMap).map(([name, value]) => ({ name, value })),
            sectionData: Object.entries(sectionMap).map(([name, value]) => ({ name, value })),
            formData: Object.entries(formMap).map(([name, value]) => ({ name, value }))
        };
    }, [processedData]);

    const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

    const totalTax = processedData.reduce((sum, item) => sum + (item.taxDeposited || 0), 0);
    const totalPayment = processedData.reduce((sum, item) => sum + (item.amountOfPayment || 0), 0);

    // --- Export Functions ---
    const downloadCSV = () => {
        let headers = [];
        let rows = [];

        if (reportType === 'TRANSACTION') {
            headers = ['Deductor', 'TAN', 'FY', 'Qtr', 'Section', 'Payment Date', 'Amount Paid', 'Tax Deposited', 'Challan Date'];
            rows = processedData.map(d => [
                `"${d.deductorName}"`, d.tan, d.financialYear, d.quarter, d.section, d.paymentDate, d.amountOfPayment, d.taxDeposited, d.challanDate
            ]);
        } else {
            headers = ['Group', 'Count', 'Total Payment', 'Total Tax'];
            rows = summaryData.map((d: any) => [
                d.groupKey, d.count, d.amountOfPayment, d.taxDeposited
            ]);
        }

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `TDS_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const downloadWord = () => {
        // Simple HTML export for Word
        const content = `
      <html>
        <body>
          <h2>TDS Report - ${reportType}</h2>
          <table border="1" style="border-collapse: collapse; width: 100%;">
             <tr style="background-color: #f2f2f2;">
                ${reportType === 'TRANSACTION'
                ? '<th>Deductor</th><th>FY</th><th>Section</th><th>Amount</th><th>Tax</th>'
                : '<th>Group</th><th>Count</th><th>Total Payment</th><th>Total Tax</th>'}
             </tr>
             ${(reportType === 'TRANSACTION' ? processedData : summaryData).map((d: any) => `
                <tr>
                    ${reportType === 'TRANSACTION'
                        ? `<td>${d.deductorName}</td><td>${d.financialYear}</td><td>${d.section}</td><td>${d.amountOfPayment}</td><td>${d.taxDeposited}</td>`
                        : `<td>${d.groupKey}</td><td>${d.count}</td><td>${d.amountOfPayment}</td><td>${d.taxDeposited}</td>`}
                </tr>
             `).join('')}
          </table>
        </body>
      </html>
    `;
        const blob = new Blob([content], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `TDS_Report.doc`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reports Center</h2>
                    <p className="text-slate-500 text-sm">Generate financial year, form type, and section wise reports.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium">
                        <FileSpreadsheet size={18} /> Excel
                    </button>
                    <button onClick={downloadWord} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium">
                        <FileText size={18} /> Word
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition shadow-sm font-medium">
                        <Printer size={18} /> Print / PDF
                    </button>
                </div>
            </div>

            {/* Configuration & Filters */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold border-b pb-2">
                    <Filter size={18} /> Filter Options
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Report Mode</label>
                        <select
                            value={reportType}
                            onChange={e => setReportType(e.target.value as ReportType)}
                            className="w-full p-2 border border-slate-300 rounded-md text-sm font-medium bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            <option value="TRANSACTION">Detailed Transaction Report</option>
                            <option value="SUMMARY_FY">Summary: Financial Year Wise</option>
                            <option value="SUMMARY_SECTION">Summary: Section Wise</option>
                            <option value="SUMMARY_FORM">Summary: Form Wise</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Financial Year</label>
                        <select value={filterFy} onChange={e => setFilterFy(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none bg-white">
                            <option value="">All Years</option>
                            {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">TDS Section</label>
                        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none bg-white">
                            <option value="">All Sections</option>
                            {TDS_SECTIONS.map(s => <option key={s.code} value={s.code}>{s.code} - {s.description}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Form No.</label>
                        <select value={filterForm} onChange={e => setFilterForm(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none bg-white">
                            <option value="">All Forms</option>
                            {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Business / Deductor</label>
                        <select value={filterDeductor} onChange={e => setFilterDeductor(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none bg-white">
                            <option value="">All Businesses</option>
                            {deductors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total TDS Deposited</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">₹{totalTax.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-lg"><PieChartIcon size={24} /></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Payment Amount</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">₹{totalPayment.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><ArrowDown size={24} /></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Records</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{processedData.length}</div>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileText size={24} /></div>
                </div>
            </div>

            {/* Visualizations Section */}
            {processedData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart 1: Tax by FY */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Tax Liability by Financial Year</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.fyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Tax by Form Type */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><PieChartIcon size={18} /> Form Type Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.formData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.formData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 3: Tax by Section */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-3">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Tax Liability by TDS Section</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.sectionData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Generated Report Results</h3>
                    <span className="text-xs text-slate-500">Showing {reportType === 'TRANSACTION' ? processedData.length : summaryData.length} records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                            {reportType === 'TRANSACTION' ? (
                                <tr>
                                    <th className="p-3">Deductor</th>
                                    <th className="p-3">FY / Qtr</th>
                                    <th className="p-3">Section</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3 text-right">Payment</th>
                                    <th className="p-3 text-right">TDS Tax</th>
                                    <th className="p-3 text-right">Rate</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="p-3">Group ({reportType.replace('SUMMARY_', '')})</th>
                                    <th className="p-3 text-center">Record Count</th>
                                    <th className="p-3 text-right">Total Payment</th>
                                    <th className="p-3 text-right">Total Tax Deposited</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportType === 'TRANSACTION' ? (
                                processedData.length > 0 ? processedData.map((item, idx) => (
                                    <tr key={item.id + idx} className="hover:bg-slate-50">
                                        <td className="p-3">
                                            <div className="font-medium text-slate-800 truncate max-w-[150px]">{item.deductorName}</div>
                                            <div className="text-xs text-slate-500">{item.tan}</div>
                                        </td>
                                        <td className="p-3 text-slate-600">{item.financialYear} <span className="text-xs bg-slate-100 px-1 rounded">{item.quarter}</span></td>
                                        <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{item.section}</span></td>
                                        <td className="p-3 text-slate-600">{item.deductedDate ? item.deductedDate.split('-').reverse().join('/') : '-'}</td>
                                        <td className="p-3 text-right font-mono">{item.amountOfPayment ? item.amountOfPayment.toLocaleString() : '0'}</td>
                                        <td className="p-3 text-right font-medium text-slate-800">₹{(item.taxDeposited || 0).toLocaleString()}</td>
                                        <td className="p-3 text-right text-slate-500">{item.rate}%</td>
                                    </tr>
                                )) : <tr><td colSpan={7} className="p-8 text-center text-slate-400">No records match your filters.</td></tr>
                            ) : (
                                summaryData.length > 0 ? summaryData.map((item: any, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-800">{item.groupKey || 'N/A'}</td>
                                        <td className="p-3 text-center"><span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-bold">{item.count}</span></td>
                                        <td className="p-3 text-right font-mono">{(item.amountOfPayment || 0).toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-brand-700">₹{(item.taxDeposited || 0).toLocaleString()}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="p-8 text-center text-slate-400">No records match your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};