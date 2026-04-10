
import React, { useState } from 'react';
import { useTds } from '../store';
import { Upload, CheckCircle, AlertCircle, X, Loader2, FileText, Smartphone, Globe, Lock } from 'lucide-react';
import { ReturnContext } from '../types';

interface CsiValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    returnContext: ReturnContext | null;
    onGenerate?: () => void;
    onFixErrors?: () => void;
}

export const CsiValidationModal: React.FC<CsiValidationModalProps> = ({ isOpen, onClose, returnContext, onGenerate, onFixErrors }) => {
    const { returns, deductors } = useTds();
    const [file, setFile] = useState<File | null>(null);
    const [itPassword, setItPassword] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');
    const [downloadStatus, setDownloadStatus] = useState('');

    const activeReturn = returns.find(r =>
        returnContext &&
        r.deductorId === returnContext.deductorId &&
        r.financialYear === returnContext.financialYear &&
        r.quarter === returnContext.quarter &&
        r.formNo === returnContext.formNo
    );

    const activeDeductor = activeReturn ? deductors.find(d => d.id === activeReturn.deductorId) : null;

    React.useEffect(() => {
        if (activeDeductor?.itPassword && !itPassword) {
            setItPassword(activeDeductor.itPassword);
        }
    }, [activeDeductor, itPassword]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null); // Reset previous result
        }
    };

    const handleDownloadAndValidate = async () => {
        if (!itPassword || !activeReturn) return;

        setIsDownloading(true);
        setDownloadStatus('Connecting to Income Tax Portal...');
        try {
            const response = await fetch(`/api/returns/${activeReturn.id}/download-csi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: itPassword })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Download failed");
            }

            const data = await response.json();
            setDownloadStatus('Download successful! Validating content...');

            // Now trigger validation with the downloaded content
            await triggerValidation(data.csiContent);

        } catch (error: any) {
            console.error(error);
            alert(`Portal Error: ${error.message}`);
        } finally {
            setIsDownloading(false);
            setDownloadStatus('');
        }
    };

    const triggerValidation = async (content: string) => {
        if (!activeReturn) return;

        setIsValidating(true);
        try {
            const response = await fetch(`/api/returns/${activeReturn.id}/validate-csi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csiContent: content })
            });

            if (!response.ok) throw new Error("Validation request failed");

            const data = await response.json();
            setResult(data);

        } catch (error) {
            console.error(error);
            alert("Failed to validate CSI content. See console for details.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleValidate = async () => {
        if (!file || !activeReturn) return;
        const content = await file.text();
        await triggerValidation(content);
    };

    const downloadReport = () => {
        if (!result) return;

        let report = `CSI Validation Report\n`;
        report += `Date: ${new Date().toLocaleString()}\n`;
        report += `Status: ${result.isValid ? 'PASSED' : 'FAILED'}\n`;
        report += `----------------------------------------\n`;
        report += `Summary:\n`;
        report += `Total Challans: ${result.stats.totalChallans}\n`;
        report += `Matched: ${result.stats.matched}\n`;
        report += `Unmatched: ${result.stats.unmatched}\n`;
        report += `----------------------------------------\n`;

        if (result.checks && result.checks.length > 0) {
            report += `\nPassed Checks:\n`;
            result.checks.forEach((c: string) => report += `[OK] ${c}\n`);
        }

        if (result.errors && result.errors.length > 0) {
            report += `\nErrors:\n`;
            result.errors.forEach((e: string) => report += `[ERROR] ${e}\n`);
        }

        if (result.warnings && result.warnings.length > 0) {
            report += `\nWarnings:\n`;
            result.warnings.forEach((w: string) => report += `[WARN] ${w}\n`);
        }

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `csi-validation-report-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-brand-600" /> CSI File Validation
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Reconcile your challans with Bank CSI data.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">

                    {/* Tabs */}
                    {!result && (
                        <div className="flex border-b border-slate-100 mb-6 sticky top-0 bg-white z-10">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'upload' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Upload size={16} className="inline mr-2" /> Upload File
                            </button>
                            <button
                                onClick={() => setActiveTab('download')}
                                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'download' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Globe size={16} className="inline mr-2" /> Download from Portal
                            </button>
                        </div>
                    )}

                    {/* File Upload Area */}
                    {!result && activeTab === 'upload' && (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition group cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csi,.txt"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload className="text-slate-400 group-hover:text-brand-600" size={32} />
                                </div>
                                <h4 className="text-lg font-medium text-slate-700 mb-1">
                                    {file ? file.name : "Click to Upload CSI File"}
                                </h4>
                                <p className="text-sm text-slate-400">Supported formats: .csi, .txt</p>
                            </div>

                            {activeDeductor?.itPassword && (
                                <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                                            <Globe size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-brand-900">Direct Portal Connection Available</p>
                                            <p className="text-xs text-brand-700">You have a password saved for this business.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('download')}
                                        className="text-xs font-bold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition"
                                    >
                                        Use Portal Instead
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Download Area */}
                    {!result && activeTab === 'download' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4">
                                <Globe className="text-blue-600 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-semibold text-blue-900">Direct Portal Connection</h4>
                                    <p className="text-sm text-blue-700 mt-0.5">
                                        We'll log into the Income Tax Portal for <b>{activeReturn?.tan}</b> to fetch challans for <b>{activeReturn?.quarter} {activeReturn?.financialYear}</b>.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                        <Lock size={14} className="text-slate-400" /> Income Tax Portal Password
                                    </label>
                                    <input
                                        type="password"
                                        value={itPassword}
                                        onChange={(e) => setItPassword(e.target.value)}
                                        placeholder="Enter portal password"
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition outline-none shadow-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">
                                        * Password is used only for this one-time download session and is not stored.
                                    </p>
                                </div>

                                {isDownloading && (
                                    <div className="flex flex-col items-center justify-center py-4 gap-3 animate-pulse">
                                        <Loader2 size={32} className="text-brand-600 animate-spin" />
                                        <p className="text-brand-700 font-medium">{downloadStatus}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Result View */}
                    {result && (
                        <div className="space-y-6">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl border flex items-start gap-4 ${result.isValid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className={`p-2 rounded-full shrink-0 ${result.isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {result.isValid ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                </div>
                                <div>
                                    <h4 className={`text-lg font-bold ${result.isValid ? 'text-green-800' : 'text-red-800'}`}>
                                        {result.message}
                                    </h4>
                                    <div className="flex gap-6 mt-3 text-sm font-medium">
                                        <div className="text-slate-600">Total Challans: <span className="text-slate-900">{result.stats.totalChallans}</span></div>
                                        <div className="text-green-600">Matched: <span>{result.stats.matched}</span></div>
                                        <div className="text-red-600">Unmatched: <span>{result.stats.unmatched}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Checks List (Successes) */}
                            {result.checks && result.checks.length > 0 && (
                                <div className="bg-white border border-green-100 rounded-lg overflow-hidden">
                                    <div className="px-4 py-2 bg-green-50 text-green-700 font-semibold text-sm border-b border-green-100">
                                        Passed Checks ({result.checks.length})
                                    </div>
                                    <ul className="divide-y divide-green-50">
                                        {result.checks.map((check: string, i: number) => (
                                            <li key={i} className="p-3 text-sm text-green-600 bg-green-50/30 flex items-start gap-2">
                                                <span className="mt-0.5">✓</span> {check}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Errors List */}
                            {result.errors.length > 0 && (
                                <div className="bg-white border border-red-100 rounded-lg overflow-hidden">
                                    <div className="px-4 py-2 bg-red-50 text-red-700 font-semibold text-sm border-b border-red-100">
                                        Errors ({result.errors.length})
                                    </div>
                                    <ul className="divide-y divide-red-50">
                                        {result.errors.map((err: string, i: number) => (
                                            <li key={i} className="p-3 text-sm text-red-600 bg-red-50/30 flex items-start gap-2">
                                                <span className="mt-0.5">•</span> {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Warnings List */}
                            {result.warnings.length > 0 && (
                                <div className="bg-white border border-amber-100 rounded-lg overflow-hidden">
                                    <div className="px-4 py-2 bg-amber-50 text-amber-700 font-semibold text-sm border-b border-amber-100">
                                        Warnings ({result.warnings.length})
                                    </div>
                                    <ul className="divide-y divide-amber-50">
                                        {result.warnings.map((warn: string, i: number) => (
                                            <li key={i} className="p-3 text-sm text-amber-600 bg-amber-50/30 flex items-start gap-2">
                                                <span className="mt-0.5">•</span> {warn}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-center gap-4 pt-2">
                                <button onClick={() => { setFile(null); setResult(null); setItPassword(''); }} className="text-brand-600 font-medium hover:underline text-sm">
                                    Validate Another File
                                </button>
                                <button onClick={downloadReport} className="text-slate-600 font-medium hover:underline text-sm flex items-center gap-1">
                                    <FileText size={14} /> Download Report
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition">
                        Close
                    </button>
                    {!result && activeTab === 'upload' && (
                        <button
                            disabled={!file || isValidating}
                            onClick={handleValidate}
                            className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isValidating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            {isValidating ? 'Validating...' : 'Validate Now'}
                        </button>
                    )}

                    {!result && activeTab === 'download' && (
                        <button
                            disabled={!itPassword || isDownloading || isValidating}
                            onClick={handleDownloadAndValidate}
                            className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                            {isDownloading ? 'Downloading...' : 'Download & Validate'}
                        </button>
                    )}

                    {/* Show Generate Button if Valid and Handler Provided */}
                    {result && result.isValid && onGenerate && (
                        <button
                            onClick={() => {
                                onClose();
                                onGenerate();
                            }}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-sm flex items-center gap-2 animate-in fade-in"
                        >
                            <CheckCircle size={18} /> Proceed to Generate
                        </button>
                    )}

                    {/* Show Fix Errors Button if Invalid */}
                    {result && !result.isValid && onFixErrors && (
                        <button
                            onClick={() => {
                                onClose();
                                onFixErrors();
                            }}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-sm flex items-center gap-2 animate-in fade-in"
                        >
                            Fix Errors in Challans
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
