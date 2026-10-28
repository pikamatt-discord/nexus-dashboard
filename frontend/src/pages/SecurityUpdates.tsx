import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  RefreshCw,
  Power,
  Activity,
  CheckCircle2
} from 'lucide-react';

export const SecurityUpdates: React.FC = () => {
  const [audit, setAudit] = useState<any>(null);
  const [updates, setUpdates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [powerModal, setPowerModal] = useState<{ open: boolean; action: 'reboot' | 'shutdown' | '' }>({
    open: false,
    action: '',
  });
  const [powerLoading, setPowerLoading] = useState(false);
  const [powerSuccess, setPowerSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditRes, updatesRes] = await Promise.all([
        api.get('/system/security-audit'),
        api.get('/system/updates'),
      ]);
      setAudit(auditRes.data);
      setUpdates(updatesRes.data);
    } catch {
      setError("Impossible de charger les données de sécurité et de mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePowerAction = async () => {
    if (!powerModal.action) return;
    setPowerLoading(true);
    try {
      const res = await api.post('/system/power', { action: powerModal.action });
      setPowerSuccess(res.data.message);
      setPowerModal({ open: false, action: '' });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Échec de l'action d'alimentation.");
    } finally {
      setPowerLoading(false);
    }
  };

  if (loading && !audit) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-nexus-purple" />
        <p className="text-sm font-medium animate-pulse">Analyse de la sécurité du serveur...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-nexus-purple" /> Sécurité & Mises à Jour
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit des vulnérabilités, paquets APT et gestion de l'alimentation serveur
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPowerModal({ open: true, action: 'reboot' })}
            className="flex items-center gap-2 px-3.5 py-2 bg-nexus-amber/15 text-nexus-amber border border-nexus-amber/30 hover:bg-nexus-amber/25 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" /> Redémarrer
          </button>
          <button
            onClick={() => setPowerModal({ open: true, action: 'shutdown' })}
            className="flex items-center gap-2 px-3.5 py-2 bg-nexus-rose/15 text-nexus-rose border border-nexus-rose/30 hover:bg-nexus-rose/25 rounded-xl text-xs font-semibold transition"
          >
            <Power className="w-4 h-4" /> Éteindre
          </button>
        </div>
      </div>

      {powerSuccess && (
        <div className="p-4 bg-nexus-emerald/10 border border-nexus-emerald/30 rounded-xl flex items-center gap-3 text-nexus-emerald text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{powerSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-nexus-rose/10 border border-nexus-rose/30 rounded-xl flex items-center gap-3 text-nexus-rose text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Security Score KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score de Sécurité</span>
            <div className={`text-3xl font-extrabold mt-1 ${
              audit?.security_score >= 80 ? 'text-nexus-emerald' : audit?.security_score >= 60 ? 'text-nexus-amber' : 'text-nexus-rose'
            }`}>
              {audit?.security_score ?? 0} / 100
            </div>
          </div>
          <div className="p-3 bg-nexus-purple/15 text-nexus-purple rounded-xl border border-nexus-purple/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alertes Sécurité</span>
            <div className="text-3xl font-extrabold text-nexus-amber mt-1">
              {audit?.vulnerability_count ?? 0}
            </div>
          </div>
          <div className="p-3 bg-nexus-amber/15 text-nexus-amber rounded-xl border border-nexus-amber/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mises à jour APT</span>
            <div className="text-3xl font-extrabold text-nexus-blue mt-1">
              {updates?.total_upgradable ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              dont <strong className="text-nexus-rose">{updates?.security_updates_count ?? 0}</strong> de sécurité
            </p>
          </div>
          <div className="p-3 bg-nexus-blue/15 text-nexus-blue rounded-xl border border-nexus-blue/30">
            <Download className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Security Audit Details & Listening Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerabilities List */}
        <div className="p-6 glass-card space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-nexus-rose" /> Vulnérabilités & Alertes
          </h2>

          <div className="space-y-3">
            {audit?.vulnerabilities?.map((item: any, idx: number) => (
              <div key={idx} className="p-4 bg-nexus-rose/10 border border-nexus-rose/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{item.title}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-nexus-rose/20 text-nexus-rose rounded">
                    {item.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{item.description}</p>
              </div>
            ))}
            {audit?.vulnerabilities?.length === 0 && (
              <div className="p-6 text-center text-xs text-nexus-emerald bg-nexus-emerald/10 border border-nexus-emerald/30 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Aucune vulnérabilité majeure détectée.
              </div>
            )}
          </div>
        </div>

        {/* Listening Network Ports */}
        <div className="p-6 glass-card space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-nexus-cyan" /> Ports Réseau en Écoute
          </h2>

          <div className="space-y-2">
            {audit?.listening_ports?.map((p: any, idx: number) => (
              <div key={idx} className="p-3 bg-dark-950/60 border border-dark-700 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">Port {p.port}</span>
                <span className="text-slate-400">{p.ip}</span>
                <span className="text-nexus-blue">PID: {p.pid || 'System'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgradable APT Packages List */}
      <div className="p-6 glass-card space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Download className="w-4 h-4 text-nexus-blue" /> Paquets Système Disponibles pour Mise à Jour (APT)
        </h2>

        <div className="divide-y divide-dark-700/60">
          {updates?.packages?.map((pkg: any, idx: number) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white font-mono">{pkg.package}</span>
                <p className="text-slate-400 font-mono text-[11px]">{pkg.details}</p>
              </div>
              {pkg.is_security ? (
                <span className="px-2.5 py-1 bg-nexus-rose/15 text-nexus-rose border border-nexus-rose/30 rounded-full font-bold text-[10px]">
                  Sécurité
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-dark-800 text-slate-400 border border-dark-700 rounded-full text-[10px]">
                  Mise à jour standard
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Power Action Confirmation Modal */}
      {powerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-nexus-rose">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-lg text-white">Confirmation d'Alimentation</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Êtes-vous absolument sûr de vouloir{' '}
              <strong className="text-nexus-rose uppercase">
                {powerModal.action === 'reboot' ? 'redémarrer' : 'éteindre'}
              </strong>{' '}
              le serveur Ubuntu hôte ? L'accès au dashboard sera interrompu pendant l'action.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPowerModal({ open: false, action: '' })}
                className="px-4 py-2 bg-dark-700 text-slate-300 hover:text-white rounded-xl text-sm transition"
              >
                Annuler
              </button>
              <button
                onClick={handlePowerAction}
                disabled={powerLoading}
                className="px-4 py-2 bg-nexus-rose hover:bg-nexus-rose/80 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {powerLoading ? 'Exécution...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
