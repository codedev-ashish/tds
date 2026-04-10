
import React, { useState } from 'react';
import { useTds } from '../store';
import { Dashboard } from './Dashboard';
import { DeductorManager, DeducteeManager } from './Masters';
import { RegularReturn, DraftReturnsList, SavedReturnsList, CorrectionReturnWizard } from './Transactions';
import { PortalBridge } from './PortalBridge';
import { AiAssistant } from './AiAssistant';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { Backup } from './Backup';
import { LayoutDashboard, Building2, Users, FilePlus, PenTool, Clock, CheckCircle, BarChart3, Database, Settings as SettingsIcon, Menu, ChevronDown, LogOut, LifeBuoy, Bug, MessageSquare, Newspaper, Send, ArrowLeft, Ticket, Search, Filter, Globe } from 'lucide-react';
import { TdsReturn, SupportTicket } from '../types';

enum Tab {
    Dashboard = 'Dashboard',
    Deductors = 'Businesses',
    Deductees = 'Deductees',
    RegularReturn = 'New Return',
    Correction = 'Correction Return',
    Drafts = 'Draft Returns',
    Saved = 'Saved Returns',
    Portal = 'IT Portal Bridge',
    Reports = 'Reports',
    Backup = 'Backup & Utilities',
    Settings = 'Settings',
    Support = 'Support & Bug Report',
    News = 'News Center'
}

