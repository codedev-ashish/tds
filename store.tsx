import React, { createContext, useContext, useState, useEffect } from 'react';
import { Deductor, Challan, Deductee, DeductionEntry, EntityType, ReturnContext, TdsReturn, NewsItem, SupportTicket, User, SubscriptionPlan } from './types';

interface TdsContextType {
  currentUser: User | null;
  deductors: Deductor[];
  activeDeductorId: string | null;
  activeChallanId: string | null;
  activeReturnContext: ReturnContext | null;

  challans: Challan[];
  deductees: Deductee[];
  deductions: DeductionEntry[];
  returns: TdsReturn[];

  // Admin Data
  users: User[];
  plans: SubscriptionPlan[];
  notifications: any[];
  analytics: any;
  settings: any;

  // News & Support
  news: NewsItem[];
  supportTickets: SupportTicket[];
  chatMessages: any[];

  setActiveDeductor: (id: string | null) => void;
  setActiveChallanId: (id: string | null) => void;
  setReturnContext: (context: ReturnContext | null) => void;

  addDeductor: (deductor: Deductor) => Promise<void>;
  updateDeductor: (deductor: Deductor) => Promise<void>;

  addChallan: (challan: Challan) => Promise<void>;
  deleteChallan: (id: string) => Promise<void>;

  addDeductee: (deductee: Deductee) => Promise<void>;
  updateDeductee: (deductee: Deductee) => Promise<void>;

  addDeduction: (deduction: DeductionEntry) => Promise<void>;
  deleteDeduction: (id: string) => Promise<void>;
  deleteReturn: (id: string) => Promise<void>;
  createOrUpdateReturn: (ret: Partial<TdsReturn>) => Promise<string>;
  saveCurrentReturn: () => Promise<void>;
  completeReturn: (deductorId: string, fy: string, qtr: string, form: string, type: 'Regular' | 'Correction') => Promise<void>;

  // Actions for News & Support
  addNews: (news: NewsItem) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addSupportTicket: (ticket: SupportTicket) => Promise<void>;
  updateSupportTicket: (ticket: SupportTicket) => Promise<void>;
  sendChatMessage: (msg: any) => Promise<void>;
  fetchChatMessages: (userId: string) => Promise<void>;

