import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Box,
  Network,
  HardDrive,
  FolderTree,
  ShieldAlert,
  ShieldCheck,
  ListOrdered,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Server,
  Clock,
  Command
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState<{ backend: string; portainer: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth({
          backend: res.data.components?.backend || 'OFFLINE',
          portainer: res.data.components?.portainer || 'UNKNOWN'
        });
      } catch {
        setHealth({ backend: 'OFFLINE', portainer: 'OFFLINE' });
      }
    };
    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 10000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(healthInterval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: "Vue d'ensemble", path: "/", icon: LayoutDashboard },
    { name: "Conteneurs", path: "/containers", icon: Box },
    { name: "Réseau", path: "/network", icon: Network },
    { name: "Stockage", path: "/storage", icon: HardDrive },
    { name: "Fichiers", path: "/files", icon: FolderTree },
    { name: "Sécurité & Maj", path: "/security", icon: ShieldAlert },
    { name: "Sauvegardes", path: "/backups", icon: ShieldCheck },
    { name: "Événements", path: "/events", icon: ListOrdered },
    { name: "Paramètres", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-dark-900 border-b border-dark-750/80 p-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-nexus-purple via-nexus-indigo to-nexus-cyan rounded-xl shadow-glow-purple">
            <Server className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-wider text-white">NEXUS</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-dark-900/90 border-r border-dark-750/70 backdrop-blur-2xl flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="hidden md:flex items-center gap-3.5 px-6 py-6 border-b border-dark-750/70">
            <div className="p-2.5 bg-gradient-to-tr from-nexus-purple via-nexus-indigo to-nexus-cyan rounded-xl shadow-glow-purple">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-wider leading-none">NEXUS</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ubuntu OS Console</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 relative ${
                      isActive
                        ? 'bg-gradient-to-r from-nexus-purple/20 to-nexus-blue/15 text-nexus-purple border border-nexus-purple/40 shadow-glow-purple font-bold'
                        : 'text-slate-400 hover:bg-dark-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Status Badges */}
        <div className="p-4 border-t border-dark-750/70 space-y-4">
          <div className="p-3.5 bg-dark-950/80 rounded-xl border border-dark-750/70 space-y-2.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <span className="led-pulse-green" />
                API Backend:
              </span>
              <span className="font-extrabold text-nexus-emerald">
                {health?.backend || 'ONLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <span className="led-pulse-amber" />
                Portainer:
              </span>
              <span className={`font-extrabold ${
                health?.portainer === 'ONLINE' ? 'text-nexus-emerald' : 'text-nexus-amber'
              }`}>
                {health?.portainer === 'DEV_LOCAL' ? 'DEV (MOCK)' : (health?.portainer || 'MOCK')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-dark-800 rounded-xl flex items-center justify-center font-black text-nexus-purple text-xs border border-dark-700 shadow-glow-purple">
                {username ? username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-xs">
                <p className="font-bold text-white leading-tight">{username || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 font-mono">Session active</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-2 text-slate-400 hover:text-nexus-rose rounded-xl transition hover:bg-dark-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Top Header Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-dark-900/70 border-b border-dark-750/70 backdrop-blur-2xl">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-dark-850 border border-dark-750 rounded-xl text-slate-300">
              <span className="led-pulse-green" />
              Serveur Hôte Connecté
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-dark-850 border border-dark-750 rounded-xl text-slate-300">
              <Clock className="w-3.5 h-3.5 text-nexus-purple" /> {currentTime}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-850 border border-dark-750 text-slate-400 text-xs rounded-xl font-mono">
              <Command className="w-3.5 h-3.5 text-nexus-blue" /> Quick Access
            </div>
            <button
              onClick={() => navigate('/security')}
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-nexus-purple to-nexus-blue hover:from-nexus-purpleDark hover:to-nexus-blueDark text-white border border-nexus-purple/40 rounded-xl text-xs font-bold transition shadow-glow-purple"
            >
              <ShieldAlert className="w-4 h-4" /> Audit Sécurité
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
