import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldCheck,
  Play,
  History,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  X,
  FileCheck
} from 'lucide-react';

export const Backups: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [jobsRes, historyRes] = await Promise.all([
        api.get('/backups/jobs'),
        api.get('/backups/history?limit=10')
      ]);
      setJobs(jobsRes.data);
      setHistory(historyRes.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunJob = async (jobId: string) => {
    setRunningJob(jobId);
    try {
      await api.post(`/backups/jobs/${jobId}/run`);
      await fetchData();
    } catch {
      // Error handling
    } finally {
      setRunningJob(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading && jobs.length === 0) {
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
          <h1 className="text-2xl font-bold text-white tracking-wide">Sauvegardes & Restauration</h1>
          <p className="text-sm text-slate-400">
            Tâches de sauvegarde encadrées et historique d'exécution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRestoreModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-nexus-blue text-nexus-blue rounded-xl text-sm transition"
          >
            <HelpCircle className="w-4 h-4" /> Guide de Restauration
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-nexus-purple text-slate-300 hover:text-white rounded-xl text-sm transition"
          >
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Predefined Backup Jobs Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-nexus-purple" /> Tâches de Sauvegarde Prédéfinies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-5 bg-dark-800 border border-dark-700 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="font-bold text-white text-base">{job.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{job.description}</p>
                <p className="text-xs font-mono text-slate-500 bg-dark-900 p-2 rounded">
                  Destination: {job.destination}
                </p>
              </div>

              <button
                onClick={() => handleRunJob(job.id)}
                disabled={runningJob === job.id}
                className="w-full py-2.5 bg-nexus-purple hover:bg-nexus-purpleDark text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {runningJob === job.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Execution en cours...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Lancer la sauvegarde
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Execution History */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase text-slate-300 flex items-center gap-2">
          <History className="w-4 h-4 text-nexus-blue" /> Historique des Exécutions
        </h2>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900/50 text-slate-400 text-xs uppercase font-semibold border-b border-dark-700">
                <tr>
                  <th className="p-4">Tâche</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date & Heure</th>
                  <th className="p-4">Durée</th>
                  <th className="p-4">Taille</th>
                  <th className="p-4">Intégrité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-dark-700/30 transition">
                    <td className="p-4 font-semibold text-white">{record.job_name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        record.status === 'SUCCESS' ? 'bg-nexus-emerald/15 text-nexus-emerald border border-nexus-emerald/30' : 'bg-nexus-rose/15 text-nexus-rose border border-nexus-rose/30'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-300 font-mono">
                      {record.started_at ? new Date(record.started_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-xs text-slate-300 font-mono">
                      {record.duration_seconds ? `${record.duration_seconds}s` : 'N/A'}
                    </td>
                    <td className="p-4 text-xs text-slate-300 font-mono">
                      {formatBytes(record.size_bytes)}
                    </td>
                    <td className="p-4">
                      {record.integrity_verified ? (
                        <span className="flex items-center gap-1 text-xs text-nexus-emerald font-semibold">
                          <FileCheck className="w-4 h-4" /> Vérifiée
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Non vérifiée</span>
                      )}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucune donnée d'historique de sauvegarde.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Restore Guide Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-700 pb-3">
              <h2 className="font-bold text-white text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-nexus-purple" /> Procédure de Restauration
              </h2>
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-nexus-amber/10 border border-nexus-amber/30 rounded-xl text-nexus-amber flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  Conformément au cahier des charges, la restauration destructive est exclue de l'IHM web V1 pour prévenir tout écrasement involontaire en production.
                </span>
              </div>

              <p className="font-semibold text-white">Étapes de restauration manuelle vérifiée :</p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-400 font-mono">
                <li>Se connecter au serveur Ubuntu via SSH.</li>
                <li>Arrêter temporairement les conteneurs impactés (<code className="text-nexus-purple">docker compose down</code>).</li>
                <li>Localiser le répertoire de sauvegarde cible dans <code className="text-nexus-blue">/var/backups/nexus/</code>.</li>
                <li>Restaurer les fichiers ou la base de données SQLite snapshot.</li>
                <li>Redémarrer les services et vérifier les journaux d'audit dans la console Nexus.</li>
              </ol>

              <p className="text-slate-500 text-[11px] pt-2">
                Pour des instructions complètes, consultez la documentation officielle <code className="text-slate-300">docs/RESTORE_TEST.md</code>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 bg-nexus-purple hover:bg-nexus-purpleDark text-white text-xs font-semibold rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