export const PractitionerApp: React.FC<{ onLogout: () => void, user: any }> = ({ onLogout, user }) => {
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { deductors, activeDeductorId, setActiveDeductor, setReturnContext, addSupportTicket, news, supportTickets } = useTds();

    const [supportForm, setSupportForm] = useState<Partial<SupportTicket>>({ type: 'help' });
    const [ticketSubmitted, setTicketSubmitted] = useState(false);

    // News State
    const [newsSearch, setNewsSearch] = useState('');
    const [newsFilter, setNewsFilter] = useState('all');

    const activeDeductor = deductors.find(d => d.id === activeDeductorId);
    const myTickets = supportTickets.filter(t => t.userId === user.id);

    const handleResumeReturn = (r: TdsReturn) => {
        setReturnContext({
            id: r.id,
            deductorId: r.deductorId,
            financialYear: r.financialYear,
            quarter: r.quarter as any,
            formNo: r.formNo as any,
            formType: r.formType as any,
            type: r.type || 'Regular',
            previousTokenNumber: r.previousTokenNumber
        });
        setActiveDeductor(r.deductorId);
        setActiveTab(Tab.RegularReturn);
    };

    const handleStartCorrection = (token: string, r: TdsReturn) => {
        // Clone and switch to correction mode
        setReturnContext({
            id: r.id,
            deductorId: r.deductorId,
            financialYear: r.financialYear,
            quarter: r.quarter as any,
            formNo: r.formNo as any,
            formType: r.formType as any,
            type: 'Correction',
            previousTokenNumber: token
        });
        setActiveDeductor(r.deductorId);
        setActiveTab(Tab.RegularReturn); // Reuses the editor
    };

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        const ticket: SupportTicket = {
            id: crypto.randomUUID(),
            userId: user.id,
            subject: supportForm.subject || 'No Subject',
            description: supportForm.description || '',
            type: supportForm.type as any || 'help',
            status: 'open',
            date: new Date().toISOString()
        };
        addSupportTicket(ticket);
        setTicketSubmitted(true);
        setSupportForm({ type: 'help', subject: '', description: '' });
        setTimeout(() => setTicketSubmitted(false), 3000);
    };

    const filteredNews = news.filter(n =>
        (newsFilter === 'all' || n.type === newsFilter) &&
        (n.title.toLowerCase().includes(newsSearch.toLowerCase()) || n.content.toLowerCase().includes(newsSearch.toLowerCase()))
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">T</div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-800 tracking-tight leading-none">TDS Pro</span>
                        <span className="text-[10px] text-slate-500 font-medium">Practitioner Ed.</span>
                    </div>
                </div>

                <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)] flex flex-col">
                    {/* Main */}
                    <div>
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</p>
                        <div className="space-y-1">
                            <button onClick={() => { setActiveTab(Tab.Dashboard); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Dashboard ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <LayoutDashboard size={18} /> Dashboard
                            </button>
                            <button onClick={() => { setActiveTab(Tab.News); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.News ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Newspaper size={18} /> News Center
                            </button>
                        </div>
                    </div>

                    {/* Masters */}
                    <div>
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Masters</p>
                        <div className="space-y-1">
                            <button onClick={() => { setActiveTab(Tab.Deductors); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Deductors ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Building2 size={18} /> Businesses
                            </button>
                            <button onClick={() => { setActiveTab(Tab.Deductees); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Deductees ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Users size={18} /> Deductees
                            </button>
                        </div>
                    </div>

                    {/* Returns */}
                    <div>
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Returns</p>
                        <div className="space-y-1">
                            <button onClick={() => { setActiveTab(Tab.RegularReturn); setSidebarOpen(false); setReturnContext(null); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.RegularReturn ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <FilePlus size={18} /> New Return
                            </button>
                            <button onClick={() => { setActiveTab(Tab.Correction); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Correction ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <PenTool size={18} /> Correction Return
                            </button>
                            <button onClick={() => { setActiveTab(Tab.Drafts); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Drafts ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Clock size={18} /> Draft Returns
                            </button>
                            <button onClick={() => { setActiveTab(Tab.Saved); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Saved ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <CheckCircle size={18} /> Saved Returns
                            </button>
                            <button onClick={() => { setActiveTab(Tab.Portal); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Portal ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Globe size={18} /> IT Portal Bridge
                            </button>
                        </div>
                    </div>

                    {/* Utilities */}
                    <div>
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Utilities</p>
                        <div className="space-y-1">
                            <button onClick={() => { setActiveTab(Tab.Reports); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Reports ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <BarChart3 size={18} /> Reports
                            </button>
                            <button onClick={() => { setActiveTab(Tab.Backup); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.Backup ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Database size={18} /> Backup
                            </button>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-auto pt-6 border-t border-slate-100">
                        <button onClick={() => { setActiveTab(Tab.Support); setSidebarOpen(false); }} className={`w-full flex items-center justify-start gap-3 px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors ${activeTab === Tab.Support ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <LifeBuoy size={18} className="shrink-0" />
                            <span className="truncate">Support & Bug Report</span>
                        </button>
                        <button onClick={() => { setActiveTab(Tab.Settings); setSidebarOpen(false); }} className={`w-full flex items-center justify-start gap-3 px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors ${activeTab === Tab.Settings ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'} mt-1`}>
                            <SettingsIcon size={18} className="shrink-0" />
                            <span>Settings</span>
                        </button>
                        <button onClick={onLogout} className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors text-red-600 hover:bg-red-50 mt-1">
                            <LogOut size={18} className="shrink-0" />
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700"><Menu size={24} /></button>
                        <div className="hidden md:block text-slate-400 text-sm font-medium">/ {activeTab}</div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-bold text-slate-800">{user.name}</div>
                            <div className="text-xs text-slate-500 uppercase">{user.plan} Plan</div>
                        </div>
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition">
                                <Building2 size={16} className="text-slate-500" />
                                <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate">{activeDeductor ? activeDeductor.name : 'Select Business'}</span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-100 py-1 hidden group-hover:block z-50">
                                {deductors.length > 0 ? deductors.map(d => (
                                    <button key={d.id} onClick={() => setActiveDeductor(d.id)} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${activeDeductorId === d.id ? 'text-brand-600 font-medium' : 'text-slate-600'}`}>
                                        {d.name}
                                    </button>
                                )) : <div className="px-4 py-3 text-xs text-slate-400 text-center">No businesses added</div>}
                                <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button onClick={() => setActiveTab(Tab.Deductors)} className="w-full text-left px-4 py-2 text-xs text-brand-600 hover:text-brand-700 font-medium">+ Add New Business</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Page Area */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === Tab.Dashboard && <Dashboard onViewAllNews={() => setActiveTab(Tab.News)} />}
                        {activeTab === Tab.Deductors && <DeductorManager />}
                        {activeTab === Tab.Deductees && <DeducteeManager />}
                        {activeTab === Tab.RegularReturn && <RegularReturn />}
                        {activeTab === Tab.Correction && <CorrectionReturnWizard onProceed={handleStartCorrection} />}
                        {activeTab === Tab.Drafts && <DraftReturnsList onResume={handleResumeReturn} />}
                        {activeTab === Tab.Saved && <SavedReturnsList onView={handleResumeReturn} />}
                        {activeTab === Tab.Portal && <PortalBridge />}
                        {activeTab === Tab.Reports && <Reports />}
                        {activeTab === Tab.Backup && <Backup />}
                        {activeTab === Tab.Settings && <Settings />}

                        {activeTab === Tab.News && (
                            <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
                                <button onClick={() => setActiveTab(Tab.Dashboard)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-2">
                                    <ArrowLeft size={16} /> Back to Dashboard
                                </button>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-slate-800">News Center & Updates</h2>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search news..."
                                                value={newsSearch}
                                                onChange={(e) => setNewsSearch(e.target.value)}
                                                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm w-48"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <select
                                                value={newsFilter}
                                                onChange={(e) => setNewsFilter(e.target.value)}
                                                className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm appearance-none"
                                            >
                                                <option value="all">All Types</option>
                                                <option value="general">General</option>
                                                <option value="update">Updates</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                </div>

                                {filteredNews.length === 0 ? (
                                    <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400">
                                        <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No news items match your criteria.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredNews.map(n => (
                                            <div key={n.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition hover:shadow-md">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-bold text-slate-800">{n.title}</h3>
                                                    <span className="text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded">{n.date}</span>
                                                </div>
                                                <div className="flex gap-2 mb-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${n.type === 'maintenance' ? 'bg-red-100 text-red-700' : n.type === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {n.type}
                                                    </span>
                                                    {n.priority === 'high' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">Important</span>}
                                                </div>
                                                <p className="text-slate-600 leading-relaxed text-sm">{n.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === Tab.Support && (
                            <div className="max-w-4xl mx-auto animate-in fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Support & Bug Report</h2>
                                        <p className="text-slate-500 mb-8">Found an issue or need help? Submit a ticket below.</p>

                                        {ticketSubmitted ? (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in zoom-in-95">
                                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <h3 className="text-xl font-bold text-green-800 mb-2">Ticket Submitted Successfully</h3>
                                                <p className="text-green-700">Our support team will review your request and get back to you shortly.</p>
                                                <button onClick={() => setTicketSubmitted(false)} className="mt-6 text-green-700 font-semibold hover:underline">Submit another ticket</button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmitTicket} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSupportForm({ ...supportForm, type: 'bug' })}
                                                            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition ${supportForm.type === 'bug' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            <Bug size={24} /> <span className="text-sm font-semibold">Report Bug</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSupportForm({ ...supportForm, type: 'help' })}
                                                            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition ${supportForm.type === 'help' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            <LifeBuoy size={24} /> <span className="text-sm font-semibold">Get Help</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSupportForm({ ...supportForm, type: 'other' })}
                                                            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition ${supportForm.type === 'other' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            <MessageSquare size={24} /> <span className="text-sm font-semibold">Other</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                                    <input
                                                        required
                                                        value={supportForm.subject || ''}
                                                        onChange={e => setSupportForm({ ...supportForm, subject: e.target.value })}
                                                        className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                                        placeholder="Brief summary of the issue..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                                    <textarea
                                                        required
                                                        rows={5}
                                                        value={supportForm.description || ''}
                                                        onChange={e => setSupportForm({ ...supportForm, description: e.target.value })}
                                                        className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                                        placeholder="Please provide details about what happened, steps to reproduce, or your question..."
                                                    />
                                                </div>

                                                <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition flex items-center justify-center gap-2">
                                                    <Send size={18} /> Submit Ticket
                                                </button>
                                            </form>
                                        )}
                                    </div>

                                    {/* Ticket History */}
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Ticket size={24} /> My Ticket History</h2>
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            {myTickets.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400">
                                                    <p>You haven't submitted any tickets yet.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    {myTickets.map(t => (
                                                        <div key={t.id} className="p-4 hover:bg-slate-50 transition">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <div className="font-semibold text-slate-800 text-sm mb-1">{t.subject}</div>
                                                                    <div className="text-xs text-slate-500 flex gap-2">
                                                                        <span>{new Date(t.date).toLocaleDateString()}</span>
                                                                        <span className="capitalize bg-slate-100 px-1 rounded">{t.type}</span>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : t.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {t.status.replace('-', ' ')}
                                                                </span>
                                                            </div>
                                                            {t.resolution && (
                                                                <div className="mt-2 bg-green-50 border border-green-100 p-2 rounded text-xs text-green-800">
                                                                    <span className="font-bold mr-1">Resolution:</span> {t.resolution}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* AI Assistant Floating Widget */}
            <AiAssistant />
        </div>
    );
};
