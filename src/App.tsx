import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Router, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  MapPin,
  Cpu,
  ShieldCheck,
  Activity,
  ChevronRight,
  X,
  Terminal,
  Shield,
  RefreshCw,
  Lock,
  User,
  Menu,
  ShieldAlert,
  UserCheck,
  BookOpen,
  Eye,
  EyeOff,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Gateway {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  status: 'online' | 'offline';
  last_seen: string | null;
  created_at: string;
}

interface VpnAccount {
  id: number;
  gateway_id: number;
  gateway_name?: string;
  username: string;
  password?: string;
  service: string;
  profile: string;
  comment: string;
  status: 'online' | 'offline';
  is_disabled: number;
  last_seen: string | null;
  created_at: string;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative group ${
      active 
        ? 'text-noc-accent dark:text-noc-accent' 
        : 'text-slate-500 hover:text-slate-900 dark:hover:text-noc-accent/80'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute left-0 w-1 h-6 bg-noc-accent rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
      />
    )}
    <Icon size={18} className={active ? 'drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : ''} />
    <span>{label}</span>
    {!active && (
      <div className="absolute right-4 w-1 h-1 rounded-full bg-noc-accent opacity-0 group-hover:opacity-100 transition-opacity" />
    )}
  </button>
);

const StatusBadge = ({ status }: { status: 'online' | 'offline' | 'connected' }) => (
  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
    status === 'online' 
      ? 'bg-noc-online/10 text-noc-online border-noc-online/20' 
      : status === 'connected'
        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        : 'bg-noc-offline/10 text-noc-offline border-noc-offline/20'
  }`}>
    <div className={`ping-dot ${
      status === 'online' ? 'bg-noc-online' : status === 'connected' ? 'bg-amber-500' : 'bg-noc-offline'
    }`} />
    {status}
  </div>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [vpnAccounts, setVpnAccounts] = useState<VpnAccount[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<VpnAccount | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [vpnSettings, setVpnSettings] = useState<any>({});
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [newGateway, setNewGateway] = useState({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: ''
  });

  const [newAccount, setNewAccount] = useState({
    gateway_id: '',
    username: '',
    password: '',
    service: 'l2tp',
    profile: 'default',
    comment: ''
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchGateways();
      fetchAccounts();
      fetchLogs();
      fetchVpnSettings();
      const interval = setInterval(() => {
        fetchGateways();
        fetchAccounts();
        fetchLogs();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/gateways');
      const data = await res.json();
      setGateways(data);
    } catch (err) {
      console.error('Failed to fetch gateways', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/vpn-accounts');
      const data = await res.json();
      setVpnAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const fetchVpnSettings = async () => {
    try {
      const res = await fetch('/api/vpn-settings');
      const data = await res.json();
      setVpnSettings(data);
    } catch (err) {
      console.error('Failed to fetch VPN settings', err);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    const res = await fetch('/api/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword })
    });
    if (res.ok) {
      alert('Password updated successfully');
      setNewPassword('');
    } else {
      alert('Failed to update password');
    }
  };

  const handleUpdateVpnSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vpn-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vpnSettings)
    });
    if (res.ok) {
      alert('VPN settings updated');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      setIsLoggedIn(true);
    } else {
      alert('Login failed');
    }
  };

  const handleAddGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/gateways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGateway)
    });
    if (res.ok) {
      setIsGatewayModalOpen(false);
      fetchGateways();
      setNewGateway({ name: '', host: '', port: 8728, username: '', password: '' });
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to add gateway');
    }
  };

  const handleDeleteGateway = async (id: number) => {
    if (confirm('Are you sure you want to delete this gateway? All linked accounts will be removed from DB.')) {
      await fetch(`/api/gateways/${id}`, { method: 'DELETE' });
      fetchGateways();
      fetchAccounts();
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vpn-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount)
    });
    if (res.ok) {
      setIsAccountModalOpen(false);
      fetchAccounts();
      setNewAccount({ gateway_id: '', username: '', password: '', service: 'l2tp', profile: 'default', comment: '' });
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to add account');
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (confirm('Are you sure you want to delete this account? It will be removed from MikroTik.')) {
      await fetch(`/api/vpn-accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    }
  };

  const handleToggleAccount = async (id: number) => {
    const res = await fetch(`/api/vpn-accounts/${id}/toggle`, { method: 'POST' });
    if (res.ok) {
      fetchAccounts();
    }
  };

  const handleEditAccount = (account: VpnAccount) => {
    setSelectedAccount(account);
    setNewAccount({
      gateway_id: account.gateway_id.toString(),
      username: account.username,
      password: account.password || '',
      service: account.service,
      profile: account.profile,
      comment: account.comment
    });
    setIsEditAccountModalOpen(true);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-noc-bg cyber-grid p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card p-10 rounded-3xl neon-glow"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-noc-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-noc-accent/20 neon-glow">
              <ShieldCheck className="text-noc-accent" size={40} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">MIKROPANEL <span className="text-noc-accent">NOC</span></h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-center">Mitra (DBN) Data Buana Nusantara</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Access Identity</label>
              <input 
                type="text" 
                className="w-full px-5 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl focus:border-noc-accent outline-none transition-all text-sm font-mono"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Security Key</label>
              <input 
                type="password" 
                className="w-full px-5 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl focus:border-noc-accent outline-none transition-all text-sm font-mono"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              Initialize Session
            </button>
          </form>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 rounded-xl bg-slate-100 dark:bg-noc-card hover:bg-slate-200 dark:hover:bg-noc-accent/10 text-slate-500 dark:text-slate-400 transition-all border border-slate-200 dark:border-noc-accent/10"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredGateways = gateways.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-light-bg dark:bg-noc-bg cyber-grid overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-noc-bg/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white/50 dark:bg-noc-bg/50 backdrop-blur-xl border-r border-slate-200 dark:border-noc-accent/10 flex flex-col z-50 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-noc-accent/10 rounded-xl flex items-center justify-center border border-noc-accent/20 neon-glow">
              <ShieldCheck className="text-noc-accent" size={22} />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight">MIKRO<span className="text-noc-accent">PANEL</span></span>
              <div className="text-[8px] font-bold text-noc-accent uppercase tracking-[0.3em]">NOC Dashboard</div>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-noc-accent">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="DASHBOARD" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Router} label="GATEWAYS" active={activeTab === 'gateways'} onClick={() => { setActiveTab('gateways'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Terminal} label="VPN ACCOUNTS" active={activeTab === 'vpn-accounts'} onClick={() => { setActiveTab('vpn-accounts'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={ShieldCheck} label="VPN SETTINGS" active={activeTab === 'vpn-settings'} onClick={() => { setActiveTab('vpn-settings'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Activity} label="SYSTEM LOGS" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Settings} label="SETTINGS" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
          <div className="px-4 pt-4">
            <button 
              onClick={() => setIsSetupGuideOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-noc-accent bg-noc-accent/5 border border-noc-accent/10 rounded-xl hover:bg-noc-accent/10 transition-all"
            >
              <BookOpen size={18} />
              <span>SETUP GUIDE</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-noc-accent/10 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-noc-card/50 border border-slate-200 dark:border-noc-accent/5">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">VPS STATUS</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-noc-online">OPERATIONAL</span>
              <div className="w-2 h-2 rounded-full bg-noc-online animate-pulse" />
            </div>
            <div className="text-[9px] font-mono text-slate-400 truncate">IP: 103.52.212.143</div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-noc-card hover:bg-slate-200 dark:hover:bg-noc-accent/10 text-slate-500 dark:text-slate-400 transition-all"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-noc-offline/10 hover:bg-noc-offline/20 text-noc-offline transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/50 dark:bg-noc-bg/50 backdrop-blur-xl border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between px-4 lg:px-10 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-noc-accent transition-colors">
              <Menu size={24} />
            </button>
            <div className="hidden sm:block h-8 w-[1px] bg-noc-accent/20" />
            <h2 className="text-[10px] sm:text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
              {activeTab} <span className="text-noc-accent">/ OVERVIEW</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-noc-accent transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH NETWORK..."
                className="pl-12 pr-6 py-2.5 bg-slate-100 dark:bg-noc-card/50 border border-slate-200 dark:border-noc-accent/10 rounded-xl text-xs font-mono focus:border-noc-accent outline-none w-48 lg:w-72 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'gateways' && (
              <button 
                onClick={() => setIsGatewayModalOpen(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg text-[10px] sm:text-xs font-bold rounded-xl shadow-lg shadow-noc-accent/20 transition-all active:scale-95 uppercase tracking-wider"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Gateway</span>
              </button>
            )}
            {activeTab === 'vpn-accounts' && (
              <button 
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg text-[10px] sm:text-xs font-bold rounded-xl shadow-lg shadow-noc-accent/20 transition-all active:scale-95 uppercase tracking-wider"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Create Account</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'TOTAL GATEWAYS', value: gateways.length, icon: Router, color: 'noc-accent' },
                  { label: 'ONLINE GATEWAYS', value: gateways.filter(g => g.status === 'online').length, icon: Activity, color: 'noc-online' },
                  { label: 'TOTAL ACCOUNTS', value: vpnAccounts.length, icon: User, color: 'noc-accent' },
                  { label: 'ACTIVE SESSIONS', value: vpnAccounts.filter(a => a.status === 'online').length, icon: ShieldCheck, color: 'noc-online' }
                ].map((stat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label} 
                    className="glass-card p-6 rounded-3xl relative overflow-hidden group"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-${stat.color}/10 transition-all`} />
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 bg-${stat.color}/10 text-${stat.color} rounded-xl border border-${stat.color}/20`}>
                        <stat.icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Realtime Monitoring */}
              <div className="glass-card rounded-3xl overflow-hidden neon-border">
                <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-noc-accent animate-pulse" />
                    <h3 className="font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest text-sm">Gateway Fleet Status</h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-noc-accent/5">
                  {gateways.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-mono text-sm uppercase tracking-widest">No gateways registered</div>
                  ) : (
                    gateways.map((gateway, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={gateway.id} 
                        className="p-6 flex items-center justify-between hover:bg-noc-accent/5 transition-all group"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-noc-bg/50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-noc-accent border border-transparent group-hover:border-noc-accent/20 transition-all">
                            <Router size={22} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white tracking-tight">{gateway.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              {gateway.host}:{gateway.port}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="text-right">
                            <div className="text-xs font-mono text-noc-accent mb-1">{vpnAccounts.filter(a => a.gateway_id === gateway.id).length}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ACCOUNTS</div>
                          </div>
                          <div className="w-32">
                            <StatusBadge status={gateway.status} />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gateways' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {gateways.map((gateway, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={gateway.id}
                  className="glass-card p-8 rounded-3xl relative overflow-hidden group hover:neon-glow transition-all"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-noc-bg/50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-noc-accent border border-slate-200 dark:border-noc-accent/10 transition-all">
                        <Router size={28} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight">{gateway.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Activity size={12} className="text-noc-accent" />
                          {gateway.host}:{gateway.port}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={gateway.status} />
                  </div>

                  <div className="space-y-4 mb-8 p-4 bg-slate-50 dark:bg-noc-bg/30 rounded-2xl border border-slate-200 dark:border-noc-accent/5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400 flex items-center gap-2"><User size={14} /> Username</span>
                      <span className="text-slate-900 dark:text-white font-mono">{gateway.username}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400 flex items-center gap-2"><Activity size={14} /> Accounts</span>
                      <span className="text-noc-accent font-mono">{vpnAccounts.filter(a => a.gateway_id === gateway.id).length}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDeleteGateway(gateway.id)}
                      className="flex-1 py-3 bg-noc-offline/10 hover:bg-noc-offline text-noc-offline hover:text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest border border-noc-offline/20"
                    >
                      Remove Gateway
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'vpn-accounts' && (
            <div className="glass-card rounded-3xl overflow-hidden neon-border">
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">VPN Accounts Fleet</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-white/5">
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Gateway</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Profile</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-noc-accent/10">
                    {vpnAccounts.map(account => (
                      <tr key={account.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors ${account.is_disabled ? 'opacity-60' : ''}`}>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${account.is_disabled ? 'bg-slate-400' : account.status === 'online' ? 'bg-noc-online animate-pulse' : 'bg-noc-offline'}`} />
                            <div className="font-mono text-noc-accent text-sm">{account.username}</div>
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest ml-5">{account.comment || 'No comment'}</div>
                        </td>
                        <td className="p-6">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{account.gateway_name}</div>
                        </td>
                        <td className="p-6">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{account.service} / {account.profile}</div>
                        </td>
                        <td className="p-6">
                          <StatusBadge status={account.is_disabled ? 'offline' : account.status} />
                          {account.is_disabled && <span className="ml-2 text-[8px] font-bold text-noc-offline uppercase tracking-widest">Disabled</span>}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggleAccount(account.id)}
                              className={`p-2 rounded-lg transition-all ${account.is_disabled ? 'text-noc-online hover:bg-noc-online/10' : 'text-slate-400 hover:bg-slate-400/10'}`}
                              title={account.is_disabled ? 'Enable Account' : 'Disable Account'}
                            >
                              {account.is_disabled ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button 
                              onClick={() => handleEditAccount(account)}
                              className="p-2 text-noc-accent hover:bg-noc-accent/10 rounded-lg transition-all"
                              title="Edit Account"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-2 text-noc-offline hover:bg-noc-offline/10 rounded-lg transition-all"
                              title="Delete Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'vpn-settings' && (
            <div className="max-w-4xl space-y-8">
              <div className="glass-card p-10 rounded-3xl neon-border">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-8">Global VPN Protocol Configuration</h3>
                <form onSubmit={handleUpdateVpnSettings} className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-noc-accent/10 text-noc-accent rounded-lg"><Shield size={18} /></div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">L2TP/IPSec Protocol</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Layer 2 Tunneling Protocol</div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-noc-online/10 text-noc-online border border-noc-online/20 rounded-lg text-[8px] font-bold uppercase tracking-widest">ACTIVE</div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Global IPSec PSK</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl focus:border-noc-accent outline-none transition-all font-mono text-sm"
                          value={vpnSettings.global_psk || ''}
                          onChange={e => setVpnSettings({...vpnSettings, global_psk: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Public Server IP / Domain</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl focus:border-noc-accent outline-none transition-all font-mono text-sm"
                          value={vpnSettings.vpn_server_ip || ''}
                          onChange={e => setVpnSettings({...vpnSettings, vpn_server_ip: e.target.value})}
                        />
                      </div>
                      <div className="p-4 bg-noc-accent/5 border border-noc-accent/10 rounded-2xl">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
                          This address will be embedded into generated MikroTik scripts. Ensure UDP 500/4500 (L2TP/IPSec) are open on your firewall.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="px-8 py-3 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all uppercase tracking-widest text-xs"
                    >
                      Commit Protocol Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="glass-card rounded-3xl overflow-hidden neon-border">
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">System Event Logs</h3>
                <button 
                  onClick={fetchLogs}
                  className="p-2 text-slate-400 hover:text-noc-accent transition-colors"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="p-4 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-noc-accent/5 rounded-2xl flex items-start gap-4 hover:border-noc-accent/20 transition-all">
                    <div className={`mt-1 p-1.5 rounded-lg ${
                      log.event === 'GATEWAY_ONLINE' || log.event === 'GATEWAY_CREATED' ? 'bg-noc-online/10 text-noc-online' :
                      log.event === 'GATEWAY_OFFLINE' ? 'bg-noc-offline/10 text-noc-offline' :
                      log.event === 'ACCOUNT_STATUS' ? 'bg-noc-accent/10 text-noc-accent' :
                      'bg-slate-400/10 text-slate-400'
                    }`}>
                      {log.event === 'GATEWAY_ONLINE' ? <Activity size={14} /> : 
                       log.event === 'GATEWAY_OFFLINE' ? <ShieldAlert size={14} /> :
                       log.event === 'GATEWAY_CREATED' ? <Plus size={14} /> : 
                       log.event === 'ACCOUNT_STATUS' ? <UserCheck size={14} /> :
                       <Terminal size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {log.event} {log.gateway_name && `• ${log.gateway_name}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">{log.details}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="p-20 text-center text-slate-400 uppercase tracking-widest text-xs">
                    No system events recorded
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl glass-card p-10 rounded-3xl neon-border">
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-8">System Configuration</h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Administrative Identity</label>
                  <input type="text" value="admin" disabled className="w-full px-5 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl text-slate-500 cursor-not-allowed font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">New Access Key</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full px-5 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl focus:border-noc-accent outline-none transition-all"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleUpdatePassword}
                  className="px-8 py-3 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all uppercase tracking-widest text-xs"
                >
                  Update Security Protocol
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Gateway Modal */}
      <AnimatePresence>
        {isGatewayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGatewayModalOpen(false)}
              className="absolute inset-0 bg-noc-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass-card rounded-3xl shadow-2xl overflow-hidden neon-border"
            >
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">Register MikroTik Gateway</h3>
                <button onClick={() => setIsGatewayModalOpen(false)} className="text-slate-400 hover:text-noc-accent transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddGateway} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Gateway Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newGateway.name}
                      onChange={e => setNewGateway({...newGateway, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Host / IP Address</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newGateway.host}
                      onChange={e => setNewGateway({...newGateway, host: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">API Port</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newGateway.port}
                      onChange={e => setNewGateway({...newGateway, port: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">API Username</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newGateway.username}
                      onChange={e => setNewGateway({...newGateway, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">API Password</label>
                    <input 
                      type="password" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newGateway.password}
                      onChange={e => setNewGateway({...newGateway, password: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all uppercase tracking-widest text-xs"
                >
                  Establish Connection
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountModalOpen(false)}
              className="absolute inset-0 bg-noc-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass-card rounded-3xl shadow-2xl overflow-hidden neon-border"
            >
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">Create VPN Account</h3>
                <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-noc-accent transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Target Gateway</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all appearance-none"
                    value={newAccount.gateway_id}
                    onChange={e => setNewAccount({...newAccount, gateway_id: e.target.value})}
                  >
                    <option value="">Select Gateway</option>
                    {gateways.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.host})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">VPN Username</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newAccount.username}
                      onChange={e => setNewAccount({...newAccount, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">VPN Password</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newAccount.password}
                      onChange={e => setNewAccount({...newAccount, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Service Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all appearance-none"
                      value={newAccount.service}
                      onChange={e => setNewAccount({...newAccount, service: e.target.value})}
                    >
                      <option value="any">Any</option>
                      <option value="l2tp">L2TP</option>
                      <option value="pptp">PPTP</option>
                      <option value="sstp">SSTP</option>
                      <option value="ovpn">OpenVPN</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">PPP Profile</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newAccount.profile}
                      onChange={e => setNewAccount({...newAccount, profile: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Comment / Note</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                    value={newAccount.comment}
                    onChange={e => setNewAccount({...newAccount, comment: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all uppercase tracking-widest text-xs"
                >
                  Deploy to MikroTik
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Setup Guide Modal */}
      <AnimatePresence>
        {isSetupGuideOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSetupGuideOpen(false)}
              className="absolute inset-0 bg-noc-bg/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl glass-card rounded-3xl shadow-2xl overflow-hidden neon-border max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-noc-accent/10 text-noc-accent rounded-xl border border-noc-accent/20">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">MikroTik Setup Guide</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Terminal Commands Configuration</p>
                  </div>
                </div>
                <button onClick={() => setIsSetupGuideOpen(false)} className="text-slate-400 hover:text-noc-accent transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-noc-accent uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-noc-accent" />
                    Step 1: Enable API Service
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Run this command in your MikroTik terminal to enable the API service and set the port.
                  </p>
                  <div className="relative group">
                    <pre className="p-6 bg-slate-900 rounded-2xl text-noc-accent font-mono text-xs overflow-x-auto border border-noc-accent/20">
                      {`/ip service enable api\n/ip service set api port=8728`}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(`/ip service enable api\n/ip service set api port=8728`, 999)}
                      className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedId === 999 ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-noc-accent uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-noc-accent" />
                    Step 2: Setup L2TP/IPSec Server
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Configure the L2TP server and IPSec peer. Replace <span className="text-noc-accent">PSK_SECRET</span> with your global PSK.
                  </p>
                  <div className="relative group">
                    <pre className="p-6 bg-slate-900 rounded-2xl text-noc-accent font-mono text-xs overflow-x-auto border border-noc-accent/20">
                      {`/interface l2tp-server server set enabled=yes use-ipsec=yes ipsec-secret=${vpnSettings.global_psk || 'mikropanel-psk'} default-profile=default-encryption`}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(`/interface l2tp-server server set enabled=yes use-ipsec=yes ipsec-secret=${vpnSettings.global_psk || 'mikropanel-psk'} default-profile=default-encryption`, 998)}
                      className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedId === 998 ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-noc-accent uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-noc-accent" />
                    Step 3: Create API User
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Create a dedicated user for the panel to communicate with your MikroTik.
                  </p>
                  <div className="relative group">
                    <pre className="p-6 bg-slate-900 rounded-2xl text-noc-accent font-mono text-xs overflow-x-auto border border-noc-accent/20">
                      {`/user add name=mikropanel group=full password=YOUR_PASSWORD comment="MikroPanel API User"`}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(`/user add name=mikropanel group=full password=YOUR_PASSWORD comment="MikroPanel API User"`, 997)}
                      className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      {copiedId === 997 ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </section>
              </div>
              
              <div className="p-8 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-noc-accent/10 shrink-0">
                <div className="flex items-center gap-4 p-4 bg-noc-accent/5 border border-noc-accent/10 rounded-2xl">
                  <ShieldCheck className="text-noc-accent shrink-0" size={20} />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                    Ensure your MikroTik firewall allows incoming connections on port <span className="text-noc-accent">8728 (API)</span> and UDP <span className="text-noc-accent">500, 4500, 1701</span> for L2TP/IPSec.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {isEditAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditAccountModalOpen(false)}
              className="absolute inset-0 bg-noc-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass-card rounded-3xl shadow-2xl overflow-hidden neon-border"
            >
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">Edit VPN Account</h3>
                <button onClick={() => setIsEditAccountModalOpen(false)} className="text-slate-400 hover:text-noc-accent transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Target Gateway</label>
                  <select 
                    required
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all appearance-none opacity-50 cursor-not-allowed"
                    value={newAccount.gateway_id}
                  >
                    {gateways.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.host})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">VPN Username</label>
                    <input 
                      type="text" 
                      required
                      disabled
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all opacity-50 cursor-not-allowed"
                      value={newAccount.username}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">VPN Password</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newAccount.password}
                      onChange={e => setNewAccount({...newAccount, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Service Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all appearance-none"
                      value={newAccount.service}
                      onChange={e => setNewAccount({...newAccount, service: e.target.value})}
                    >
                      <option value="any">Any</option>
                      <option value="l2tp">L2TP</option>
                      <option value="pptp">PPTP</option>
                      <option value="sstp">SSTP</option>
                      <option value="ovpn">OpenVPN</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">PPP Profile</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newAccount.profile}
                      onChange={e => setNewAccount({...newAccount, profile: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Comment / Description</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                    value={newAccount.comment}
                    onChange={e => setNewAccount({...newAccount, comment: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all uppercase tracking-widest text-xs"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
