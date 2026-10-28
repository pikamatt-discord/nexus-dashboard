import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Network,
  ArrowDownRight,
  ArrowUpRight,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity
} from 'lucide-react';

export const NetworkView: React.FC = () => {
  const [networkData, setNetworkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pingName, setPingName] = useState('Portainer Local');
  const [pingUrl, setPingUrl] = useState('http://localhost:9000');
  const [pingResult, setPingResult] = useState<any>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const fetchNetwork = async () => {
    try {
      const res = await api.get('/network/interfaces');
      setNetworkData(res.data);
    } catch {
      // Degraded state handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await api.post('/network/ping', {
        name: pingName,
        url: pingUrl
      });
      setPingResult(res.data);
    } catch (err: any) {
      setPingResult({
        target: pingName,
        url: pingUrl,
        reachable: false,
        error: "Erreur de connexion au serveur backend"
      });
    } finally {
      setPingLoading(false);
    }
  };

  const formatRate = (bytesPerSec: number) => {
    if (!bytesPerSec) return '0 B/s';
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(1)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  if (loading && !networkData) {
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
          <h1 className="text-2xl font-bold text-white tracking-wide">Réseau & Connectivité</h1>
          <p className="text-sm text-slate-400">
            Interfaces réseau locales et diagnostics de dépendances
          </p>
        </div>
        <button
          onClick={fetchNetwork}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-nexus-purple text-slate-300 hover:text-white rounded-xl text-sm transition"
        >
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* Traffic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-dark-800 border border-dark-700 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Débit Entrant (Download)</span>
            <div className="text-3xl font-bold text-nexus-emerald mt-1">
              {formatRate(networkData?.bytes_recv_per_sec)}
            </div>
          </div>
          <div className="p-3 bg-nexus-emerald/15 text-nexus-emerald rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-dark-800 border border-dark-700 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Débit Sortant (Upload)</span>
            <div className="text-3xl font-bold text-nexus-blue mt-1">
              {formatRate(networkData?.bytes_sent_per_sec)}
            </div>
          </div>
          <div className="p-3 bg-nexus-blue/15 text-nexus-blue rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interfaces & Ping Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Interfaces */}
        <div className="p-5 bg-dark-800 border border-dark-700 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
            <Network className="w-4 h-4 text-nexus-purple" /> Interfaces Réseau Détectées
          </h2>

          <div className="space-y-3">
            {networkData?.interfaces?.map((iface: any) => (
              <div key={iface.name} className="p-4 bg-dark-900/80 border border-dark-700 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-white text-sm">{iface.name}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {iface.addresses.map((addr: string, idx: number) => (
                      <span key={idx} className="text-xs font-mono text-slate-400 bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
                        {addr}
                      </span>
                    ))}
                  </div>
                </div>
                <Globe className="w-5 h-5 text-slate-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Dependency Availability Tester */}
        <div className="p-5 bg-dark-800 border border-dark-700 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-nexus-blue" /> Test de Disponibilité Dépendances
          </h2>

          <form onSubmit={handlePing} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nom du service</label>
              <input
                type="text"
                value={pingName}
                onChange={(e) => setPingName(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-nexus-purple"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">URL cible (ex: http://localhost:9000)</label>
              <input
                type="url"
                value={pingUrl}
                onChange={(e) => setPingUrl(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-nexus-purple"
                required
              />
            </div>
            <button
              type="submit"
              disabled={pingLoading}
              className="w-full py-2.5 bg-nexus-blue hover:bg-nexus-blueDark text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {pingLoading ? 'Vérification...' : 'Tester la connexion'}
            </button>
          </form>

          {pingResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              pingResult.reachable ? 'bg-nexus-emerald/10 border-nexus-emerald/30 text-nexus-emerald' : 'bg-nexus-rose/10 border-nexus-rose/30 text-nexus-rose'
            }`}>
              {pingResult.reachable ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold">{pingResult.target}: {pingResult.reachable ? 'Joignable' : 'Inaccessible'}</p>
                <p className="font-mono text-slate-300">{pingResult.url}</p>
                {pingResult.status_code && <p>Code HTTP: {pingResult.status_code}</p>}
                {pingResult.error && <p className="text-nexus-rose font-medium">{pingResult.error}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
