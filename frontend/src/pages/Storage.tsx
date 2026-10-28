import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  HardDrive,
  RefreshCw,
  Info
} from 'lucide-react';

export const Storage: React.FC = () => {
  const [mounts, setMounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStorage = async () => {
    try {
      const res = await api.get('/storage/mounts');
      setMounts(res.data);
    } catch {
      // Degraded state handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading && mounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-nexus-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Stockage & Volumes</h1>
          <p className="text-sm text-slate-400">
            Espace disque, points de montage et seuils d'alerte
          </p>
        </div>
        <button
          onClick={fetchStorage}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-nexus-purple text-slate-300 hover:text-white rounded-xl text-sm transition"
        >
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* Mount Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mounts.map((mount) => {
          let progressBg = "bg-nexus-emerald";
          let badgeStyle = "bg-nexus-emerald/15 text-nexus-emerald border-nexus-emerald/30";

          if (mount.status === "CRITICAL") {
            progressBg = "bg-nexus-rose";
            badgeStyle = "bg-nexus-rose/15 text-nexus-rose border-nexus-rose/30";
          } else if (mount.status === "WARNING") {
            progressBg = "bg-nexus-amber";
            badgeStyle = "bg-nexus-amber/15 text-nexus-amber border-nexus-amber/30";
          }

          return (
            <div key={mount.mountpoint} className="p-6 bg-dark-800 border border-dark-700 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-dark-700 rounded-xl">
                    <HardDrive className="w-6 h-6 text-nexus-purple" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">{mount.mountpoint}</h2>
                    <span className="text-xs text-slate-400 font-mono">{mount.device} ({mount.fstype})</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${badgeStyle}`}>
                  {mount.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase">Occupation</span>
                  <span className="font-bold text-white">{mount.percent}%</span>
                </div>
                <div className="w-full h-3 bg-dark-900 rounded-full overflow-hidden p-0.5 border border-dark-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressBg}`}
                    style={{ width: `${mount.percent}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-dark-700/60">
                <span>Utilisé: <strong className="text-white">{formatBytes(mount.used_bytes)}</strong></span>
                <span>Disponible: <strong className="text-white">{formatBytes(mount.free_bytes)}</strong></span>
                <span>Total: <strong className="text-white">{formatBytes(mount.total_bytes)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Card */}
      <div className="p-5 bg-dark-800/80 border border-dark-700 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-nexus-blue flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-bold text-white">Sécurité du stockage en V1</p>
          <p>
            Les seuils d'avertissement (80%) et critique (90%) sont appliqués automatiquement. Conformément aux exigences de sécurité, la suppression de volumes ou de partitions depuis cette interface web est désactivée en V1 afin de prévenir toute perte involontaire de données.
          </p>
        </div>
      </div>
    </div>
  );
};
