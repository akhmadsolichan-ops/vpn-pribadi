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
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Device {
  id: number;
  name: string;
  location: string;
  mikrotik_version: string;
  vpn_type: string;
  ip_vpn: string;
  vpn_username: string;
  vpn_password: string;
  status: 'online' | 'offline';
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

const StatusBadge = ({ status }: { status: 'online' | 'offline' }) => (
  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
    status === 'online' 
      ? 'bg-noc-online/10 text-noc-online border-noc-online/20' 
      : 'bg-noc-offline/10 text-noc-offline border-noc-offline/20'
  }`}>
    <div className={`ping-dot ${status === 'online' ? 'bg-noc-online' : 'bg-noc-offline'}`} />
    {status}
  </div>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [vpnSettings, setVpnSettings] = useState<any>({});
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [newDevice, setNewDevice] = useState({
    name: '',
    location: '',
    mikrotik_version: 'v7',
    vpn_type: 'SSTP',
    ip_vpn: '',
    vpn_username: '',
    vpn_password: ''
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchDevices();
      fetchLogs();
      fetchVpnSettings();
      const interval = setInterval(() => {
        fetchDevices();
        fetchLogs();
      }, 10000);
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

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error('Failed to fetch devices', err);
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

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDevice)
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchDevices();
      setNewDevice({
        name: '',
        location: '',
        mikrotik_version: 'v7',
        vpn_type: 'SSTP',
        ip_vpn: '',
        vpn_username: '',
        vpn_password: ''
      });
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to add device');
    }
  };

  const handleDeleteDevice = async (id: number) => {
    if (confirm('Are you sure you want to delete this device?')) {
      await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      fetchDevices();
    }
  };

  const generateScript = (device: Device) => {
    const vpnType = device.vpn_type.toLowerCase();
    const serverAddr = vpnSettings.vpn_server_ip || window.location.hostname;

    if (vpnType === 'sstp') {
      return `# MikroPanel Remote Access Script (SSTP)
/interface sstp-client add name=mikropanel-vpn \\
    connect-to=${serverAddr} \\
    user=${device.vpn_username} \\
    password=${device.vpn_password} \\
    port=443 profile=default-encryption \\
    disabled=no
/ip address add address=${device.ip_vpn}/24 interface=mikropanel-vpn comment="MikroPanel Tunnel IP"`;
    } else {
      return `# MikroPanel Remote Access Script (L2TP/IPSec)
/interface l2tp-client add name=mikropanel-vpn \\
    connect-to=${serverAddr} \\
    user=${device.vpn_username} \\
    password=${device.vpn_password} \\
    use-ipsec=yes ipsec-secret=mikropanel-secret \\
    profile=default-encryption \\
    disabled=no
/ip address add address=${device.ip_vpn}/24 interface=mikropanel-vpn comment="MikroPanel Tunnel IP"`;
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestNextIp = () => {
    if (devices.length === 0) return '10.50.0.2';
    const ips = devices
      .map(d => d.ip_vpn)
      .filter(ip => ip.startsWith('10.50.0.'))
      .map(ip => parseInt(ip.split('.').pop() || '0'))
      .sort((a, b) => a - b);
    
    const lastIp = ips[ips.length - 1] || 1;
    return `10.50.0.${lastIp + 1}`;
  };

  useEffect(() => {
    if (isModalOpen && !newDevice.ip_vpn) {
      setNewDevice(prev => ({ ...prev, ip_vpn: suggestNextIp() }));
    }
  }, [isModalOpen, devices]);

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

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location.toLowerCase().includes(searchTerm.toLowerCase())
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
          <SidebarItem icon={Router} label="DEVICES" active={activeTab === 'devices'} onClick={() => { setActiveTab('devices'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Terminal} label="IP MANAGEMENT" active={activeTab === 'ip-management'} onClick={() => { setActiveTab('ip-management'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={ShieldCheck} label="VPN SETTINGS" active={activeTab === 'vpn-settings'} onClick={() => { setActiveTab('vpn-settings'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Activity} label="SYSTEM LOGS" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Settings} label="SETTINGS" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg text-[10px] sm:text-xs font-bold rounded-xl shadow-lg shadow-noc-accent/20 transition-all active:scale-95 uppercase tracking-wider"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Device</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'TOTAL DEVICES', value: devices.length, icon: Router, color: 'noc-accent' },
                  { label: 'ONLINE NODES', value: devices.filter(d => d.status === 'online').length, icon: Activity, color: 'noc-online' },
                  { label: 'OFFLINE NODES', value: devices.filter(d => d.status === 'offline').length, icon: X, color: 'noc-offline' },
                  { label: 'ACTIVE VPN', value: 'SSTP/L2TP', icon: ShieldCheck, color: 'noc-accent' }
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
                    <h3 className="font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest text-sm">Real-time Network Monitor</h3>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-noc-online" /> ONLINE</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-noc-offline" /> OFFLINE</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-noc-accent/5">
                  {devices.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-mono text-sm uppercase tracking-widest">No devices detected in network</div>
                  ) : (
                    devices.slice(0, 8).map((device, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={device.id} 
                        className="p-6 flex items-center justify-between hover:bg-noc-accent/5 transition-all group"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-noc-bg/50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-noc-accent border border-transparent group-hover:border-noc-accent/20 transition-all">
                            <Router size={22} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white tracking-tight">{device.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <MapPin size={10} /> {device.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="text-right">
                            <div className="text-xs font-mono text-noc-accent mb-1">{device.ip_vpn}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VPN ADDRESS</div>
                          </div>
                          <div className="w-32">
                            <StatusBadge status={device.status} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-slate-200 dark:bg-noc-accent/10 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ x: [-32, 32] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="w-8 h-full bg-noc-accent/40"
                              />
                            </div>
                            <span className="text-[9px] font-mono text-noc-accent">PING</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredDevices.map((device, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                  key={device.id}
                  className="glass-card p-8 rounded-3xl relative overflow-hidden group hover:neon-glow transition-all"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-noc-bg/50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-noc-accent border border-slate-200 dark:border-noc-accent/10 transition-all">
                        <Router size={28} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight">{device.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <MapPin size={12} className="text-noc-accent" />
                          {device.location}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={device.status} />
                  </div>

                  <div className="space-y-4 mb-8 p-4 bg-slate-50 dark:bg-noc-bg/30 rounded-2xl border border-slate-200 dark:border-noc-accent/5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400 flex items-center gap-2"><Cpu size={14} /> RouterOS</span>
                      <span className="text-slate-900 dark:text-white">{device.mikrotik_version}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400 flex items-center gap-2"><ShieldCheck size={14} /> Protocol</span>
                      <span className="text-noc-accent">{device.vpn_type}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400 flex items-center gap-2"><Terminal size={14} /> Tunnel IP</span>
                      <span className="font-mono text-noc-accent">{device.ip_vpn}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedDevice(device)}
                      className="flex-1 py-3 bg-noc-accent/10 hover:bg-noc-accent text-noc-accent hover:text-noc-bg text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest border border-noc-accent/20"
                    >
                      Access Script
                    </button>
                    <button 
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-3 text-noc-offline hover:bg-noc-offline/10 rounded-xl transition-all border border-transparent hover:border-noc-offline/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'ip-management' && (
            <div className="glass-card rounded-3xl overflow-hidden neon-border">
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">IP Address Allocation</h3>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-noc-accent/10 border border-noc-accent/20 rounded-xl text-[10px] font-bold text-noc-accent uppercase tracking-widest">
                    Subnet: 10.50.0.0/24
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-white/5">
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tunnel IP</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Node</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Protocol</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-noc-accent/10">
                    {devices.map(device => (
                      <tr key={device.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-6 font-mono text-noc-accent text-sm">{device.ip_vpn}</td>
                        <td className="p-6">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{device.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest">{device.location}</div>
                        </td>
                        <td className="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">{device.vpn_type}</td>
                        <td className="p-6">
                          <StatusBadge status={device.status} />
                        </td>
                      </tr>
                    ))}
                    {devices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-400 uppercase tracking-widest text-xs">
                          No active IP allocations detected
                        </td>
                      </tr>
                    )}
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
                            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">SSTP Protocol</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Secure Socket Tunneling</div>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setVpnSettings({...vpnSettings, sstp_enabled: vpnSettings.sstp_enabled === 'true' ? 'false' : 'true'})}
                          className={`w-12 h-6 rounded-full transition-all relative ${vpnSettings.sstp_enabled === 'true' ? 'bg-noc-accent' : 'bg-slate-300 dark:bg-noc-card'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${vpnSettings.sstp_enabled === 'true' ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-noc-accent/10 text-noc-accent rounded-lg"><Lock size={18} /></div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">L2TP/IPSec</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Layer 2 Tunneling Protocol</div>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setVpnSettings({...vpnSettings, l2tp_enabled: vpnSettings.l2tp_enabled === 'true' ? 'false' : 'true'})}
                          className={`w-12 h-6 rounded-full transition-all relative ${vpnSettings.l2tp_enabled === 'true' ? 'bg-noc-accent' : 'bg-slate-300 dark:bg-noc-card'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${vpnSettings.l2tp_enabled === 'true' ? 'left-7' : 'left-1'}`} />
                        </button>
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
                          This address will be embedded into generated MikroTik scripts. Ensure port 443 (SSTP) and UDP 500/4500 (L2TP) are open on your firewall.
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
                      log.event === 'STATUS_CHANGE' ? 'bg-noc-accent/10 text-noc-accent' :
                      log.event === 'DEVICE_CREATED' ? 'bg-noc-online/10 text-noc-online' :
                      'bg-slate-400/10 text-slate-400'
                    }`}>
                      {log.event === 'STATUS_CHANGE' ? <Activity size={14} /> : 
                       log.event === 'DEVICE_CREATED' ? <Plus size={14} /> : 
                       <Terminal size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {log.event} {log.device_name && `• ${log.device_name}`}
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

      {/* Add Device Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-noc-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass-card rounded-3xl shadow-2xl overflow-hidden neon-border"
            >
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">Register New Node</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-noc-accent transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddDevice} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Device Identity</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newDevice.name}
                      onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Deployment Location</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newDevice.location}
                      onChange={e => setNewDevice({...newDevice, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">RouterOS Version</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all appearance-none"
                      value={newDevice.mikrotik_version}
                      onChange={e => setNewDevice({...newDevice, mikrotik_version: e.target.value})}
                    >
                      <option value="v6">Legacy (v6)</option>
                      <option value="v7">Modern (v7)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tunnel Protocol</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all appearance-none"
                      value={newDevice.vpn_type}
                      onChange={e => setNewDevice({...newDevice, vpn_type: e.target.value})}
                    >
                      <option value="SSTP">SSTP (SSL/TLS)</option>
                      <option value="L2TP">L2TP/IPSec</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tunnel IP Assignment</label>
                    <input 
                      type="text" 
                      placeholder="10.50.0.x"
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm font-mono transition-all"
                      value={newDevice.ip_vpn}
                      onChange={e => setNewDevice({...newDevice, ip_vpn: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">VPN Credentials (User)</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                      value={newDevice.vpn_username}
                      onChange={e => setNewDevice({...newDevice, vpn_username: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">VPN Credentials (Key)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-noc-bg/50 border border-slate-200 dark:border-noc-accent/10 rounded-2xl outline-none focus:border-noc-accent text-sm transition-all"
                    value={newDevice.vpn_password}
                    onChange={e => setNewDevice({...newDevice, vpn_password: e.target.value})}
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-noc-accent hover:bg-noc-accent/90 text-noc-bg font-bold rounded-2xl shadow-lg shadow-noc-accent/20 transition-all uppercase tracking-widest text-xs"
                  >
                    Initialize Node Registration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Script Modal */}
      <AnimatePresence>
        {selectedDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDevice(null)}
              className="absolute inset-0 bg-noc-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-3xl shadow-2xl overflow-hidden neon-border"
            >
              <div className="p-8 border-b border-slate-200 dark:border-noc-accent/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest">Deployment Script</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Injection Command</p>
                </div>
                <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-noc-accent transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8">
                <div className="relative group">
                  <pre className="p-8 bg-noc-bg text-noc-accent font-mono text-xs rounded-2xl overflow-x-auto border border-noc-accent/10 shadow-inner">
                    {generateScript(selectedDevice)}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(generateScript(selectedDevice), selectedDevice.id)}
                    className="absolute top-4 right-4 p-3 bg-noc-accent/10 hover:bg-noc-accent text-noc-accent hover:text-noc-bg rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-noc-accent/20"
                  >
                    {copiedId === selectedDevice.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                
                <div className="mt-8 p-6 bg-noc-accent/5 border border-noc-accent/10 rounded-2xl flex gap-4">
                  <div className="text-noc-accent mt-0.5"><ShieldCheck size={20} /></div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-noc-accent uppercase tracking-widest block mb-1">Security Protocol:</strong>
                    Ensure the target MikroTik has a valid route to the internet and DNS resolution is operational. This script will establish a secure tunnel back to the NOC server.
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 dark:bg-white/5 flex justify-end">
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="px-8 py-3 bg-slate-200 dark:bg-noc-card hover:bg-slate-300 dark:hover:bg-noc-accent/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all uppercase tracking-widest"
                >
                  Close Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
