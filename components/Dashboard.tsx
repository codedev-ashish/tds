
import React from 'react';
import { useTds } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, Users, FileText, ArrowRight, Newspaper } from 'lucide-react';

interface DashboardProps {
    onViewAllNews?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewAllNews }) => {
    const { deductors, activeDeductorId, challans, deductions, news } = useTds();

    if (!activeDeductorId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-500">
                        <Users size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Business Selected</h2>
                    <p className="mb-6">Select a business from the top menu or create a new one to start managing TDS.</p>
                    <p className="text-sm bg-slate-50 p-2 rounded text-slate-500">Total Deductors managed: {deductors.length}</p>
                </div>
            </div>
        );
    }

    const myChallans = challans.filter(c => c.deductorId === activeDeductorId);
    const myDeductions = deductions.filter(d => d.deductorId === activeDeductorId);

    const totalPaid = myChallans.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalDeducted = myDeductions.reduce((sum, d) => sum + (d.taxDeposited || 0), 0);
    const balance = totalPaid - totalDeducted;

    // Chart Data Preparation
    const sectionDataMap: Record<string, number> = {};
    myDeductions.forEach(d => {
        sectionDataMap[d.section] = (sectionDataMap[d.section] || 0) + (d.taxDeposited || 0);
    });
    const sectionData = Object.keys(sectionDataMap).map(key => ({ name: key, value: sectionDataMap[key] }));

    const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

    // Latest News (Top 5)
    const latestNews = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><IndianRupee size={24} /></div>
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Paid</span>
                    </div>
                    <div className="text-slate-500 text-sm font-medium">Total Deposited (Challan)</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">₹{totalPaid.toLocaleString()}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">Liability</span>
                    </div>
                    <div className="text-slate-500 text-sm font-medium">Total Deducted</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">₹{totalDeducted.toLocaleString()}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users size={24} /></div>
                    </div>
                    <div className="text-slate-500 text-sm font-medium">Deduction Entries</div>
                    <div className="text-2xl font-bold text-slate-800 mt-1">{myDeductions.length}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TDS by Section Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">TDS Breakdown by Section</h3>
                    <div className="h-64">
                        {sectionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sectionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sectionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data to display</div>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-600">
                        {sectionData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}: ₹{entry.value.toLocaleString()}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Alerts & News */}
                <div className="space-y-6">
                    {/* Compliance Status */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Compliance Status</h3>

                        <div className="flex-1 space-y-4">
                            <div className={`p-4 rounded-lg border ${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="font-semibold mb-1 text-slate-800">Balance Check</div>
                                <div className="text-sm text-slate-600 flex justify-between">
                                    <span>Available Credit:</span>
                                    <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {balance >= 0 ? 'Surplus' : 'Deficit'} ₹{Math.abs(balance).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="text-sm font-semibold text-slate-700 mb-2">Next Due Date</div>
                                <div className="text-2xl font-bold text-brand-600">7th Next Month</div>
                                <div className="text-xs text-slate-500 mt-1">For payment of TDS deducted this month.</div>
                            </div>
                        </div>

                        <button className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition">
                            View Detailed Reports <ArrowRight size={16} />
                        </button>
                    </div>

                    {/* Latest News Widget */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Newspaper size={20} /> Latest News</h3>
                            <button onClick={onViewAllNews} className="text-xs text-brand-600 font-bold hover:underline">VIEW ALL</button>
                        </div>
                        <div className="space-y-3">
                            {latestNews.length === 0 ? (
                                <div className="text-sm text-slate-400 text-center py-4">No updates available.</div>
                            ) : (
                                latestNews.map(n => (
                                    <div key={n.id} className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <div className="font-semibold text-sm text-slate-700 truncate">{n.title}</div>
                                            <div className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{n.date ? new Date(n.date).toLocaleDateString('en-GB') : '-'}</div>
                                        </div>
                                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.content}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
