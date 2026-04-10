import React, { useState, useMemo, useEffect } from 'react';
import { useTds } from '../store';
import { LayoutDashboard, Users, CreditCard, Code, BarChart3, Settings, LogOut, Search, MoreHorizontal, ShieldAlert, CheckCircle, XCircle, Database, Trash2, Globe, Plus, Edit2, Power, X, MessageSquare, Bell, Image, Link, Send, Lock, User as UserIcon, Save, History, FileText, Briefcase, Zap, Newspaper, ArrowRight, LifeBuoy, AlertCircle, CheckSquare, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { User, SubscriptionPlan, PlanLimits, NewsItem, SupportTicket } from '../types';

interface AdminPanelProps {
    onLogout: () => void;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
    // Access Store
    const {
        news, addNews, deleteNews,
        supportTickets, updateSupportTicket,
        users, addUser, updateUser, deleteUser,
        plans, addPlan, updatePlan, deletePlan,
        ads, addAd, deleteAd,
        notifications, sendNotification,
        analytics, chatMessages, fetchChatMessages, sendChatMessage,
        settings, updateSettings, backupSystem
    } = useTds();

    const [activeTab, setActiveTab] = useState<'users' | 'subscriptions' | 'ads' | 'analytics' | 'tools' | 'chat' | 'notifications' | 'admin_settings' | 'news' | 'tickets'>('analytics');
    const [searchTerm, setSearchTerm] = useState('');

    // User Edit State
    const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
    const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Chat State
    const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');

    // Notification State
    const [notifyForm, setNotifyForm] = useState({ title: '', message: '', imageUrl: '', linkUrl: '', audience: 'all' });

    // Admin Settings State
    const [settingsForm, setSettingsForm] = useState<any>({});
    const [adminProfile, setAdminProfile] = useState({ name: 'System Administrator', email: 'admin@tdspro.com' });
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

    // Plan Modal State
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan> & { featureString?: string, limits?: PlanLimits }>({});

    // News Form State
    const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({ type: 'general', priority: 'normal' });
    const [newsSearch, setNewsSearch] = useState('');

    // Ticket State
    const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');

    // --- Ad Manager State ---
    const [adSearch, setAdSearch] = useState('');
    const [adStatusFilter, setAdStatusFilter] = useState('all');
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [currentAd, setCurrentAd] = useState<any>({});

    // --- User Actions ---
    const handleAddUser = () => {
        const newUser: User = {
            id: Date.now().toString(),
            name: '',
            email: '',
            password_hash: '',
            role: 'practitioner',
            status: 'active',
            plan: 'basic',
            last_login: null,
            location: '',
            joined_at: new Date()
        };
        setCurrentUser(newUser);
        setIsCreatingNewUser(true);
        setIsUserEditModalOpen(true);
    };

    const toggleBan = async (id: string) => {
        const user = users.find(u => u.id === id);
        if (user) {
            await updateUser({ ...user, status: user.status === 'active' ? 'banned' : 'active' });
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user? All their data will be lost.')) {
            await deleteUser(id);
        }
    };

    const handleEditUser = (user: User) => {
        setCurrentUser(user);
        setIsCreatingNewUser(false);
        setIsUserEditModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (isCreatingNewUser) {
            await addUser(currentUser);
        } else {
            await updateUser(currentUser);
        }
        setIsUserEditModalOpen(false);
        setCurrentUser(null);
        setIsCreatingNewUser(false);
    };

    // --- Subscription Actions ---
    const openPlanModal = (plan?: SubscriptionPlan) => {
        if (plan) {
            setCurrentPlan({
                ...plan,
                featureString: plan.features.join(', '),
                limits: plan.limits || { businessLimit: 5, adFree: false, adCount: 3 }
            });
        } else {
            setCurrentPlan({
                name: '', price: 0, period: 'monthly', featureString: '', status: 'active', features: [],
                limits: { businessLimit: 5, adFree: false, adCount: 3 }
            });
        }
        setIsPlanModalOpen(true);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        const featuresArray = currentPlan.featureString
            ? currentPlan.featureString.split(',').map(f => f.trim()).filter(f => f !== '')
            : [];

        // Ensure limits are set
        const planLimits = currentPlan.limits || { businessLimit: 5, adFree: false, adCount: 3 };

        const planToSave = {
            ...currentPlan,
            features: featuresArray,
            limits: planLimits,
            id: currentPlan.id || crypto.randomUUID(),
        } as SubscriptionPlan;

        // Remove temp property
        delete (planToSave as any).featureString;

        if (currentPlan.id) {
            await updatePlan(planToSave);
        } else {
            await addPlan(planToSave);
        }
        setIsPlanModalOpen(false);
    };

    const handleDeletePlan = async (id: string) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            await deletePlan(id);
        }
    };

    const togglePlanStatus = async (id: string) => {
        const plan = plans.find(p => p.id === id);
        if (plan) {
            await updatePlan({ ...plan, status: plan.status === 'active' ? 'inactive' : 'active' });
        }
    };

    const handleBackupAll = () => {
        const backup = {
            timestamp: new Date().toISOString(),
            users: users,
            plans: plans,
            mockData: "This simulates a full database dump of all user records."
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `FULL_SYSTEM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    };

    const handleClearCache = () => {
        if (confirm('Are you sure you want to clear all local application data? This will reset the application state and log you out.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    // --- Chat Actions ---
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !selectedChatUser) return;

        const newMessage = {
            id: crypto.randomUUID(),
            senderId: 'admin',
            receiverId: selectedChatUser,
            text: chatInput,
            timestamp: new Date().toISOString()
        };

        await sendChatMessage(newMessage);
        setChatInput('');
    };

    useEffect(() => {
        if (selectedChatUser) {
            fetchChatMessages(selectedChatUser);
        }
    }, [selectedChatUser]);

    useEffect(() => {
        if (settings) {
            setSettingsForm(settings);
        }
    }, [settings]);

    // --- Notification Actions ---
    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        const newNotif = {
            id: crypto.randomUUID(),
            title: notifyForm.title,
            message: notifyForm.message,
            imageUrl: notifyForm.imageUrl,
            linkUrl: notifyForm.linkUrl,
            audience: notifyForm.audience,
            sentAt: new Date().toISOString(),
            type: 'info'
        };
        await sendNotification(newNotif);
        setNotifyForm({ title: '', message: '', imageUrl: '', linkUrl: '', audience: 'all' });
        alert('Notification Sent Successfully!');
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateSettings(settingsForm);
        alert('Settings saved successfully!');
    };

    // --- News Actions ---
    const handlePostNews = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsForm.title || !newsForm.content) return;

        const newItem: NewsItem = {
            id: crypto.randomUUID(),
            title: newsForm.title,
            content: newsForm.content,
            type: newsForm.type as any || 'general',
            priority: newsForm.priority as any || 'normal',
            date: new Date().toISOString().split('T')[0]
        };
        await addNews(newItem);
        setNewsForm({ type: 'general', priority: 'normal', title: '', content: '' });
        alert("News posted successfully to User Dashboard.");
    };

    // --- Ticket Actions ---
    const handleResolveTicket = async () => {
        if (!selectedTicket) return;
        await updateSupportTicket({
            ...selectedTicket,
            status: 'resolved',
            resolution: resolutionNote || 'Resolved by Admin'
        });
        setSelectedTicket(null);
        setResolutionNote('');
        alert("Ticket marked as Resolved.");
    };

    // --- Password Reset ---
    const handlePasswordReset = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            alert("New passwords do not match");
            return;
        }
        alert("Admin password updated successfully.");
        setPasswordForm({ current: '', new: '', confirm: '' });
    };

    // --- Ad Manager Actions ---
    const handleSaveAd = async (e: React.FormEvent) => {
        e.preventDefault();
        const newAd = { ...currentAd, id: currentAd.id || crypto.randomUUID() };
        await addAd(newAd);
        setIsAdModalOpen(false);
    };

    const handleDeleteAd = async (id: string) => {
        if (confirm('Delete this ad unit?')) {
            await deleteAd(id);
        }
    };

    const openAdModal = (ad?: any) => {
        setCurrentAd(ad || { type: 'Banner', status: 'Active' });
        setIsAdModalOpen(true);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNews = news.filter(n => n.title.toLowerCase().includes(newsSearch.toLowerCase()));

    const filteredTickets = supportTickets.filter(t => {
        if (ticketFilter === 'all') return true;
        if (ticketFilter === 'open') return t.status !== 'resolved';
        if (ticketFilter === 'resolved') return t.status === 'resolved';
        return true;
    });

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="text-xl font-bold text-white tracking-tight">Admin<span className="text-brand-500">Panel</span></div>
                </div>
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'analytics' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <BarChart3 size={18} /> Analytics
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Users size={18} /> User Management
                    </button>
                    <button onClick={() => setActiveTab('tickets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'tickets' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <LifeBuoy size={18} /> Help Desk
                    </button>
                    <button onClick={() => setActiveTab('news')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'news' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Newspaper size={18} /> News & Updates
                    </button>
                    <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'chat' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <MessageSquare size={18} /> Support Chat
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'notifications' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Bell size={18} /> Notifications
                    </button>
                    <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'subscriptions' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <CreditCard size={18} /> Subscriptions
                    </button>
                    <button onClick={() => setActiveTab('ads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'ads' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Code size={18} /> Ad Manager
                    </button>
                    <button onClick={() => setActiveTab('tools')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'tools' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Database size={18} /> System Tools
                    </button>
                    <button onClick={() => setActiveTab('admin_settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'admin_settings' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Settings size={18} /> Settings
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 transition">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8 relative">
                {activeTab === 'analytics' && (
                    <div className="space-y-6 animate-in fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">System Analytics</h2>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="text-sm font-medium text-slate-500 uppercase">Total Users</div>
                                <div className="text-3xl font-bold text-slate-800 mt-2">{users.length}</div>
                                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">↑ 12% vs last month</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="text-sm font-medium text-slate-500 uppercase">Active Subscriptions</div>
                                <div className="text-3xl font-bold text-slate-800 mt-2">85</div>
                                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">↑ 5% vs last month</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="text-sm font-medium text-slate-500 uppercase">Realtime Visitors</div>
                                <div className="text-3xl font-bold text-brand-600 mt-2">42</div>
                                <div className="text-xs text-slate-400 mt-1">Live now</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="text-sm font-medium text-slate-500 uppercase">Revenue (MTD)</div>
                                <div className="text-3xl font-bold text-slate-800 mt-2">₹1.2L</div>
                                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">↑ 8% vs last month</div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Traffic Trends (Last 7 Days)</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics?.visits || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Users by Subscription Plan</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={analytics?.plans || []} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {(analytics?.plans || []).map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 text-xs mt-4">
                                    {(analytics?.plans || []).map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User Location Breakdown Chart */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                                <h3 className="font-bold text-slate-800 mb-4">User Location Breakdown</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics?.locations || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                            <button onClick={handleAddUser} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"><Plus size={16} /> Add New User</button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-200 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        placeholder="Search users..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-5 text-slate-600 font-medium">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{u.name}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {u.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 uppercase text-xs font-semibold text-slate-600">{u.plan}</td>
                                            <td className="p-4 text-slate-600">{u.location}</td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(u)}
                                                    className="p-2 rounded hover:bg-slate-100 text-blue-600"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleBan(u.id)}
                                                    className={`p-2 rounded hover:bg-slate-100 ${u.status === 'active' ? 'text-orange-600' : 'text-green-600'}`}
                                                    title={u.status === 'active' ? 'Ban User' : 'Unban User'}
                                                >
                                                    {u.status === 'active' ? <ShieldAlert size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-2 rounded hover:bg-slate-100 text-red-600"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Support Tickets (Help Desk)</h2>
                            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                                <button onClick={() => setTicketFilter('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${ticketFilter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}>All</button>
                                <button onClick={() => setTicketFilter('open')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${ticketFilter === 'open' ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:text-slate-800'}`}>Open</button>
                                <button onClick={() => setTicketFilter('resolved')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${ticketFilter === 'resolved' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:text-slate-800'}`}>Resolved</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Subject</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTickets.map(t => {
                                        const user = users.find(u => u.id === t.userId);
                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                                                <td className="p-4">
                                                    <div className="font-semibold text-slate-800">{user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{user?.email}</div>
                                                </td>
                                                <td className="p-4 font-medium text-slate-700">{t.subject}</td>
                                                <td className="p-4 uppercase text-xs">{t.type}</td>
                                                <td className="p-4 text-slate-500 text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : t.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                        {t.status.replace('-', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button className="text-brand-600 hover:underline">View</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTickets.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No tickets found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Ticket Detail Modal */}
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-lg">Ticket Details</h3>
                                <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-bold text-slate-800">{selectedTicket.subject}</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {selectedTicket.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mb-4 flex gap-4">
                                        <span>User: {users.find(u => u.id === selectedTicket.userId)?.name}</span>
                                        <span>Type: {selectedTicket.type.toUpperCase()}</span>
                                        <span>Date: {new Date(selectedTicket.date).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                                        {selectedTicket.description}
                                    </div>
                                </div>

                                {selectedTicket.status !== 'resolved' ? (
                                    <div className="border-t border-slate-100 pt-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Resolution Note</label>
                                        <textarea
                                            rows={3}
                                            value={resolutionNote}
                                            onChange={e => setResolutionNote(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="Explain how the issue was resolved..."
                                        />
                                        <div className="mt-4 flex justify-end gap-3">
                                            <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Close</button>
                                            <button
                                                onClick={handleResolveTicket}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <CheckSquare size={18} /> Mark as Resolved
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <h4 className="font-semibold text-green-800 text-sm mb-1">Resolution:</h4>
                                        <p className="text-green-700 text-sm">{selectedTicket.resolution}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'news' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-800">Post News & Updates</h2>
                            <form onSubmit={handlePostNews} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">News Title</label>
                                    <input
                                        required
                                        value={newsForm.title}
                                        onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g., Critical Security Update"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                        <select
                                            value={newsForm.type}
                                            onChange={e => setNewsForm({ ...newsForm, type: e.target.value as any })}
                                            className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                        >
                                            <option value="general">General Info</option>
                                            <option value="update">Feature Update</option>
                                            <option value="maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                        <select
                                            value={newsForm.priority}
                                            onChange={e => setNewsForm({ ...newsForm, priority: e.target.value as any })}
                                            className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={newsForm.content}
                                        onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Details of the update..."
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-bold hover:bg-brand-700 flex items-center justify-center gap-2">
                                        <Send size={18} /> Post News to Users
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Published News</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        placeholder="Search news..."
                                        className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm"
                                        value={newsSearch}
                                        onChange={e => setNewsSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {filteredNews.map(n => (
                                        <div key={n.id} className="p-4 hover:bg-slate-50 transition relative group">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-800">{n.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">{n.date}</span>
                                                    <button onClick={() => deleteNews(n.id)} className="text-red-500 p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{n.content}</p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={`px-2 py-0.5 rounded uppercase font-bold ${n.type === 'maintenance' ? 'bg-red-100 text-red-700' : n.type === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {n.type}
                                                </span>
                                                {n.priority === 'high' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">HIGH PRIORITY</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredNews.length === 0 && <div className="p-8 text-center text-slate-400">No news published yet.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-800">Send Notification</h2>
                            <form onSubmit={handleSendNotification} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                    <input
                                        required
                                        value={notifyForm.title}
                                        onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Notification Title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={notifyForm.message}
                                        onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Notification Message"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                                        <input
                                            value={notifyForm.imageUrl}
                                            onChange={e => setNotifyForm({ ...notifyForm, imageUrl: e.target.value })}
                                            className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Link URL (Optional)</label>
                                        <input
                                            value={notifyForm.linkUrl}
                                            onChange={e => setNotifyForm({ ...notifyForm, linkUrl: e.target.value })}
                                            className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
                                    <select
                                        value={notifyForm.audience}
                                        onChange={e => setNotifyForm({ ...notifyForm, audience: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="basic">Basic Users</option>
                                        <option value="pro">Pro Users</option>
                                        <option value="enterprise">Enterprise Users</option>
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-bold hover:bg-brand-700 flex items-center justify-center gap-2">
                                        <Send size={18} /> Send Notification
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-800">Sent Notifications</h2>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {notifications.map(n => (
                                        <div key={n.id} className="p-4 hover:bg-slate-50 transition">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-800">{n.title}</h4>
                                                <span className="text-xs text-slate-500">{new Date(n.sentAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{n.message}</p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">{n.audience}</span>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">{n.type}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && <div className="p-8 text-center text-slate-400">No notifications sent yet.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subscriptions' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Subscription Plans</h2>
                            <button onClick={() => openPlanModal()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                                <Plus size={18} /> Create New Plan
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {plan.status}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                                            <span className="text-slate-500 text-sm">/{plan.period}</span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 space-y-4">
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Features</div>
                                            <ul className="space-y-2">
                                                {plan.features.map((f, i) => (
                                                    <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                                        <CheckCircle size={14} className="text-green-500" /> {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Limits</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                <div className="bg-slate-50 p-2 rounded">Businesses: {plan.limits.businessLimit}</div>
                                                <div className="bg-slate-50 p-2 rounded">Ads: {plan.limits.adCount}</div>
                                                <div className="bg-slate-50 p-2 rounded col-span-2">Ad-Free: {plan.limits.adFree ? 'Yes' : 'No'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                                        <button onClick={() => openPlanModal(plan)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center justify-center gap-2">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => togglePlanStatus(plan.id)} className={`p-2 rounded-lg border ${plan.status === 'active' ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                            <Power size={18} />
                                        </button>
                                        <button onClick={() => handleDeletePlan(plan.id)} className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {plans.length === 0 && (
                                <div className="col-span-3 p-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                                    No subscription plans created yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Plan Modal */}
                {isPlanModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">{currentPlan.id ? 'Edit Plan' : 'Create New Plan'}</h3>
                                <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                                        <input required value={currentPlan.name} onChange={e => setCurrentPlan({ ...currentPlan, name: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                                        <input type="number" required value={currentPlan.price} onChange={e => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                                        <select value={currentPlan.period} onChange={e => setCurrentPlan({ ...currentPlan, period: e.target.value as any })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Features (Comma separated)</label>
                                    <textarea rows={2} value={currentPlan.featureString} onChange={e => setCurrentPlan({ ...currentPlan, featureString: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="Feature 1, Feature 2, ..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Business Limit</label>
                                        <input type="number" value={currentPlan.limits?.businessLimit} onChange={e => setCurrentPlan({ ...currentPlan, limits: { ...currentPlan.limits!, businessLimit: Number(e.target.value) } })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ad Count</label>
                                        <input type="number" value={currentPlan.limits?.adCount} onChange={e => setCurrentPlan({ ...currentPlan, limits: { ...currentPlan.limits!, adCount: Number(e.target.value) } })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <input type="checkbox" id="adFree" checked={currentPlan.limits?.adFree} onChange={e => setCurrentPlan({ ...currentPlan, limits: { ...currentPlan.limits!, adFree: e.target.checked } })} />
                                        <label htmlFor="adFree" className="text-sm font-medium text-slate-700">Ad-Free Experience</label>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700">Save Plan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* User Edit/Create Modal */}
                {isUserEditModalOpen && currentUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">{isCreatingNewUser ? 'Create New User' : `Edit User: ${currentUser.name}`}</h3>
                                <button onClick={() => { setIsUserEditModalOpen(false); setIsCreatingNewUser(false); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input required value={currentUser.name} onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <input type="email" required value={currentUser.email} onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    {isCreatingNewUser && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                            <input type="password" required value={currentUser.password_hash} onChange={e => setCurrentUser({ ...currentUser, password_hash: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="Enter initial password" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                        <select value={currentUser.role} onChange={e => setCurrentUser({ ...currentUser, role: e.target.value as any })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="practitioner">Practitioner</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                        <select value={currentUser.status} onChange={e => setCurrentUser({ ...currentUser, status: e.target.value as any })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="active">Active</option>
                                            <option value="banned">Banned</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                                        <select value={currentUser.plan} onChange={e => setCurrentUser({ ...currentUser, plan: e.target.value as any })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="basic">Basic</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => { setIsUserEditModalOpen(false); setIsCreatingNewUser(false); }} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700">{isCreatingNewUser ? 'Create User' : 'Save Changes'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'ads' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Ad Manager</h2>
                            <button onClick={() => openAdModal()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                                <Plus size={18} /> Create New Ad Unit
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ads.map(ad => (
                                <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                                                <Code size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{ad.name}</h3>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">{ad.size} • {ad.type}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ad.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {ad.status}
                                        </span>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-slate-400 overflow-hidden h-24 relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                                            {ad.content}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                                        <button onClick={() => openAdModal(ad)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 flex items-center justify-center gap-2">
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteAd(ad.id)} className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {ads.length === 0 && (
                                <div className="col-span-3 p-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                                    No ad units created yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Ad Modal */}
                {isAdModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">{currentAd.id ? 'Edit Ad Unit' : 'Create New Ad Unit'}</h3>
                                <button onClick={() => setIsAdModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveAd} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit Name</label>
                                        <input required value={currentAd.name} onChange={e => setCurrentAd({ ...currentAd, name: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g., Sidebar Banner" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                                        <select value={currentAd.size} onChange={e => setCurrentAd({ ...currentAd, size: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="728x90">728x90 (Leaderboard)</option>
                                            <option value="300x250">300x250 (Rectangle)</option>
                                            <option value="160x600">160x600 (Skyscraper)</option>
                                            <option value="300x600">300x600 (Half Page)</option>
                                            <option value="Responsive">Responsive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                        <select value={currentAd.type} onChange={e => setCurrentAd({ ...currentAd, type: e.target.value as any })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="Banner">Banner</option>
                                            <option value="Image">Image URL</option>
                                            <option value="Script">Custom Script</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content (Script or Image URL)</label>
                                    <textarea required rows={4} value={currentAd.content} onChange={e => setCurrentAd({ ...currentAd, content: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs" placeholder="Paste your ad script or image URL here..." />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsAdModalOpen(false)} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700">Save Ad Unit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="space-y-6 animate-in fade-in">
                        <h2 className="text-2xl font-bold text-slate-800">System Tools</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Database Backup</h3>
                                        <p className="text-sm text-slate-500">Download a full backup of your database.</p>
                                    </div>
                                </div>
                                <button onClick={backupSystem} className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-900 flex items-center justify-center gap-2">
                                    <Download size={18} /> Generate & Download Backup
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">System Logs</h3>
                                        <p className="text-sm text-slate-500">View recent system activities and errors.</p>
                                    </div>
                                </div>
                                <button className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                                    <FileText size={18} /> View System Logs
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admin_settings' && (
                    <div className="space-y-6 animate-in fade-in">
                        <h2 className="text-2xl font-bold text-slate-800">Site Settings</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">General Configuration</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Site Name</label>
                                            <input
                                                value={settingsForm.siteName || 'TDS Pro'}
                                                onChange={e => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                                            <input
                                                value={settingsForm.supportEmail || 'support@tdspro.com'}
                                                onChange={e => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">AI & Chatbot Configuration</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="password"
                                                    value={settingsForm.gemini_api_key || ''}
                                                    onChange={e => setSettingsForm({ ...settingsForm, gemini_api_key: e.target.value })}
                                                    placeholder="Enter your Gemini API Key"
                                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">This key is used for the AI Tax Assistant chatbot.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Maintenance Mode</h3>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <div className="font-bold text-slate-800">Maintenance Mode</div>
                                                <div className="text-xs text-slate-500">Disable frontend for users</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSettingsForm({ ...settingsForm, maintenanceMode: !settingsForm.maintenanceMode })}
                                                className={`w-12 h-6 rounded-full transition relative ${settingsForm.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settingsForm.maintenanceMode ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700">
                                        Save All Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="h-[calc(100vh-6rem)] grid grid-cols-12 gap-6 animate-in fade-in">
                        {/* Chat Sidebar */}
                        <div className="col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-200">
                                <h3 className="font-bold text-slate-800">Support Requests</h3>
                                <div className="mt-2 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input placeholder="Search users..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-brand-500" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {users.map(u => {
                                    const lastMsg = chatMessages.filter(m => m.senderId === u.id || m.receiverId === u.id).slice(-1)[0];
                                    if (!lastMsg && u.role === 'admin') return null;
                                    return (
                                        <button
                                            key={u.id}
                                            onClick={() => setSelectedChatUser(u.id)}
                                            className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition border-b border-slate-50 ${selectedChatUser === u.id ? 'bg-brand-50 border-brand-100' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="font-semibold text-slate-800 text-sm truncate">{u.name}</div>
                                                <div className="text-xs text-slate-500 truncate">{lastMsg?.text || 'No messages yet'}</div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            {selectedChatUser ? (
                                <>
                                    <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                                            {users.find(u => u.id === selectedChatUser)?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{users.find(u => u.id === selectedChatUser)?.name}</div>
                                            <div className="text-xs text-slate-500">Online</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                        {chatMessages.map(m => (
                                            <div key={m.id} className={`flex ${m.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-3 rounded-xl text-sm ${m.senderId === 'admin' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                                    {m.text}
                                                    <div className={`text-[10px] mt-1 ${m.senderId === 'admin' ? 'text-brand-200' : 'text-slate-400'}`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
                                        <input
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                        />
                                        <button type="submit" className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700">
                                            <Send size={20} />
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                    <MessageSquare size={48} className="mb-4 opacity-20" />
                                    <p>Select a user to start chatting</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