  // Admin Actions
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addPlan: (plan: SubscriptionPlan) => Promise<void>;
  updatePlan: (plan: SubscriptionPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  addAd: (ad: any) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
  sendNotification: (notif: any) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  backupSystem: () => Promise<void>;

  // Auth Actions
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;

  refreshData: () => Promise<void>;
}

const TdsContext = createContext<TdsContextType | undefined>(undefined);

const API_URL = '/api';

export const TdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = localStorage.getItem('tds_session');
    return session ? JSON.parse(session) : null;
  });
  const [deductors, setDeductors] = useState<Deductor[]>([]);
  const [activeDeductorId, setActiveDeductorId] = useState<string | null>(null);
  const [activeReturnContext, setReturnContext] = useState<ReturnContext | null>(null);
  const [activeChallanId, setActiveChallanId] = useState<string | null>(null);

  const [challans, setChallans] = useState<Challan[]>([]);
  const [deductees, setDeductees] = useState<Deductee[]>([]);
  const [deductions, setDeductions] = useState<DeductionEntry[]>([]);
  const [returns, setReturns] = useState<TdsReturn[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const apiCall = async (endpoint: string, options: RequestInit = {}, fallback: any = null) => {
    console.log(`API Call: ${options.method || 'GET'} ${API_URL}/${endpoint}`, options.body ? '(with body)' : '');
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, options);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API call failed for ${endpoint}: ${res.status} ${res.statusText}`, errorText);
        return fallback;
      }
      const text = await res.text();
      if (!text) return fallback;
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(`Failed to parse JSON for ${endpoint}:`, text);
        return fallback;
      }
    } catch (err) {
      console.error(`Network error for ${endpoint}:`, err);
      return fallback;
    }
  };

  const fetchData = async () => {
    try {
      const [
        deductorsRes, challansRes, deducteesRes, deductionsRes, returnsRes, newsRes, ticketsRes, usersRes, plansRes, adsRes, notificationsRes, analyticsRes, settingsRes
      ] = await Promise.all([
        apiCall('deductors', {}, []),
        apiCall('challans', {}, []),
        apiCall('deductees', {}, []),
        apiCall('deductions', {}, []),
        apiCall('returns', {}, []),
        apiCall('news', {}, []),
        apiCall('tickets', {}, []),
        apiCall('users', {}, []),
        apiCall('plans', {}, []),
        apiCall('ads', {}, []),
        apiCall('notifications', {}, []),
        apiCall('analytics', {}, null),
        apiCall('settings', {}, {})
      ]);

      setDeductors(deductorsRes);
      setChallans(challansRes);
      setDeductees(deducteesRes);
      setDeductions(deductionsRes);
      setReturns(returnsRes);
      setNews(newsRes);
      setSupportTickets(ticketsRes);
      setUsers(usersRes);
      setPlans(plansRes);
      setAds(adsRes);
      setNotifications(notificationsRes);
      setAnalytics(analyticsRes);
      setSettings(settingsRes);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Actions ---

  const login = async (email: string, password: string): Promise<User> => {
    const user = await apiCall('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!user) throw new Error('Login failed');
    localStorage.setItem('tds_session', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('tds_session');
    setCurrentUser(null);
  };

  const addDeductor = async (d: Deductor) => {
    const deductorWithUser = { ...d, userId: currentUser?.id };
    await apiCall('deductors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deductorWithUser) });
    setDeductors([...deductors, deductorWithUser]);
    if (!activeDeductorId) setActiveDeductorId(d.id);
  };

  const updateDeductor = async (d: Deductor) => {
    await apiCall('deductors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); // Upsert
    setDeductors(deductors.map(x => x.id === d.id ? d : x));
  };

  const setActiveDeductor = (id: string | null) => {
    setActiveDeductorId(id);
    setActiveChallanId(null);
    setReturnContext(null);
  };

  const addChallan = async (c: Challan) => {
    const newChallan = { ...c, status: 'Draft' as const };
    await apiCall('challans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newChallan) });
    setChallans(prev => [...prev, newChallan]);
  };

  const deleteChallan = async (id: string) => {
    await apiCall(`challans/${id}`, { method: 'DELETE' });
    setChallans(challans.filter(c => c.id !== id));
    if (activeChallanId === id) setActiveChallanId(null);
  };

  const addDeductee = async (d: Deductee) => {
    await apiCall('deductees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    setDeductees([...deductees, d]);
  };

  const updateDeductee = async (d: Deductee) => {
    await apiCall('deductees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    setDeductees(deductees.map(x => x.id === d.id ? d : x));
  };

  const addDeduction = async (d: DeductionEntry) => {
    const newDeduction = { ...d, status: 'Draft' as const };
    await apiCall('deductions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDeduction) });
    setDeductions([...deductions, newDeduction]);
  };

  const deleteDeduction = async (id: string) => {
    await apiCall(`deductions/${id}`, { method: 'DELETE' });
    setDeductions(deductions.filter(d => d.id !== id));
  };

  const deleteReturn = async (id: string) => {
    await apiCall(`returns/${id}`, { method: 'DELETE' });
    setReturns(returns.filter(r => r.id !== id));
  };

  const createOrUpdateReturn = async (ret: Partial<TdsReturn>): Promise<string> => {
    const type = ret.type || 'Regular';
    const exists = returns.find(r =>
      r.deductorId === ret.deductorId &&
      r.financialYear === ret.financialYear &&
      r.quarter === ret.quarter &&
      r.formNo === ret.formNo &&
      r.type === type
    );

    let newReturn: TdsReturn;
    if (exists) {
      newReturn = { ...exists, ...ret, updatedAt: new Date().toISOString() } as TdsReturn;
    } else {
      newReturn = {
        id: crypto.randomUUID(),
        status: 'Draft',
        updatedAt: new Date().toISOString(),
        deductorId: ret.deductorId!,
        financialYear: ret.financialYear!,
        quarter: ret.quarter!,
        formNo: ret.formNo!,
        formType: ret.formType!,
        type: type,
        previousTokenNumber: ret.previousTokenNumber || ''
      } as TdsReturn;
    }

    await apiCall('returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newReturn) });

    if (exists) {
      setReturns(returns.map(r => r.id === exists.id ? newReturn : r));
    } else {
      setReturns([...returns, newReturn]);
    }

    return newReturn.id;
  };

  const saveCurrentReturn = async () => {
    if (!activeReturnContext) return;
    await createOrUpdateReturn({
      deductorId: activeReturnContext.deductorId,
      financialYear: activeReturnContext.financialYear,
      quarter: activeReturnContext.quarter,
      formNo: activeReturnContext.formNo,
      type: activeReturnContext.type
    });
  };

  const completeReturn = async (deductorId: string, fy: string, qtr: string, form: string, type: 'Regular' | 'Correction' = 'Regular') => {
    const ret = returns.find(r => r.deductorId === deductorId && r.financialYear === fy && r.quarter === qtr && r.formNo === form && r.type === type);
    if (ret) {
      const updated = { ...ret, status: 'Generated', updatedAt: new Date().toISOString() } as TdsReturn;
      await apiCall('returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });

      // Also update associated challans and deductions to 'Generated'
      const myChallans = challans.filter(c => c.deductorId === deductorId && c.financialYear === fy && c.quarter === qtr);
      const myDeductions = deductions.filter(d => d.deductorId === deductorId && myChallans.some(c => c.id === d.challanId));

      await Promise.all([
        ...myChallans.map(c => apiCall('challans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...c, status: 'Generated' }) })),
        ...myDeductions.map(d => apiCall('deductions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, status: 'Generated' }) }))
      ]);

      setReturns(returns.map(r => r.id === ret.id ? updated : r));
      setChallans(challans.map(c => (c.deductorId === deductorId && c.financialYear === fy && c.quarter === qtr) ? { ...c, status: 'Generated' } : c));
      setDeductions(deductions.map(d => myDeductions.some(md => md.id === d.id) ? { ...d, status: 'Generated' } : d));
    }
  };

  const addNews = async (item: NewsItem) => {
    await apiCall('news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    setNews(prev => [item, ...prev]);
  };

  const deleteNews = async (id: string) => {
    await apiCall(`news/${id}`, { method: 'DELETE' });
    setNews(prev => prev.filter(n => n.id !== id));
  };

  const addSupportTicket = async (ticket: SupportTicket) => {
    await apiCall('tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ticket) });
    setSupportTickets(prev => [ticket, ...prev]);
  };

  const updateSupportTicket = async (ticket: SupportTicket) => {
    await apiCall('tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ticket) });
    setSupportTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
  };

  const sendChatMessage = async (msg: any) => {
    await apiCall('chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
    setChatMessages(prev => [...prev, msg]);
  };

  const fetchChatMessages = async (userId: string) => {
    const res = await apiCall(`chat/${userId}`, {}, []);
    setChatMessages(res);
  };

  // Admin Actions
  const addUser = async (user: User) => {
    await apiCall('users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    setUsers(prev => [...prev, user]);
  };

  const updateUser = async (user: User) => {
    await apiCall('users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const deleteUser = async (id: string) => {
    await apiCall(`users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addPlan = async (plan: SubscriptionPlan) => {
    await apiCall('plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
    setPlans(prev => [...prev, plan]);
  };

  const updatePlan = async (plan: SubscriptionPlan) => {
    await apiCall('plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
    setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
  };

  const deletePlan = async (id: string) => {
    await apiCall(`plans/${id}`, { method: 'DELETE' });
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const addAd = async (ad: any) => {
    await apiCall('ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ad) });
    setAds(prev => [...prev, ad]);
  };

  const deleteAd = async (id: string) => {
    await apiCall(`ads/${id}`, { method: 'DELETE' });
    setAds(prev => prev.filter(a => a.id !== id));
  };

  const sendNotification = async (notif: any) => {
    await apiCall('notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notif) });
    setNotifications(prev => [notif, ...prev]);
  };

  const updateSettings = async (newSettings: any) => {
    await apiCall('settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const backupSystem = async () => {
    const backup = await apiCall('system/backup', { method: 'POST' });
    if (backup) {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `FULL_SYSTEM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <TdsContext.Provider value={{
      currentUser, deductors, activeDeductorId, activeChallanId, activeReturnContext,
      challans, deductees, deductions, returns, news, supportTickets, users, plans,
      ads, notifications, analytics, chatMessages,
      setActiveDeductor, setActiveChallanId, setReturnContext,
      addDeductor, updateDeductor,
      addChallan, deleteChallan,
      addDeductee, updateDeductee,
      addDeduction, deleteDeduction, deleteReturn,
      createOrUpdateReturn, saveCurrentReturn, completeReturn,
      addNews, deleteNews, addSupportTicket, updateSupportTicket,
      sendChatMessage, fetchChatMessages,
      addUser, updateUser, deleteUser, addPlan, updatePlan, deletePlan,
      addAd, deleteAd, sendNotification, updateSettings, backupSystem, login, logout, refreshData
    }}>
      {children}
    </TdsContext.Provider>
  );
};

export const useTds = () => {
  const context = useContext(TdsContext);
  if (!context) throw new Error("useTds must be used within a TdsProvider");
  return context;
};
