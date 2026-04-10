
import React, { useState } from 'react';
import { useTds } from '../store';
import { Globe, Lock, ShieldCheck, ExternalLink, Loader2, AlertCircle, Info, Key, Building } from 'lucide-react';

export const PortalBridge: React.FC = () => {
    const { deductors, activeDeductorId } = useTds();
    const [isLaunching, setIsLaunching] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const activeDeductor = deductors.find(d => d.id === activeDeductorId);

    const handleLaunch = async () => {
        if (!activeDeductor) return;

        setIsLaunching(true);
        setStatus(null);

        try {
            const res = await fetch('/api/portal/launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tan: activeDeductor.tan,
                    password: activeDeductor.itPassword
                })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: 'Browser launched successfully! Please check your taskbar.' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to launch portal window.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Network error. Make sure the server is running.' });
        } finally {
            setIsLaunching(false);
        }
    };

    if (!activeDeductor) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 m-8">
                <Building size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Please select a business first to connect to the portal.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Income Tax Portal Bridge</h2>
                    <p className="text-slate-500 text-sm">Securely connect and login to the e-filing portal.</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200">
                    <ShieldCheck size={14} /> Encrypted Connection
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Connection Box */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Globe size={40} className="text-brand-600" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">Direct Portal Link</h3>
                    <p className="text-slate-500 text-sm mb-8 px-4">
                        This tool will launch a secure, dedicated browser window and automatically pre-fill your credentials.
                    </p>

                    <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase">User ID (TAN)</span>
                            <span className="font-mono font-bold text-slate-700">{activeDeductor.tan}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase">Password</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-700">
                                    {activeDeductor.itPassword ? '••••••••' : <span className="text-red-400 text-[10px] italic">Not Saved</span>}
                                </span>
                                <Key size={14} className="text-slate-300" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLaunch}
                        disabled={isLaunching}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95 ${isLaunching ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                    >
                        {isLaunching ? (
                            <><Loader2 className="animate-spin" size={20} /> Launching Browser...</>
                        ) : (
                            <><ExternalLink size={20} /> Open & Auto-Login</>
                        )}
                    </button>

                    {status && (
                        <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 text-sm text-left animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
                            }`}>
                            {status.type === 'success' ? <ShieldCheck className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}
                            <p>{status.message}</p>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                        <h4 className="flex items-center gap-2 font-bold text-blue-900 mb-4">
                            <Info size={18} /> Why use the Portal Bridge?
                        </h4>
                        <ul className="space-y-4 text-sm text-blue-800">
                            <li className="flex gap-3">
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                                <span><strong>Avoid Manual Login:</strong> No need to remember or type complex TAN numbers and passwords.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                                <span><strong>Handle Captchas:</strong> Since the browser is visible, you can easily solve captchas while our system handles the rest.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                                <span><strong>Secure Environment:</strong> Launches a fresh, clean browser instance separate from your daily browsing.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                        <h4 className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                            Privacy Notice
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Your credentials are only used to initiate the login process on your local machine. We never store or transmit your password outside of your secure local database.
                            <br /><br />
                            <strong>Pro Tip:</strong> Once logged in, you can navigate to "e-Pay Tax" {'>'} "Payment History" to download CSI files manually if the auto-download fails.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
