import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, CheckCircle, Star, Shield, Zap } from 'lucide-react';
import { useTds } from '../store';

interface LandingProps { }

export const Landing: React.FC<LandingProps> = () => {
    const { login } = useTds();
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
                        <span className="text-xl font-bold text-slate-900">TDS Pro</span>
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-brand-600">Features</a>
                        <a href="#pricing" className="hover:text-brand-600">Pricing</a>
                        <a href="#testimonials" className="hover:text-brand-600">Testimonials</a>
                    </div>
                    <button
                        onClick={() => setShowLogin(true)}
                        className="bg-brand-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-700 transition"
                    >
                        Login / Register
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
                            Professional TDS Return <span className="text-brand-600">Filing Software</span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Simplify your tax practice with India's smartest cloud-based TDS software.
                            Manage unlimited deductors, auto-calculate rates, and generate FVU files instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setShowLogin(true)} className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 transition flex items-center justify-center gap-2">
                                Get Started Free <ArrowRight size={20} />
                            </button>
                            <button className="px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition">
                                View Demo
                            </button>
                        </div>
                        <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> FVU 9.3 Integrated</span>
                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> AI Tax Assistant</span>
                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> Cloud Backup</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-brand-600/20 blur-2xl rounded-full opacity-50"></div>
                        <img
                            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000"
                            alt="Dashboard Preview"
                            className="relative rounded-2xl shadow-2xl border border-slate-200"
                        />
                    </div>
                </div>
            </header>

            {/* Features */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to file confident returns</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">From auto-calculating interest to generating validated FVU files, we cover the entire TDS compliance lifecycle.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6"><Zap size={24} /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast Entry</h3>
                            <p className="text-slate-600">Bulk import challans and deductees. Smart auto-complete for PAN and Sections speeds up data entry by 40%.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6"><Shield size={24} /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Error-Free Validation</h3>
                            <p className="text-slate-600">Built-in CSI file validation and PAN verification ensures your returns are rejected-proof before you file.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6"><Star size={24} /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Tax Expert</h3>
                            <p className="text-slate-600">Stuck on a section rate? Ask our integrated Gemini AI assistant for instant compliance advice.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-slate-600">Choose the plan that fits your practice size.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="border border-slate-200 rounded-2xl p-8 hover:border-brand-300 transition relative">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Basic</h3>
                            <div className="text-4xl font-bold text-slate-900 mb-6">₹499<span className="text-sm font-normal text-slate-500">/mo</span></div>
                            <ul className="space-y-3 mb-8 text-slate-600">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> 5 Businesses</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Regular Returns</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Email Support</li>
                            </ul>
                            <button onClick={() => setShowLogin(true)} className="w-full py-3 border border-brand-600 text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition">Choose Basic</button>
                        </div>
                        <div className="border-2 border-brand-600 rounded-2xl p-8 shadow-xl relative transform md:-translate-y-4 bg-white">
                            <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">POPULAR</div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Professional</h3>
                            <div className="text-4xl font-bold text-slate-900 mb-6">₹999<span className="text-sm font-normal text-slate-500">/mo</span></div>
                            <ul className="space-y-3 mb-8 text-slate-600">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Unlimited Businesses</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Correction Returns</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> AI Assistant Access</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Priority Support</li>
                            </ul>
                            <button onClick={() => setShowLogin(true)} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition shadow-lg">Choose Pro</button>
                        </div>
                        <div className="border border-slate-200 rounded-2xl p-8 hover:border-brand-300 transition">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Enterprise</h3>
                            <div className="text-4xl font-bold text-slate-900 mb-6">₹2499<span className="text-sm font-normal text-slate-500">/mo</span></div>
                            <ul className="space-y-3 mb-8 text-slate-600">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Multi-User Access</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> API Access</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-600" /> Dedicated Account Mgr</li>
                            </ul>
                            <button onClick={() => setShowLogin(true)} className="w-full py-3 border border-brand-600 text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-4 text-2xl font-bold text-white">TDS Pro</div>
                    <p className="mb-8">Trusted by 10,000+ Tax Practitioners across India.</p>
                    <div className="text-sm">&copy; 2025 TDS Pro Software. All rights reserved.</div>
                </div>
            </footer>

            {/* Login Modal */}
            {showLogin && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>

                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                            <p className="text-slate-500 mb-6">Enter your credentials to access your dashboard.</p>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition shadow-lg mt-2 disabled:opacity-50"
                                >
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-xs text-slate-400">
                                <p>Demo Credentials:</p>
                                <p>Admin: admin@example.com / admin123</p>
                                <p>User: user@tdspro.com / user</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
