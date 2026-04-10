
import React, { useState, useEffect } from 'react';
import { User, Lock, Monitor, Trash2, Save, RefreshCw, CheckCircle, AlertCircle, Shield, Smartphone, Mail, Moon, Sun, Layout, ExternalLink } from 'lucide-react';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'system'>('profile');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Profile State
    const [profile, setProfile] = useState({
        name: 'Ashish',
        email: 'ashish@example.com',
        mobile: '9876543210',
        designation: 'Tax Consultant'
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Appearance State
    const [appearance, setAppearance] = useState({
        theme: 'light',
        density: 'comfortable',
        fontSize: 'medium'
    });

    // Load profile from local storage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) setProfile(JSON.parse(savedProfile));

        const savedAppearance = localStorage.getItem('user_appearance');
        if (savedAppearance) setAppearance(JSON.parse(savedAppearance));
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('user_profile', JSON.stringify(profile));
        showNotification('success', 'Profile details updated successfully.');
    };

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showNotification('error', 'New passwords do not match.');
            return;
        }
        if (passwords.new.length < 6) {
            showNotification('error', 'Password must be at least 6 characters.');
            return;
        }
        // Simulate API call
        setTimeout(() => {
            setPasswords({ current: '', new: '', confirm: '' });
            showNotification('success', 'Password changed successfully.');
        }, 800);
    };

    const handleSaveAppearance = () => {
        localStorage.setItem('user_appearance', JSON.stringify(appearance));
        window.dispatchEvent(new Event('theme-change'));
        showNotification('success', 'Appearance settings saved.');
    };

    const handleClearCache = () => {
        if (confirm("CRITICAL WARNING: This will delete ALL data including Deductors, Challans, Deductees, and Returns. This action cannot be undone. Are you sure?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'security', label: 'Security & Password', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Monitor },
        { id: 'system', label: 'System & Data', icon: RefreshCw },
    ];

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                <p className="text-slate-500 text-sm">Manage your account preferences and application data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    {/* Notification Toast */}
                    {notification && (
                        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {notification.message}
                        </div>
                    )}

                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Personal Information</h3>
                            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={profile.name}
                                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={profile.designation}
                                                onChange={e => setProfile({ ...profile, designation: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={profile.email}
                                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="tel"
                                                required
                                                value={profile.mobile}
                                                onChange={e => setProfile({ ...profile, mobile: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 font-medium transition flex items-center gap-2">
                                        <Save size={18} /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Change Password</h3>
                            <form onSubmit={handleSavePassword} className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={passwords.current}
                                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={passwords.new}
                                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={passwords.confirm}
                                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 font-medium transition flex items-center gap-2">
                                        <Save size={18} /> Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Appearance Settings */}
                    {activeTab === 'appearance' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Interface Preferences</h3>

                            <div className="space-y-8 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                                            className={`p-4 border rounded-xl flex items-center gap-3 transition ${appearance.theme === 'light' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="p-2 bg-white rounded-full shadow-sm"><Sun size={20} className="text-amber-500" /></div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">Light Mode</div>
                                                <div className="text-xs text-slate-500">Default bright interface</div>
                                            </div>
                                            {appearance.theme === 'light' && <CheckCircle size={18} className="ml-auto text-brand-600" />}
                                        </button>

                                        <button
                                            onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                                            className={`p-4 border rounded-xl flex items-center gap-3 transition ${appearance.theme === 'dark' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="p-2 bg-slate-800 rounded-full shadow-sm"><Moon size={20} className="text-white" /></div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">Dark Mode</div>
                                                <div className="text-xs text-slate-500">Low light interface</div>
                                            </div>
                                            {appearance.theme === 'dark' && <CheckCircle size={18} className="ml-auto text-brand-600" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Density</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                            <input
                                                type="radio"
                                                name="density"
                                                checked={appearance.density === 'comfortable'}
                                                onChange={() => setAppearance({ ...appearance, density: 'comfortable' })}
                                                className="text-brand-600 focus:ring-brand-500"
                                            />
                                            <Layout size={20} className="text-slate-500" />
                                            <div>
                                                <div className="font-medium text-slate-800">Comfortable</div>
                                                <div className="text-xs text-slate-500">Standard spacing and font sizes</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                            <input
                                                type="radio"
                                                name="density"
                                                checked={appearance.density === 'compact'}
                                                onChange={() => setAppearance({ ...appearance, density: 'compact' })}
                                                className="text-brand-600 focus:ring-brand-500"
                                            />
                                            <Layout size={20} className="text-slate-500 scale-75" />
                                            <div>
                                                <div className="font-medium text-slate-800">Compact</div>
                                                <div className="text-xs text-slate-500">More data on screen, smaller text</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button onClick={handleSaveAppearance} className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 font-medium transition flex items-center gap-2">
                                        <Save size={18} /> Save Preferences
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Settings */}
                    {activeTab === 'system' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">System Data & Maintenance</h3>

                            <div className="space-y-6">
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                    <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                        <AlertCircle size={20} /> Reset Application
                                    </h4>
                                    <p className="text-sm text-red-700 mb-4">
                                        This action will completely wipe all local data stored in your browser for TDS Pro.
                                        This includes all Deductors, Deductees, Challans, and Returns.
                                        <br /><br />
                                        <strong>This action cannot be undone.</strong>
                                    </p>
                                    <button
                                        onClick={handleClearCache}
                                        className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 font-bold transition flex items-center gap-2 shadow-sm"
                                    >
                                        <Trash2 size={18} /> Clear Data & Reset
                                    </button>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                                    <h4 className="font-bold text-blue-800 mb-2">About Application</h4>
                                    <div className="space-y-1 text-sm text-blue-900">
                                        <div className="flex justify-between border-b border-blue-200 pb-1 mb-1">
                                            <span>Version</span>
                                            <span className="font-mono">v1.2.5</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200 pb-1 mb-1">
                                            <span>TDS Rates</span>
                                            <span className="font-mono">FY 2025-26</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-200 pb-1 mb-1">
                                            <span>FVU Version</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">9.3</span>
                                                <button
                                                    onClick={() => {
                                                        fetch('http://localhost:3000/api/fvu/launch', { method: 'POST' })
                                                            .then(res => {
                                                                if (res.ok) showNotification('success', 'FVU Utility Launched');
                                                                else showNotification('error', 'Failed to launch utility');
                                                            })
                                                            .catch(() => showNotification('error', 'Network error launching utility'));
                                                    }}
                                                    className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded hover:bg-brand-100 flex items-center gap-1 transition"
                                                    title="Launch Official Utility"
                                                >
                                                    <ExternalLink size={12} /> Launch
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Build Date</span>
                                            <span className="font-mono">{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
