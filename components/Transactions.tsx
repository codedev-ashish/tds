

import React, { useState, useEffect, useCallback } from 'react';
import { useTds } from '../store';
import { Challan, DeductionEntry, TDS_SECTIONS, REMARKS_OPTIONS, ReturnContext, FINANCIAL_YEARS, QUARTERS, FORMS, TdsReturn } from '../types';
import { Receipt, AlertCircle, FileText, Download, Play, ChevronLeft, LayoutGrid, Upload, CheckCircle, Clock, Eye, Edit, Save, Loader2, X, Info, ShieldCheck, PenTool, Trash2, FileSignature, Lock, Globe, Smartphone } from 'lucide-react';
import { CsiValidationModal } from './CsiValidationModal';


// --- Components ---

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReturnSetup: React.FC<{ onProceed: (ctx: ReturnContext) => void }> = ({ onProceed }) => {
    const { deductors, activeDeductorId, setActiveDeductor, returns, createOrUpdateReturn } = useTds();

    // Form State
    const [fy, setFy] = useState(FINANCIAL_YEARS[0]);
    const [qtr, setQtr] = useState(QUARTERS[0]);
    const [formNo, setFormNo] = useState(FORMS[1]); // Default 26Q
    const [formType, setFormType] = useState<'Salary' | 'TDS Non-Salary' | 'TCS'>('TDS Non-Salary');
    const [prevToken, setPrevToken] = useState('');

    const { refreshData } = useTds();

    // Auto-set form type based on Form No
    useEffect(() => {
        if (formNo === '24Q') setFormType('Salary');
        else if (formNo === '27EQ') setFormType('TCS');
        else setFormType('TDS Non-Salary');
    }, [formNo]);

    // Auto-populate previous token from existing draft
    useEffect(() => {
        if (!activeDeductorId) return;
        const existing = returns.find(r =>
            r.deductorId === activeDeductorId &&
            r.financialYear === fy &&
            r.quarter === qtr &&
            r.formNo === formNo &&
            r.status === 'Draft'
        );
        if (existing) {
            setPrevToken(existing.previousTokenNumber || '');
        } else {
            setPrevToken('');
        }
    }, [activeDeductorId, fy, qtr, formNo, returns]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeDeductorId) return;

        // Check if draft exists or create new
        const returnId = await createOrUpdateReturn({
            deductorId: activeDeductorId,
            financialYear: fy,
            quarter: qtr,
            formNo: formNo,
            formType: formType,
            previousTokenNumber: prevToken,
            type: 'Regular'
        });

        onProceed({
            id: returnId,
            deductorId: activeDeductorId,
            financialYear: fy,
            quarter: qtr as any,
            formNo: formNo as any,
            formType,
            type: 'Regular',
            previousTokenNumber: prevToken
        });
    };



    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">Start New Return</h2>

            </div>



            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                    <div className="relative">
                        <select
                            className="w-full p-2.5 border border-slate-300 rounded-md bg-white font-medium"
                            value={activeDeductorId || ''}
                            onChange={e => setActiveDeductor(e.target.value)}
                        >
                            <option value="">-- Select Company --</option>
                            {deductors.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.tan})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">FA Year</label>
                        <select value={fy} onChange={e => setFy(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md bg-white">
                            {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quarter</label>
                        <select
                            value={qtr}
                            onChange={e => setQtr(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-md bg-white"
                        >
                            {QUARTERS.map(q => {
                                const isFiled = returns.some(r =>
                                    r.deductorId === activeDeductorId &&
                                    r.financialYear === fy &&
                                    r.quarter === q &&
                                    r.formNo === formNo &&
                                    r.status === 'Generated' &&
                                    r.type === 'Regular'
                                );
                                return (
                                    <option key={q} value={q} disabled={isFiled}>
                                        {q} {isFiled ? '(Filed)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Form No.</label>
                        <div className="flex gap-2">
                            <select value={formNo} onChange={e => setFormNo(e.target.value)} className="w-32 p-2.5 border border-slate-300 rounded-md bg-white">
                                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600 text-sm flex items-center justify-center font-medium">
                                {formType}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Token No. of Previous Return (Optional)
                        {prevToken && (
                            <span className={`ml-2 text-xs font-semibold ${String(prevToken).replace(/\D/g, '').length === 15 ? 'text-green-600' :
                                String(prevToken).replace(/\D/g, '').length === 0 ? 'text-slate-500' :
                                    'text-amber-600'
                                }`}>
                                {String(prevToken).replace(/\D/g, '').length === 15 ? '✓ Valid (15 digits)' :
                                    String(prevToken).replace(/\D/g, '').length === 0 ? '(empty)' :
                                        `(${String(prevToken).replace(/\D/g, '').length} digits - will be padded to 15)`}
                            </span>
                        )}
                    </label>
                    <input
                        value={prevToken}
                        onChange={e => setPrevToken(e.target.value)}
                        placeholder="15-digit Receipt Reference Number"
                        className="w-full p-2.5 border border-slate-300 rounded-md bg-white"
                        maxLength="20"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        FVU requires exactly 15 digits. Non-digit characters will be removed and left-padded with zeros if needed.
                    </p>

                    {/* Specific Draft Info */}
                    {activeDeductorId && returns.some(r => r.deductorId === activeDeductorId && r.financialYear === fy && r.quarter === qtr && r.formNo === formNo && r.status === 'Draft') && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <Info size={18} className="text-blue-600 shrink-0" />
                            <div className="text-xs text-blue-800">
                                <span className="font-bold">Draft Found:</span> A draft return for <span className="font-bold">{fy} {qtr}</span> already exists.
                                {returns.find(r => r.deductorId === activeDeductorId && r.financialYear === fy && r.quarter === qtr && r.formNo === formNo && r.status === 'Draft')?.previousTokenNumber && (
                                    <span> Current Token: <span className="font-mono font-bold bg-blue-100 px-1 rounded">{returns.find(r => r.deductorId === activeDeductorId && r.financialYear === fy && r.quarter === qtr && r.formNo === formNo && r.status === 'Draft')?.previousTokenNumber}</span></span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                    {returns.some(r =>
                        r.deductorId === activeDeductorId &&
                        r.financialYear === fy &&
                        r.quarter === qtr &&
                        r.formNo === formNo &&
                        r.status === 'Generated' &&
                        r.type === 'Regular'
                    ) && (
                            <p className="text-sm text-red-500 mb-4 font-medium flex items-center gap-2">
                                <AlertCircle size={16} /> Return already filed for this period.
                            </p>
                        )}
                    <p className="text-sm text-slate-500 mb-4">Click on 'Proceed' to add data. This will create a Draft Return automatically.</p>
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={!activeDeductorId || returns.some(r =>
                                r.deductorId === activeDeductorId &&
                                r.financialYear === fy &&
                                r.quarter === qtr &&
                                r.formNo === formNo &&
                                r.status === 'Generated' &&
                                r.type === 'Regular'
                            )}
                            className="bg-brand-600 text-white px-8 py-2.5 rounded-md hover:bg-brand-700 transition shadow-sm font-medium disabled:opacity-50"
                        >
                            Proceed
                        </button>
                        <button
                            type="button"
                            disabled={!activeDeductorId || returns.some(r =>
                                r.deductorId === activeDeductorId &&
                                r.financialYear === fy &&
                                r.quarter === qtr &&
                                r.formNo === formNo &&
                                r.status === 'Generated' &&
                                r.type === 'Regular'
                            )}
                            onClick={() => {
                                if (!activeDeductorId) return;
                                createOrUpdateReturn({
                                    deductorId: activeDeductorId,
                                    financialYear: fy,
                                    quarter: qtr,
                                    formNo: formNo,
                                    formType: formType,
                                    previousTokenNumber: prevToken,
                                    type: 'Regular'
                                });
                                alert("Draft Return saved successfully!");
                            }}
                            className="bg-slate-100 text-slate-700 px-8 py-2.5 rounded-md hover:bg-slate-200 transition border border-slate-300 font-medium disabled:opacity-50"
                        >
                            Save Draft
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export const DraftReturnsList: React.FC<{ onResume: (r: TdsReturn) => void }> = ({ onResume }) => {
    const { returns, deductors, deleteReturn } = useTds();
    const drafts = returns.filter(r => r.status === 'Draft' && r.type === 'Regular');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <DeleteConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={() => deletingId && deleteReturn(deletingId)}
                title="Delete Draft Return?"
                message="Are you sure you want to delete this draft return? All associated data will remain but the return record will be removed from your dashboard."
            />
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Draft TDS Returns</h2>
                <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">{drafts.length} In Progress</span>
            </div>
            {drafts.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No draft returns found. Start a new return to see it here.</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="p-4">Deductor</th>
                            <th className="p-4">FY & Quarter</th>
                            <th className="p-4">Form</th>
                            <th className="p-4">Token Number</th>
                            <th className="p-4">Last Updated</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {drafts.map(r => {
                            const ded = deductors.find(d => d.id === r.deductorId);
                            return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{ded?.name} <span className="block text-xs text-slate-500 font-normal">{ded?.tan}</span></td>
                                    <td className="p-4">{r.financialYear} - <span className="font-semibold">{r.quarter}</span></td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{r.formNo}</span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-600">{r.previousTokenNumber || '-'}</td>
                                    <td className="p-4 text-slate-500">{new Date(r.updatedAt).toLocaleDateString('en-GB')} {new Date(r.updatedAt).toLocaleTimeString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => onResume(r)} className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1">
                                                <Edit size={16} /> Resume
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(r.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete Draft"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export const CorrectionReturnWizard: React.FC<{ onProceed: (token: string, r: TdsReturn) => void }> = ({ onProceed }) => {
    const { returns, deductors } = useTds();
    const [selectedReturnId, setSelectedReturnId] = useState<string>('');
    const [originalToken, setOriginalToken] = useState('');

    // Show only Generated Regular Returns that can be corrected
    const filedReturns = returns.filter(r => r.status === 'Generated' && r.type === 'Regular');

    const handleProceed = () => {
        const selected = filedReturns.find(r => r.id === selectedReturnId);
        if (selected && originalToken) {
            onProceed(originalToken, selected);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                    <ShieldCheck size={24} /> Initiate Correction Return
                </h2>
                <p className="text-sm text-slate-600 mt-1">Select a previously filed Regular Return and provide the Token Number to start a correction.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Filed Return</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 border border-slate-300 rounded-md bg-white font-medium"
                            value={selectedReturnId}
                            onChange={e => setSelectedReturnId(e.target.value)}
                        >
                            <option value="">-- Select Return --</option>
                            {filedReturns.map(r => {
                                const ded = deductors.find(d => d.id === r.deductorId);
                                return (
                                    <option key={r.id} value={r.id}>
                                        {ded?.name} - {r.formNo} - {r.quarter} ({r.financialYear})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    {filedReturns.length === 0 && <p className="text-xs text-red-500 mt-1">No filed regular returns found.</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Original Token Number (PRN)</label>
                    <input
                        value={originalToken}
                        onChange={e => setOriginalToken(e.target.value)}
                        placeholder="Enter 15-digit Token Number from Acknowledgment"
                        className="w-full p-3 border border-slate-300 rounded-md bg-white font-mono"
                        maxLength={15}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        disabled={!selectedReturnId || !originalToken}
                        onClick={handleProceed}
                        className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <PenTool size={18} /> Start Correction Mode
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SavedReturnsList: React.FC<{ onView: (r: TdsReturn) => void }> = ({ onView }) => {
    const { returns, deductors, deleteReturn, createOrUpdateReturn } = useTds();
    const saved = returns.filter(r => r.status === 'Generated');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempToken, setTempToken] = useState('');

    const startEditing = (r: TdsReturn) => {
        setEditingId(r.id);
        setTempToken(r.previousTokenNumber || '');
    };

    const saveToken = async (r: TdsReturn) => {
        try {
            await createOrUpdateReturn({
                ...r,
                previousTokenNumber: tempToken,
                updatedAt: new Date().toISOString()
            });
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update token:', error);
            alert('Failed to update token number');
        }
    };

    const handleDownload = async (id: string, formNo: string, type: 'fvu' | 'txt' | 'pdf') => {
        try {
            const response = await fetch(`/api/returns/${id}/${type}`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use standard naming convention
            // Use professional naming convention: 27A_[TAN]_[FORM]_[QTR]_[FY].pdf
            let fileName = '';
            if (type === 'pdf') {
                const ret = returns.find(ret => ret.id === id);
                const ded = deductors.find(d => d.id === ret?.deductorId);
                if (ret && ded) {
                    const fy = ret.financialYear || '';
                    const fySanitized = fy.replace('-', '');
                    fileName = `27A_${ded.tan}_${ret.formNo}_${ret.quarter}_${fySanitized}.pdf`;
                } else {
                    fileName = `27A_${formNo}_${id.substring(0, 8)}.pdf`;
                }
            } else {
                fileName = `FVU_${formNo}_${id.substring(0, 8)}.${type}`;
            }
            a.download = fileName;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert(`Failed to download ${type.toUpperCase()} file`);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <DeleteConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={() => deletingId && deleteReturn(deletingId)}
                title="Delete Saved Return?"
                message="Are you sure you want to delete this saved return record? This action cannot be undone."
            />
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Saved / Filed Returns</h2>
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">{saved.length} Completed</span>
            </div>
            {saved.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No generated returns yet. Finish a return to see it here.</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="p-4">Deductor</th>
                            <th className="p-4">FY & Quarter</th>
                            <th className="p-4">Form</th>
                            <th className="p-4">Prev. Token No.</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Generated On</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {saved.map(r => {
                            const ded = deductors.find(d => d.id === r.deductorId);
                            return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{ded?.name} <span className="block text-xs text-slate-500 font-normal">{ded?.tan}</span></td>
                                    <td className="p-4">{r.financialYear} - <span className="font-semibold">{r.quarter}</span></td>
                                    <td className="p-4">
                                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">{r.formNo}</span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-600">
                                        {editingId === r.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={tempToken}
                                                    onChange={(e) => setTempToken(e.target.value)}
                                                    className="w-32 p-1 border border-slate-300 rounded text-xs"
                                                    placeholder="Enter Token"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveToken(r)}
                                                    className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded"
                                                    title="Save"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded"
                                                    title="Cancel"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group">
                                                <span>{r.previousTokenNumber || '-'}</span>
                                                <button
                                                    onClick={() => startEditing(r)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-600 transition-opacity"
                                                    title="Edit Token Number"
                                                >
                                                    <Edit size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${r.type === 'Correction' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500">{new Date(r.updatedAt).toLocaleDateString('en-GB')}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleDownload(r.id, r.formNo, 'fvu')}
                                                className="text-slate-600 hover:text-brand-600 font-medium flex items-center gap-1"
                                                title="Download FVU"
                                            >
                                                <Download size={16} /> .fvu
                                            </button>
                                            <button
                                                onClick={() => handleDownload(r.id, r.formNo, 'txt')}
                                                className="text-slate-600 hover:text-brand-600 font-medium flex items-center gap-1"
                                                title="Download Form 27A Text File"
                                            >
                                                <FileText size={16} /> .txt
                                            </button>
                                            <button
                                                onClick={() => handleDownload(r.id, r.formNo, 'pdf')}
                                                className="text-slate-600 hover:text-brand-600 font-medium flex items-center gap-1"
                                                title="Download PDF Form 27A"
                                            >
                                                <Download size={16} /> .pdf
                                            </button>
                                            <button onClick={() => onView(r)} className="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1">
                                                <Eye size={16} /> View
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(r.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete Return"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// --- Challan Manager (Filtered by Context) ---
const ChallanManager: React.FC<{ onNavigateToDeductions?: () => void }> = ({ onNavigateToDeductions }) => {
    const { challans, addChallan, deleteChallan, activeReturnContext, deductions, setActiveChallanId, saveCurrentReturn } = useTds();
    const [showAllColumns, setShowAllColumns] = useState(false);
    const [showCsiModal, setShowCsiModal] = useState(false);

    // Filter challans for current deductor AND current return period
    const myChallans = challans.filter(c =>
        c.deductorId === activeReturnContext?.deductorId &&
        c.financialYear === activeReturnContext?.financialYear &&
        c.quarter === activeReturnContext?.quarter
    );

    const myDeductions = deductions.filter(d => d.deductorId === activeReturnContext?.deductorId);

    const initialChallanState: Partial<Challan> = {
        minorHead: '200',
        quarter: activeReturnContext?.quarter,
        financialYear: activeReturnContext?.financialYear,
        tds: 0, surcharge: 0, educationCess: 0, interest: 0, fee: 0, others: 0, total: 0, interestAllocated: 0, othersAllocated: 0
    };

    const [current, setCurrent] = useState<Partial<Challan>>(initialChallanState);

    useEffect(() => {
        const tds = current.tds || 0;
        const surcharge = current.surcharge || 0;
        const cess = current.educationCess || 0;
        const interest = current.interest || 0;
        const fee = current.fee || 0;
        const others = current.others || 0;

        const total = tds + surcharge + cess + interest + fee + others;
        if (total !== current.total) {
            setCurrent(prev => ({ ...prev, total }));
        }
    }, [current.tds, current.surcharge, current.educationCess, current.interest, current.fee, current.others]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeReturnContext?.deductorId) return;
        addChallan({ ...current, deductorId: activeReturnContext.deductorId, id: crypto.randomUUID() } as Challan);
        saveCurrentReturn(); // Auto-save trigger
        setCurrent(initialChallanState);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this challan?")) {
            deleteChallan(id);
            saveCurrentReturn(); // Auto-save trigger
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-500">
            <CsiValidationModal isOpen={showCsiModal} onClose={() => setShowCsiModal(false)} returnContext={activeReturnContext} />
            <div className="xl:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-brand-700 mb-4 border-b pb-2">Add Challan Record</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Date of Payment [410] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="date" required value={current.date || ''} onChange={e => setCurrent({ ...current, date: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">BSR Code [408] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input required maxLength={7} value={current.bsrCode || ''} onChange={e => setCurrent({ ...current, bsrCode: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Challan No. [409] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input required maxLength={5} value={current.serialNo || ''} onChange={e => setCurrent({ ...current, serialNo: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">TDS [402] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.tds || ''} onChange={e => setCurrent({ ...current, tds: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Surcharge <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.surcharge || ''} onChange={e => setCurrent({ ...current, surcharge: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Education Cess <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.educationCess || ''} onChange={e => setCurrent({ ...current, educationCess: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Interest [403] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.interest || ''} onChange={e => setCurrent({ ...current, interest: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Fee [404] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.fee || ''} onChange={e => setCurrent({ ...current, fee: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Others [405] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.others || ''} onChange={e => setCurrent({ ...current, others: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Total [406] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" readOnly value={current.total || ''} className="w-full p-1.5 border border-slate-300 rounded text-sm bg-slate-100 font-bold outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Minor Head [411] <span className="text-blue-500">?</span></label>
                        <div className="col-span-2">
                            <select value={current.minorHead} onChange={e => setCurrent({ ...current, minorHead: e.target.value as any })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white">
                                <option value="200">200 - TDS payable by Taxpayer</option>
                                <option value="400">400 - TDS Regular Assessment</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Interest (Allocated) <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.interestAllocated || ''} onChange={e => setCurrent({ ...current, interestAllocated: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 text-right">Others (Allocated) <span className="text-blue-500">?</span></label>
                        <div className="col-span-2"><input type="number" value={current.othersAllocated || ''} onChange={e => setCurrent({ ...current, othersAllocated: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                    </div>

                    <div className="flex items-center gap-2 justify-end pt-2">
                        <label className="text-xs text-slate-600 cursor-pointer select-none">
                            <input type="checkbox" checked={showAllColumns} onChange={e => setShowAllColumns(e.target.checked)} className="mr-1 rounded text-brand-600 focus:ring-brand-500" />
                            Show All Columns <span className="text-blue-500">?</span>
                        </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setCurrent(initialChallanState)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md hover:bg-slate-200 transition font-medium border border-slate-300">Cancel</button>
                        <button type="submit" className="flex-[2] bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700 transition font-medium shadow-sm">Add Challan</button>
                    </div>
                </form>
            </div>

            <div className="xl:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">List of Challans</h3>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => setShowCsiModal(true)}
                            className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200 transition"
                        >
                            <FileSignature size={16} /> Validate CSI
                        </button>
                        <div className="text-sm text-red-500 font-medium">Click on "Sl. No." in the grid below to <b>Add / Modify</b> Deductees</div>
                        <div className="flex bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                            <input placeholder="Search" className="px-3 py-1 text-sm bg-white outline-none w-32" />
                            <button className="bg-slate-500 text-white px-3 py-1 text-sm font-medium hover:bg-slate-600">Go</button>
                        </div>
                        <button className="text-sm text-blue-600 hover:underline">Advanced Search</button>
                    </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-2 text-center w-12 border-r border-slate-200 text-xs">Sl. No.</th>
                                <th className="p-2 border-r border-slate-200 text-xs">Challan No.</th>
                                <th className="p-2 border-r border-slate-200 text-xs">Deposit Date</th>
                                <th className="p-2 border-r border-slate-200 text-xs">BSR Code</th>
                                <th className="p-2 border-r border-slate-200 text-xs text-right">Tax</th>
                                <th className="p-2 border-r border-slate-200 text-xs text-right">Deductee Total</th>
                                <th className="p-2 border-r border-slate-200 text-xs text-right">Diff.</th>
                                <th className="p-2 text-center text-xs">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myChallans.map((c, index) => {
                                const usedAmount = myDeductions.filter(d => d.challanId === c.id).reduce((sum, d) => sum + (d.taxDeposited || 0), 0);
                                const diff = c.total - usedAmount;
                                return (
                                    <tr key={c.id} className="hover:bg-slate-50 transition group">
                                        <td className="p-2 text-center border-r border-slate-100">
                                            <button onClick={() => { setActiveChallanId(c.id); if (onNavigateToDeductions) onNavigateToDeductions(); }} className="text-red-600 font-bold hover:underline">{index + 1}</button>
                                        </td>
                                        <td className="p-2 font-mono border-r border-slate-100 bg-blue-50">{c.serialNo}</td>
                                        <td className="p-2 border-r border-slate-100">{c.date ? c.date.split('-').reverse().join('/') : '-'}</td>
                                        <td className="p-2 font-mono border-r border-slate-100">{c.bsrCode}</td>
                                        <td className="p-2 text-right font-medium border-r border-slate-100">{c.total.toFixed(2)}</td>
                                        <td className="p-2 text-right font-medium border-r border-slate-100">{usedAmount.toFixed(2)}</td>
                                        <td className={`p-2 text-right font-medium border-r border-slate-100 ${diff < 0 ? 'text-red-500' : 'text-slate-800'}`}>{diff.toFixed(2)}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => setCurrent(c)} className="text-blue-600 text-xs hover:underline mr-2">Edit</button>
                                            <button onClick={() => handleDelete(c.id)} className="text-blue-600 text-xs hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {myChallans.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">No challans added yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 bg-blue-100 border border-blue-200 rounded p-1 flex justify-between items-center px-4">
                    <div className="flex gap-2">
                        <button className="text-slate-400 text-xs hover:text-slate-600"><ChevronLeft size={14} /></button>
                        <button className="text-slate-400 text-xs hover:text-slate-600 rotate-180"><ChevronLeft size={14} /></button>
                    </div>
                    <div className="text-xs text-slate-600">
                        Page <input value="1" className="w-8 text-center border border-slate-300 rounded mx-1" readOnly /> of 1
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="text-xs border border-slate-300 rounded p-0.5"><option>15</option></select>
                        <span className="text-xs text-slate-600">Displaying 1 to {myChallans.length} of {myChallans.length} records.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Deduction Entry Manager ---
const DeductionManager: React.FC = () => {
    const { activeReturnContext, challans, deductees, deductions, addDeduction, deleteDeduction, activeChallanId, setActiveChallanId, saveCurrentReturn } = useTds();

    const myChallans = challans.filter(c => c.deductorId === activeReturnContext?.deductorId && c.financialYear === activeReturnContext?.financialYear && c.quarter === activeReturnContext?.quarter);

    useEffect(() => {
        if (myChallans.length > 0) {
            if (!activeChallanId || !myChallans.find(c => c.id === activeChallanId)) setActiveChallanId(myChallans[0].id);
        } else {
            setActiveChallanId(null);
        }
    }, [activeReturnContext, myChallans.length, setActiveChallanId]);

    const selectedChallanId = activeChallanId || '';
    const myDeductees = deductees.filter(d => d.deductorId === activeReturnContext?.deductorId);
    const selectedChallan = myChallans.find(c => c.id === selectedChallanId);
    const challanDeductions = deductions.filter(d => d.deductorId === activeReturnContext?.deductorId && d.challanId === selectedChallanId);

    const initialEntryState: Partial<DeductionEntry> = { rate: 0, amountOfPayment: 0, incomeTax: 0, surcharge: 0, cess: 0, totalTax: 0, taxDeposited: 0, remarks: 'Normal' };
    const [current, setCurrent] = useState<Partial<DeductionEntry>>(initialEntryState);
    const [showAllColumns, setShowAllColumns] = useState(false);

    // Auto-fill deductee details when selected
    const selectedDeductee = myDeductees.find(d => d.id === current.deducteeId);

    // Helper to get applicable rate based on Deductee Type (Company vs Other)
    const getApplicableRate = (secCode: string, dedId: string) => {
        if (!secCode || !dedId) return 0;
        const sec = TDS_SECTIONS.find(s => s.code === secCode);
        const ded = myDeductees.find(d => d.id === dedId);

        if (!sec || !ded) return 0;
        // Code '01' is Company, '02' is Other/Individual
        return ded.code === '01' ? sec.rateCompany : sec.rateIndividual;
    };

    // Unified calculation handler
    const updateCalculations = (overrides: Partial<DeductionEntry>) => {
        setCurrent(prev => {
            const next = { ...prev, ...overrides };
            const amount = Number(next.amountOfPayment) || 0;
            const rate = Number(next.rate) || 0;

            const incomeTax = Math.round((amount * rate) / 100);

            // Auto-calculate Surcharge & Cess defaults based on section
            let newSurcharge = Number(next.surcharge) || 0;
            let newCess = Number(next.cess) || 0;

            // If we are updating base parameters (Amount, Rate, Section), reset/recalc Surcharge/Cess
            if (overrides.amountOfPayment !== undefined || overrides.rate !== undefined || overrides.section !== undefined) {
                // Standard logic: Surcharge 0, Cess 0 (except Salary)
                newSurcharge = 0;
                if (next.section === '192' || next.section === '192A') {
                    newCess = Math.round(incomeTax * 0.04);
                } else {
                    newCess = 0;
                }
            }

            // Allow specific override if user is typing in Surcharge/Cess fields
            if (overrides.surcharge !== undefined) newSurcharge = Number(overrides.surcharge);
            if (overrides.cess !== undefined) newCess = Number(overrides.cess);

            const totalTax = incomeTax + newSurcharge + newCess;

            return {
                ...next,
                incomeTax,
                surcharge: newSurcharge,
                cess: newCess,
                totalTax,
                taxDeposited: totalTax, // Auto-fill tax deposited with total liability
            };
        });
    };

    const handleDeducteeChange = (deducteeId: string) => {
        const newRate = getApplicableRate(current.section || '', deducteeId);
        // Atomically update state via unified calculation function
        updateCalculations({
            deducteeId,
            deductorId: activeReturnContext?.deductorId,
            rate: newRate
        });
    };

    const handleSectionChange = (section: string) => {
        const newRate = getApplicableRate(section, current.deducteeId || '');
        // Atomically update state via unified calculation function
        updateCalculations({ section, rate: newRate });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeReturnContext?.deductorId || !selectedChallanId) return;

        // Validate dates
        if (current.paymentDate && current.deductedDate) {
            const pDate = new Date(current.paymentDate);
            const dDate = new Date(current.deductedDate);
            if (pDate > dDate) {
                alert("Payment Date cannot be later than Deducted Date.");
                return;
            }
        }

        addDeduction({ ...current, deductorId: activeReturnContext.deductorId, challanId: selectedChallanId, id: crypto.randomUUID() } as DeductionEntry);
        saveCurrentReturn(); // Auto-save trigger
        setCurrent(initialEntryState);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this deductee record?")) {
            deleteDeduction(id);
            saveCurrentReturn(); // Auto-save trigger
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
                <span className="font-semibold text-slate-700">Select Challan:</span>
                <select value={selectedChallanId} onChange={e => setActiveChallanId(e.target.value)} className="flex-1 max-w-xl p-2 border border-slate-300 rounded-md bg-white">
                    <option value="">-- Select a Challan --</option>
                    {myChallans.map(c => (<option key={c.id} value={c.id}>Date: {c.date} | Amount: ₹{c.total}</option>))}
                </select>
            </div>
            {selectedChallanId && selectedChallan ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-brand-700 mb-4 border-b pb-2">Add Deductee Record</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Deductee Name[416] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2">
                                    <select required value={current.deducteeId || ''} onChange={e => handleDeducteeChange(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white">
                                        <option value="">-- Select --</option>
                                        {myDeductees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">PAN [415] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input disabled value={selectedDeductee?.pan || ''} className="w-full p-1.5 border border-slate-300 rounded text-sm bg-slate-100" /></div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Code [414] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2">
                                    <select disabled value={selectedDeductee?.code || '02'} className="w-full p-1.5 border border-slate-300 rounded text-sm bg-slate-100 disabled:text-slate-500">
                                        <option value="01">01 - Company</option>
                                        <option value="02">02 - Other than Company</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Section [417] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2">
                                    <select required value={current.section || ''} onChange={e => handleSectionChange(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white">
                                        <option value="">-- Select --</option>
                                        {TDS_SECTIONS.map(s => (
                                            <option key={s.code} value={s.code}>
                                                {s.code} - {s.description} ({selectedDeductee?.code === '01' ? s.rateCompany : s.rateIndividual}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-2 mt-2">
                                <p className="text-xs font-semibold text-brand-600 mb-2 uppercase tracking-wide bg-brand-50 p-1 text-center rounded">Transaction Details</p>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Payment Date [418] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="date" required value={current.paymentDate || ''} onChange={e => setCurrent({ ...current, paymentDate: e.target.value, deductedDate: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Deducted Date [422] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="date" required value={current.deductedDate || ''} onChange={e => setCurrent({ ...current, deductedDate: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Amount of Payment [419] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="number" required value={current.amountOfPayment || ''} onChange={e => updateCalculations({ amountOfPayment: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Rate [423] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2 flex items-center gap-1">
                                    <input type="number" required value={current.rate || ''} onChange={e => updateCalculations({ rate: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" />
                                    <span className="text-xs text-slate-500">%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Income Tax <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="number" readOnly value={current.incomeTax || 0} className="w-full p-1.5 border border-slate-300 rounded text-sm bg-white focus:ring-1 focus:ring-brand-500 outline-none" /></div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Surcharge <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="number" value={current.surcharge || ''} onChange={e => updateCalculations({ surcharge: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Cess <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="number" value={current.cess || ''} onChange={e => updateCalculations({ cess: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Total [422] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="number" readOnly value={current.totalTax || 0} className="w-full p-1.5 border border-slate-300 rounded text-sm bg-white font-bold outline-none" /></div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Tax Deposited [420] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input type="number" value={current.taxDeposited || ''} onChange={e => setCurrent({ ...current, taxDeposited: Number(e.target.value) })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white" /></div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Remarks [425] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2">
                                    <select value={current.remarks || 'Normal'} onChange={e => setCurrent({ ...current, remarks: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none bg-white">
                                        {REMARKS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-2">
                                <label className="text-sm font-medium text-slate-700 text-right">Certificate No. [425] <span className="text-blue-500">?</span></label>
                                <div className="col-span-2"><input disabled={current.remarks === 'Normal'} value={current.certificateNo || ''} onChange={e => setCurrent({ ...current, certificateNo: e.target.value })} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-500 outline-none disabled:bg-slate-100 bg-white" /></div>
                            </div>

                            <div className="flex items-center gap-2 justify-end pt-2">
                                <label className="text-xs text-slate-600 cursor-pointer select-none">
                                    <input type="checkbox" checked={showAllColumns} onChange={e => setShowAllColumns(e.target.checked)} className="mr-1 rounded text-brand-600 focus:ring-brand-500" />
                                    Show All Columns <span className="text-blue-500">?</span>
                                </label>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setCurrent(initialEntryState)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md hover:bg-slate-200 transition font-medium border border-slate-300">Cancel</button>
                                <button type="submit" className="flex-[2] bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700 transition font-medium shadow-sm">Add Record</button>
                            </div>
                        </form>
                    </div>
                    <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-3 text-sm flex justify-between items-center">
                            <div>
                                <span className="text-slate-500 mr-2">Challan Date: {selectedChallan.date ? selectedChallan.date.split('-').reverse().join('/') : '-'}</span>
                                <span className="text-slate-500 mr-2">|</span>
                                <span className="text-slate-500 mr-2">Amount: {selectedChallan.total.toFixed(2)}</span>
                                <span className="text-slate-500 mr-2">|</span>
                                <span className="text-slate-500">No.: {selectedChallan.serialNo}</span>
                            </div>
                            <div className="text-slate-500">Challan Serial No. {myChallans.findIndex(c => c.id === selectedChallanId) + 1}</div>
                        </div>
                        {/* Summary Header in Grid */}
                        <div className="grid grid-cols-5 bg-white border-b border-slate-200 p-3 text-center text-xs font-semibold text-slate-600">
                            <div>Deductees <div className="text-slate-800 text-sm mt-1">{challanDeductions.length}</div></div>
                            <div>Income Tax <div className="text-slate-800 text-sm mt-1">{challanDeductions.reduce((s, d) => s + d.incomeTax, 0).toFixed(2)}</div></div>
                            <div>Surcharge <div className="text-slate-800 text-sm mt-1">{challanDeductions.reduce((s, d) => s + d.surcharge, 0).toFixed(2)}</div></div>
                            <div>Cess <div className="text-slate-800 text-sm mt-1">{challanDeductions.reduce((s, d) => s + d.cess, 0).toFixed(2)}</div></div>
                            <div>Total <div className="text-slate-800 text-sm mt-1">{challanDeductions.reduce((s, d) => s + (d.taxDeposited || 0), 0).toFixed(2)}</div></div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="p-2 text-xs">Sl.</th>
                                        <th className="p-2 text-xs">PAN No.</th>
                                        <th className="p-2 text-xs">Party Name</th>
                                        <th className="p-2 text-xs">Section</th>
                                        <th className="p-2 text-xs text-right">Amount</th>
                                        <th className="p-2 text-xs text-right">Date</th>
                                        <th className="p-2 text-xs text-right">Total</th>
                                        <th className="p-2 text-xs text-right">Tax Dep.</th>
                                        <th className="p-2 text-xs text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {challanDeductions.map((d, index) => {
                                        const ded = myDeductees.find(x => x.id === d.deducteeId);
                                        return (
                                            <tr key={d.id} className="hover:bg-slate-50">
                                                <td className="p-2 text-center text-slate-500">{index + 1}</td>
                                                <td className="p-2 font-mono text-xs">{ded?.pan}</td>
                                                <td className="p-2 font-medium truncate max-w-[150px]">{ded?.name}</td>
                                                <td className="p-2 text-xs">{d.section}</td>
                                                <td className="p-2 text-right">{d.amountOfPayment.toFixed(2)}</td>
                                                <td className="p-2 text-right text-xs">{d.paymentDate ? d.paymentDate.split('-').reverse().join('/') : '-'}</td>
                                                <td className="p-2 text-right">{d.totalTax.toFixed(2)}</td>
                                                <td className="p-2 text-right font-medium">{(d.taxDeposited || 0).toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => setCurrent(d)} className="text-blue-600 text-xs hover:underline mr-2">Edit</button>
                                                    <button onClick={() => handleDelete(d.id)} className="text-blue-600 text-xs hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {challanDeductions.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-400">No records in this challan</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 bg-blue-100 border border-blue-200 rounded p-1 flex justify-between items-center px-4 m-2">
                            <div className="flex gap-2">
                                <button className="text-slate-400 text-xs hover:text-slate-600"><ChevronLeft size={14} /></button>
                                <button className="text-slate-400 text-xs hover:text-slate-600 rotate-180"><ChevronLeft size={14} /></button>
                            </div>
                            <div className="text-xs text-slate-600">
                                Page <input value="1" className="w-8 text-center border border-slate-300 rounded mx-1" readOnly /> of 1
                            </div>
                            <div className="flex items-center gap-2">
                                <select className="text-xs border border-slate-300 rounded p-0.5"><option>15</option></select>
                                <span className="text-xs text-slate-600">Displaying 1 to {challanDeductions.length} of {challanDeductions.length} records.</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : <div className="text-center py-12 text-slate-500">Select a Challan to add records.</div>}
        </div>
    );
};

// --- Return & FVU Generation ---
const ReturnGenerator: React.FC<{ onNavigateToChallan?: () => void }> = ({ onNavigateToChallan }) => {
    const { activeReturnContext, deductors, challans, deductees, deductions, completeReturn, createOrUpdateReturn, returns } = useTds();
    const [csiMode, setCsiMode] = useState<'password' | 'otp' | 'manual'>('manual');
    const [showCsiModal, setShowCsiModal] = useState(false);
    const [validationSuccess, setValidationSuccess] = useState(false);
    const [validationStatus, setValidationStatus] = useState<string>('');
    const [validationReport, setValidationReport] = useState<any>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [originalToken, setOriginalToken] = useState(activeReturnContext?.previousTokenNumber || '');
    const [hasEarlierReturn, setHasEarlierReturn] = useState(false);

    // Sync token back to context state
    useEffect(() => {
        if (activeReturnContext && originalToken !== activeReturnContext.previousTokenNumber) {
            createOrUpdateReturn({
                deductorId: activeReturnContext.deductorId,
                financialYear: activeReturnContext.financialYear,
                quarter: activeReturnContext.quarter,
                formNo: activeReturnContext.formNo,
                type: activeReturnContext.type,
                previousTokenNumber: originalToken
            });
        }
    }, [originalToken]);

    // Reset/Init state when switching returns
    useEffect(() => {
        const token = activeReturnContext?.previousTokenNumber || '';
        setOriginalToken(token);
        // Only auto-enable for Regular returns if token exists. Correction always shows input.
        if (activeReturnContext?.type === 'Regular') {
            setHasEarlierReturn(!!token);
        } else {
            setHasEarlierReturn(false);
        }
    }, [activeReturnContext?.id]);

    const downloadFile = (filename: string, content: string) => {
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleValidationSuccess = () => {
        setValidationSuccess(true);
        setValidationStatus('✓ CSI File Validation Passed');
        // Optionally jump straight to confirmation if that's the desired flow,
        // but for now we just enable the button and maybe show confirmation.
        // The modal "Proceed to Generate" button calls this, so it makes sense to show confirmation.
        setShowConfirmation(true);
    };

    const confirmGenerate = async () => {
        if (!activeReturnContext || !activeReturnContext.id) {
            alert('Return ID not found. Please reload or select the return again.');
            return;
        }

        try {
            // Trigger server-side generation and download
            const url = `/api/returns/${activeReturnContext.id}/txt`;
            window.open(url, '_blank');

            // Mark as Completed
            completeReturn(activeReturnContext.deductorId, activeReturnContext.financialYear, activeReturnContext.quarter, activeReturnContext.formNo, activeReturnContext.type);

            setShowConfirmation(false);
            setValidationStatus('File generated successfully.');
        } catch (error) {
            console.error('Generation failed:', error);
            setValidationStatus('Error generating file.');
        }
    };

    const handleGenerateClick = () => {
        if (activeReturnContext?.type === 'Correction' && !originalToken) {
            alert("Original Token Number is required for Correction Returns.");
            return;
        }

        // New Validation: Form 26Q Regular with Earlier Return
        if (
            activeReturnContext?.type === 'Regular' &&
            activeReturnContext?.formNo === '26Q' &&
            hasEarlierReturn &&
            (!originalToken || originalToken.trim() === '')
        ) {
            alert("Previous Token Number is mandatory for Form 26Q when filed earlier.");
            return;
        }

        if (validationSuccess) setShowConfirmation(true);
    };

    const checkReturnValidity = async () => {
        if (!activeReturnContext || !activeReturnContext.id) {
            alert('Return ID not found. Please reload or select the return again.');
            return;
        }

        setIsChecking(true);
        setValidationStatus('Validating return data...');

        try {
            const response = await fetch(`/api/returns/${activeReturnContext.id}/validate-txt`, {
                method: 'POST'
            });

            const result = await response.json();
            setValidationReport(result);

            if (result.isValid) {
                setValidationStatus('✓ All validations passed!');
                setValidationSuccess(true);
            } else {
                setValidationStatus(`✗ ${result.errors.length} error(s) found`);
                setValidationSuccess(false);
            }
        } catch (error) {
            console.error('Validation check failed:', error);
            setValidationStatus('Error checking return validity');
            setValidationSuccess(false);
        } finally {
            setIsChecking(false);
        }
    };

    if (!activeReturnContext) return null;

    const deductor = deductors.find(d => d.id === activeReturnContext.deductorId);
    const myChallans = challans.filter(c => c.deductorId === activeReturnContext.deductorId && c.financialYear === activeReturnContext.financialYear && c.quarter === activeReturnContext.quarter);
    const myDeductions = deductions.filter(d => d.deductorId === activeReturnContext.deductorId && myChallans.some(c => c.id === d.challanId));
    const totalTax = myChallans.reduce((acc, c) => acc + c.total, 0);
    const isCorrection = activeReturnContext.type === 'Correction';

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-500 relative">
            <CsiValidationModal
                isOpen={showCsiModal}
                onClose={() => setShowCsiModal(false)}
                returnContext={activeReturnContext}
                onGenerate={handleValidationSuccess}
                onFixErrors={onNavigateToChallan}
            />
            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isCorrection ? 'text-orange-700' : 'text-slate-800'}`}>
                <FileText /> Generate {isCorrection ? 'Correction' : ''} Return
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Configuration */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-slate-700">Return Information</h3>
                            <div className="group relative">
                                <span className="px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full font-bold cursor-help flex items-center gap-1">
                                    FVU 9.3 Integrated <Info size={12} />
                                </span>
                                <div className="absolute right-0 w-64 p-3 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-10 mt-1 leading-relaxed">
                                    The e-TDS/TCS FVU is a Java based utility. This system simulates the JRE (Java Run-time Environment) [versions: SUN JRE: 1.6 onwards] required for generating valid .fvu files.
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            {isCorrection ? (
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Original Token Number <span className="text-red-500">*</span></label>
                                    <input
                                        value={originalToken}
                                        onChange={(e) => setOriginalToken(e.target.value)}
                                        placeholder="Enter RRR Number of Regular Return"
                                        className="w-full border rounded p-2 bg-orange-50 border-orange-200 focus:ring-orange-500 bg-white"
                                    />
                                    <p className="text-xs text-orange-600 mt-1">Required to link correction with original filing.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                                        <span className="text-slate-500">Regular Return filed earlier?</span>
                                        <select
                                            value={hasEarlierReturn ? 'Yes' : 'No'}
                                            onChange={(e) => setHasEarlierReturn(e.target.value === 'Yes')}
                                            className="border rounded p-1 bg-white"
                                        >
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    {hasEarlierReturn && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-slate-700 font-medium mb-1">
                                                Previous Token Number
                                                {activeReturnContext?.formNo === '26Q' && <span className="text-red-500"> *</span>}
                                            </label>
                                            <input
                                                value={originalToken}
                                                onChange={(e) => setOriginalToken(e.target.value)}
                                                placeholder="Enter Token Number of Previous Return"
                                                className="w-full border rounded p-2 border-slate-300 focus:ring-brand-500 bg-white"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                {activeReturnContext?.formNo === '26Q'
                                                    ? 'Mandatory for Form 26Q if filed earlier.'
                                                    : 'Optional. Enter if available.'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                <span className="text-slate-700">No change in address</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-700 mb-3">Options for CSI file:</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="csi" checked={csiMode === 'password'} onChange={() => setCsiMode('password')} /> Income Tax Password
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="csi" checked={csiMode === 'otp'} onChange={() => setCsiMode('otp')} /> Income Tax OTP
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="csi" checked={csiMode === 'manual'} onChange={() => setCsiMode('manual')} /> Upload CSI Manually
                            </label>
                        </div>
                    </div>

                    {csiMode !== 'manual' && (
                        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${csiMode === 'password' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {csiMode === 'password' ? <Lock size={18} /> : <Smartphone size={18} />}
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-800">
                                        {csiMode === 'password' ? 'Portal Password Mode' : 'Portal OTP Mode'}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                        {csiMode === 'password'
                                            ? 'Connect directly to the e-filing portal using TAN & Password.'
                                            : 'Authenticate using Aadhaar/Mobile OTP for direct access.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCsiModal(true)}
                                className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Globe size={18} /> Connect & Download CSI
                            </button>
                        </div>
                    )}

                    {csiMode === 'manual' && (
                        <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Upload & Validate CSI File</label>

                            <button
                                onClick={() => setShowCsiModal(true)}
                                className={`w-full py-3 rounded-md font-medium flex items-center justify-center gap-2 transition border ${validationSuccess
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                                    }`}
                            >
                                {validationSuccess ? (
                                    <><CheckCircle size={18} /> Validation Successful (Click to view/re-validate)</>
                                ) : (
                                    <><Upload size={18} /> Upload .csi File & Validate</>
                                )}
                            </button>
                            {validationSuccess && <div className="text-center text-xs text-green-600 mt-2">Ready for FVU Generation</div>}
                        </div>
                    )}
                </div>

                {/* Right: Summary & Action */}
                <div className="flex flex-col">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <div className="bg-slate-50 px-4 py-2 font-semibold text-slate-700 border-b">Return Summary</div>
                        <div className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-slate-800">{myChallans.length}</div>
                                <div className="text-xs text-slate-500 uppercase">Challans</div>
                            </div>
                            <div>
                                <div className={`text-2xl font-bold ${myDeductions.length > 0 ? 'text-slate-800' : 'text-red-600'}`}>{myDeductions.length}</div>
                                <div className="text-xs text-slate-500 uppercase">Deductee Records</div>
                            </div>
                        </div>
                    </div>

                    {myDeductions.length === 0 && myChallans.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex gap-3">
                            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800">
                                <p className="font-semibold mb-1">No deductee/collectee records found</p>
                                <p className="text-xs mb-2">At least one deductee/collectee record is required per Income Tax Department guidelines.</p>
                                <p className="text-xs">Please configure deductees in the Masters section and add deductions to generate valid FVU records.</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4 flex gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>Ensure the CSI file matches the selected period. Validation is required to generate the final FVU file.</p>
                        </div>

                        {/* Validation Report */}
                        {validationReport && (
                            <div className={`mb-4 p-4 rounded-lg border text-sm ${validationReport.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`font-semibold mb-2 flex items-center gap-2 ${validationReport.isValid ? 'text-green-800' : 'text-red-800'}`}>
                                    {validationReport.isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {validationReport.isValid ? 'Validation Passed' : 'Validation Failed'}
                                </div>

                                {validationReport.checks && validationReport.checks.length > 0 && (
                                    <div className={`mb-2 space-y-1 ${validationReport.isValid ? 'text-green-700' : 'text-slate-700'}`}>
                                        {validationReport.checks.map((check: string, idx: number) => (
                                            <div key={idx} className="text-xs">✓ {check}</div>
                                        ))}
                                    </div>
                                )}

                                {validationReport.errors && validationReport.errors.length > 0 && (
                                    <div className="mb-2 space-y-1 text-red-700">
                                        {validationReport.errors.map((err: string, idx: number) => (
                                            <div key={idx} className="text-xs">✗ {err}</div>
                                        ))}
                                    </div>
                                )}

                                {validationReport && validationReport.warnings && validationReport.warnings.length > 0 && (
                                    <div className="space-y-1 text-amber-700">
                                        {validationReport.warnings.map((warn: string, idx: number) => (
                                            <div key={idx} className="text-xs">⚠ {warn}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={checkReturnValidity}
                                disabled={isChecking}
                                className="flex-1 bg-slate-700 text-white py-2 rounded-lg font-medium transition hover:bg-slate-800 disabled:bg-slate-400 flex items-center justify-center gap-2"
                            >
                                {isChecking ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Validating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} /> Check Data
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={handleGenerateClick}
                            disabled={!validationSuccess}
                            className={`w-full text-white py-4 rounded-lg font-bold text-lg shadow-lg transition flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:cursor-not-allowed ${isCorrection ? 'bg-orange-600 hover:bg-orange-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                        >
                            <Download /> Create {isCorrection ? 'Correction' : 'TDS'} Return (FVU)
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-lg">Confirm Generation</h3>
                            <button onClick={() => setShowConfirmation(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 border border-blue-100">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p>You are about to generate the final FVU file using <b>FVU Version 9.3</b>. Please verify the following details.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <div className="text-slate-500 text-xs uppercase mb-1">Total Tax Liability</div>
                                    <div className="font-bold text-lg">₹{totalTax.toFixed(2)}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <div className="text-slate-500 text-xs uppercase mb-1">Deductee Count</div>
                                    <div className="font-bold text-lg">{myDeductions.length}</div>
                                </div>
                            </div>

                            <div className="text-sm space-y-2 border-t pt-4">
                                <h4 className="font-semibold text-slate-700">Responsible Person Details</h4>
                                <div className="grid grid-cols-3 gap-2 text-slate-600">
                                    <span className="text-slate-500">Name:</span>
                                    <span className="col-span-2 font-medium text-slate-800">{deductor?.responsiblePerson}</span>

                                    <span className="text-slate-500">Designation:</span>
                                    <span className="col-span-2 font-medium text-slate-800">{deductor?.responsibleDesignation}</span>

                                    <span className="text-slate-500">PAN:</span>
                                    <span className="col-span-2 font-medium text-slate-800 font-mono">{deductor?.responsiblePan}</span>

                                    <span className="text-slate-500">Mobile:</span>
                                    <span className="col-span-2 font-medium text-slate-800 font-mono">{deductor?.responsibleMobile || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={confirmGenerate} className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 shadow-sm flex items-center gap-2">
                                <CheckCircle size={16} /> Confirm & Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Regular Return View ---
enum ReturnTab { Challan = 'Challan', Deduction = 'Deduction', Generation = 'Generation' }

export const RegularReturn: React.FC = () => {
    const { activeReturnContext, setReturnContext, deductors, saveCurrentReturn, challans, deductions } = useTds();
    const [activeTab, setActiveTab] = useState<ReturnTab>(ReturnTab.Challan);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());

    const deductorName = activeReturnContext ? deductors.find(d => d.id === activeReturnContext.deductorId)?.name : '';
    const isCorrection = activeReturnContext?.type === 'Correction';

    const handleManualSave = useCallback(() => {
        if (!activeReturnContext) return;
        setIsSaving(true);
        saveCurrentReturn();
        setTimeout(() => {
            setLastSaved(new Date());
            setIsSaving(false);
        }, 800); // Simulate delay for feedback
    }, [activeReturnContext, saveCurrentReturn]);

    // Auto-save visual feedback when data changes
    useEffect(() => {
        if (!activeReturnContext) return;
        setIsSaving(true);
        const timer = setTimeout(() => {
            setLastSaved(new Date());
            setIsSaving(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [challans, deductions, activeReturnContext]);

    // Auto-save interval (30 seconds)
    useEffect(() => {
        if (!activeReturnContext) return;

        const interval = setInterval(() => {
            handleManualSave();
        }, 30000);

        return () => clearInterval(interval);
    }, [activeReturnContext, handleManualSave]);

    if (!activeReturnContext) return <ReturnSetup onProceed={setReturnContext} />;

    return (
        <div className="space-y-6">
            <div className={`border-b p-4 -mt-8 -mx-8 mb-6 sticky top-0 z-10 shadow-sm flex items-center justify-between transition-colors ${isCorrection ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <button onClick={() => setReturnContext(null)} className="hover:text-brand-600 flex items-center gap-1"><ChevronLeft size={14} /> Back</button>
                        <span>/</span><span>{activeReturnContext.formNo}</span>
                        {isCorrection && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold ml-2">CORRECTION MODE</span>}
                    </div>
                    <h1 className={`text-xl font-bold ${isCorrection ? 'text-orange-900' : 'text-slate-800'}`}>{deductorName}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-sm hidden lg:block">
                        <span className="text-slate-500 mr-2">FY:</span> <span className="font-bold text-slate-800">{activeReturnContext.financialYear}</span>
                        <span className="mx-3 text-slate-300">|</span>
                        <span className="text-slate-500 mr-2">Qtr:</span> <span className="font-bold text-slate-800">{activeReturnContext.quarter}</span>
                        {activeReturnContext.previousTokenNumber && (
                            <>
                                <span className="mx-3 text-slate-300">|</span>
                                <span className="text-slate-500 mr-2">Token:</span>
                                <span className={`font-mono text-xs font-bold ${String(activeReturnContext.previousTokenNumber).replace(/\D/g, '').length === 15
                                    ? 'text-green-600 bg-green-50 px-2 py-1 rounded'
                                    : 'text-amber-600 bg-amber-50 px-2 py-1 rounded'
                                    }`}>
                                    {String(activeReturnContext.previousTokenNumber).replace(/\D/g, '').length === 15
                                        ? String(activeReturnContext.previousTokenNumber).replace(/\D/g, '')
                                        : `${String(activeReturnContext.previousTokenNumber).replace(/\D/g, '')} (${String(activeReturnContext.previousTokenNumber).replace(/\D/g, '').length}/15)`
                                    }
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-right hidden sm:block">
                            {isSaving ? (
                                <span className="flex items-center gap-1 text-brand-600"><Loader2 size={12} className="animate-spin" /> Saving...</span>
                            ) : (
                                <span className="text-slate-400">Saved {lastSaved.toLocaleTimeString()}</span>
                            )}
                        </div>
                        <button
                            onClick={handleManualSave}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition border ${isCorrection ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200' : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-200'}`}
                        >
                            <Save size={16} /> {isSaving ? 'Saving' : 'Save Draft'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 border-b border-slate-200 mb-6">
                {[ReturnTab.Challan, ReturnTab.Deduction, ReturnTab.Generation].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <div>
                {activeTab === ReturnTab.Challan && <ChallanManager onNavigateToDeductions={() => setActiveTab(ReturnTab.Deduction)} />}
                {activeTab === ReturnTab.Deduction && <DeductionManager />}
                {activeTab === ReturnTab.Generation && <ReturnGenerator onNavigateToChallan={() => setActiveTab(ReturnTab.Challan)} />}
            </div>
        </div>
    );
};
