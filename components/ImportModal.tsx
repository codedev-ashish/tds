
import React, { useState, useRef } from 'react';
import { Upload, X, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onImport: (file: File) => Promise<{ success: boolean; message: string; count?: number }>;
    sampleUrl: string;
    description?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    title,
    onImport,
    sampleUrl,
    description
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [importCount, setImportCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        try {
            const result = await onImport(file);
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                setImportCount(result.count || 0);
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        } catch (error) {
            setStatus('error');
            setMessage('An unexpected error occurred during import.');
            console.error(error);
        }
    };

    const reset = () => {
        setFile(null);
        setStatus('idle');
        setMessage('');
        setImportCount(0);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Import Successful!</h3>
                            <p className="text-slate-600 mb-6">{message || `Successfully imported ${importCount} records.`}</p>
                            <button
                                onClick={() => { reset(); onClose(); }}
                                className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {description && <p className="text-sm text-slate-600">{description}</p>}

                            <div className="flex justify-between items-center p-4 bg-brand-50 rounded-xl border border-brand-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-brand-600 shadow-sm">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Need a template?</p>
                                        <p className="text-xs text-slate-500">Download the sample Excel file.</p>
                                    </div>
                                </div>
                                <a
                                    href={sampleUrl}
                                    download
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-brand-600 text-xs font-bold rounded-lg border border-brand-200 hover:bg-brand-50 transition shadow-sm"
                                >
                                    <Download size={14} /> Download Sample
                                </a>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={`group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? 'border-brand-500 bg-brand-50/30' : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                />
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className={file ? 'text-brand-600' : 'text-slate-400'} size={24} />
                                </div>
                                {file ? (
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{file.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Click or drag Excel to upload</p>
                                        <p className="text-xs text-slate-500 mt-1">Accepts .xlsx and .xls formats</p>
                                    </div>
                                )}
                            </div>

                            {status === 'error' && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p className="text-xs">{message}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    disabled={status === 'uploading' || !file}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={status === 'uploading' || !file}
                                    className="flex-[2] py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {status === 'uploading' ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        'Start Import'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
