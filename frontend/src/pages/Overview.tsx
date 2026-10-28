import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { GaugeMeter } from '../components/GaugeMeter';
import {
  Box,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Activity,
  Server,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [metricsRes, historyRes, containersRes, backupsRes, auditRes] = await Promise.all([
        api.get('/system/metrics'),
        api.get('/system/metrics/history?limit=20'),
        api.get('/containers'),
        api.get('/backups/history?limit=5'),
        api.get('/system/security-audit'),
      ]);

      setMetrics(metricsRes.data);
      setHistory(historyRes.data.map((item: any) => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })));
      setContainers(containersRes.data);
      setBackups(backupsRes.data);
      setAudit(auditRes.data);
    } catch {
      setError("Impossible de charger les données de la vue d'ensemble.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-nexus-purple" />
        <p className="text-sm font-medium animate-pulse">Chargement du tableau de bord d'administration...</p>
      </div>
    );
  }

  const activeContainers = containers.filter(c => c.state === 'running').length;
  const stoppedContainers = containers.filter(c => c.state !== 'running').length;
  const lastBackup = backups[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="led-pulse-green" />
            <h1 className="text-2xl font-black text-white tracking-wide">Vue d'ensemble</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervision matérielle et logicielle du serveur hôte en temps réel
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-dark-900 border border-dark-750 hover:border-nexus-purple text-slate-300 hover:text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-glow-purple"
        >
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {error && (
        <div className="p-4 bg-nexus-rose/10 border border-nexus-rose/30 rounded-xl flex items-center gap-3 text-nexus-rose text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SVG Radial Gauge Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Gauge Card */}
        <motion.div whileHover={{ y: -4 }} className="p-6 glass-card-interactive flex flex-col items-center">
          <GaugeMeter value={metrics?.cpu?.percent ?? 0} label="Charge Processeur" sublabel="CPU" colorClass="purple" />
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 font-mono">
              {metrics?.cpu?.cores ?? 0} Cœurs • Load: {metrics?.cpu?.load_avg?.join(', ')}
            </span>
          </div>
        </motion.div>

        {/* RAM Gauge Card */}
        <motion.div whileHover={{ y: -4 }} className="p-6 glass-card-interactive flex flex-col items-center">
          <GaugeMeter value={metrics?.memory?.percent ?? 0} label="Occupation RAM" sublabel="RAM" colorClass="blue" />
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 font-mono">
              {formatBytes(metrics?.memory?.used_bytes)} / {formatBytes(metrics?.memory?.total_bytes)}
            </span>
          </div>
        </motion.div>

        {/* Storage Root Gauge Card */}
        <motion.div whileHover={{ y: -4 }} className="p-6 glass-card-interactive flex flex-col items-center">
          <GaugeMeter value={metrics?.storage?.[0]?.percent ?? 0} label="Disque Racine (/)" sublabel="DISK" colorClass="emerald" />
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 font-mono">
              {formatBytes(metrics?.storage?.[0]?.used_bytes)} / {formatBytes(metrics?.storage?.[0]?.total_bytes)}
            </span>
          </div>
        </motion.div>

        {/* Security Score Gauge Card */}
        <motion.div whileHover={{ y: -4 }} className="p-6 glass-card-interactive flex flex-col items-center">
          <GaugeMeter value={audit?.security_score ?? 100} label="Score Sécurité" sublabel="AUDIT" colorClass={audit?.security_score >= 80 ? 'emerald' : 'rose'} />
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 font-mono">
              {audit?.vulnerability_count ?? 0} alerte(s) active(s)
            </span>
          </div>
        </motion.div>
      </div>

      {/* Hardware Specifications & Time-Series Recharts Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Specs Matrix */}
        <div className="p-6 glass-panel space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-nexus-purple" /> Spécifications Hôte
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-dark-750/70">
              <span className="text-slate-400">Nom Hôte:</span>
              <span className="font-bold text-white font-mono">{metrics?.host_info?.hostname || 'localhost'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-750/70">
              <span className="text-slate-400">Système d'exploitation:</span>
              <span className="font-bold text-white">{metrics?.host_info?.os_name || 'Linux'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-750/70">
              <span className="text-slate-400">Processeur & Archi:</span>
              <span className="font-bold text-white font-mono">{metrics?.cpu?.cores ?? 0} Cœurs ({metrics?.host_info?.architecture || 'x86_64'})</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-750/70">
              <span className="text-slate-400">Noyau Kernel:</span>
              <span className="font-bold text-slate-300 font-mono">{metrics?.host_info?.kernel || 'Linux'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-750/70">
              <span className="text-slate-400">Uptime Serveur:</span>
              <span className="font-bold text-nexus-emerald font-mono">{formatUptime(metrics?.uptime_seconds)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Mémoire Totale:</span>
              <span className="font-bold text-nexus-blue font-mono">{formatBytes(metrics?.memory?.total_bytes)}</span>
            </div>
          </div>
        </div>

        {/* Dual Gradient Recharts Graph */}
        <div className="lg:col-span-2 p-6 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-nexus-cyan" /> Utilisation CPU (%) & RAM (%)
            </h2>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-nexus-purple" /> En direct
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#384f7a" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#384f7a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#273859', color: '#fff', borderRadius: '12px' }} />
                <Area type="monotone" name="CPU (%)" dataKey="cpu_percent" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#cpuGrad)" />
                <Area type="monotone" name="RAM (%)" dataKey="ram_percent" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#ramGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Docker & Backup Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Box className="w-4 h-4 text-nexus-purple" /> État des Conteneurs Docker
            </h2>
            <span className="text-xs font-mono bg-dark-800 text-slate-300 px-3 py-1 rounded-full border border-dark-750">
              Total: {containers.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-nexus-emerald/10 border border-nexus-emerald/25 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-nexus-emerald font-extrabold uppercase flex items-center gap-1.5">
                  <span className="led-pulse-green" /> Actifs
                </span>
                <p className="text-2xl font-black text-white mt-1">{activeContainers}</p>
              </div>
            </div>
            <div className="p-4 bg-nexus-amber/10 border border-nexus-amber/25 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-nexus-amber font-extrabold uppercase flex items-center gap-1.5">
                  <span className="led-pulse-amber" /> Arrêtés
                </span>
                <p className="text-2xl font-black text-white mt-1">{stoppedContainers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-nexus-emerald" /> Statut Sauvegardes
            </h2>
            <span className="text-xs text-slate-400">
              {lastBackup ? new Date(lastBackup.started_at).toLocaleDateString() : 'Aucune'}
            </span>
          </div>

          {lastBackup ? (
            <div className="p-4 bg-dark-950/80 border border-dark-750 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{lastBackup.job_name}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                  lastBackup.status === 'SUCCESS' ? 'bg-nexus-emerald/20 text-nexus-emerald border border-nexus-emerald/30' : 'bg-nexus-rose/20 text-nexus-rose border border-nexus-rose/30'
                }`}>
                  {lastBackup.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Destination: <span className="font-mono text-slate-300">{lastBackup.destination}</span>
              </p>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 bg-dark-950/80 rounded-xl">
              Aucune tâche exécutée récemment.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
