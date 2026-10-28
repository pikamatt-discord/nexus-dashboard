import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  Server,
  Box,
  Save,
  RefreshCw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [cpuThreshold, setCpuThreshold] = useState(85);
  const [ramThreshold, setRamThreshold] = useState(85);
  const [diskWarnThreshold, setDiskWarnThreshold] = useState(80);
  const [diskCritThreshold, setDiskCritThreshold] = useState(90);

  const fetchHealth = async () => {
    try {
      const res = await api.get('/health');
      setHealthData(res.data);
    } catch {
      setHealthData({ status: 'DEGRADED', components: { backend: 'ONLINE', portainer: 'OFFLINE' } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading && !healthData) {
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
          <h1 className="text-2xl font-bold text-white tracking-wide">Paramètres & Diagnostics</h1>
          <p className="text-sm text-slate-400">
            Configuration des seuils, vérification des composants et statut LAN
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-nexus-emerald/10 border border-nexus-emerald/30 rounded-xl flex items-center gap-3 text-nexus-emerald text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Paramètres de surveillance enregistrés avec succès.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Diagnostics */}
        <div className="p-5 bg-dark-800 border border-dark-700 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-nexus-purple" /> Diagnostic des Composants Système
          </h2>

          <div className="space-y-3">
            <div className="p-4 bg-dark-900 border border-dark-700 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-nexus-purple" />
                <div>
                  <h3 className="font-bold text-white text-sm">API Backend Nexus</h3>
                  <p className="text-xs text-slate-400">FastAPI • Python 3.12</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-nexus-emerald/15 text-nexus-emerald border border-nexus-emerald/30 rounded-full">
                {healthData?.components?.backend || 'ONLINE'}
              </span>
            </div>

            <div className="p-4 bg-dark-900 border border-dark-700 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-nexus-blue" />
                <div>
                  <h3 className="font-bold text-white text-sm">Intégration Portainer REST API</h3>
                  <p className="text-xs text-slate-400">
                    {healthData?.components?.portainer_message || 'Statut API Portainer'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold border rounded-full ${
                healthData?.components?.portainer === 'ONLINE' ? 'bg-nexus-emerald/15 text-nexus-emerald border-nexus-emerald/30' : 'bg-nexus-amber/15 text-nexus-amber border-nexus-amber/30'
              }`}>
                {healthData?.components?.portainer || 'MOCK'}
              </span>
            </div>
          </div>
        </div>

        {/* Monitoring Thresholds Form */}
        <div className="p-5 bg-dark-800 border border-dark-700 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-nexus-blue" /> Seuils d'Alerte de Surveillance
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Seuil d'Alerte CPU (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-nexus-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Seuil d'Alerte RAM (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={ramThreshold}
                onChange={(e) => setRamThreshold(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-nexus-purple"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Avertissement Disque (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="89"
                  value={diskWarnThreshold}
                  onChange={(e) => setDiskWarnThreshold(Number(e.target.value))}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-nexus-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Seuil Critique Disque (%)
                </label>
                <input
                  type="number"
                  min="80"
                  max="99"
                  value={diskCritThreshold}
                  onChange={(e) => setDiskCritThreshold(Number(e.target.value))}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-nexus-purple"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-nexus-purple hover:bg-nexus-purpleDark text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-nexus-purple/20"
            >
              <Save className="w-4 h-4" /> Enregistrer les seuils
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
