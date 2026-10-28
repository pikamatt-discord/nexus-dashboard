import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  Box,
  Play,
  Square,
  RotateCw,
  FileText,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  RefreshCw,
  X,
  Copy,
  Check
} from 'lucide-react';

export const Containers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'containers' | 'stacks'>('containers');
  const [containers, setContainers] = useState<any[]>([]);
  const [stacks, setStacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Logs modal
  const [logModal, setLogModal] = useState<{ open: boolean; containerName: string; logs: string }>({
    open: false,
    containerName: '',
    logs: '',
  });

  // Action Confirmation modal
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    containerId: string;
    containerName: string;
    action: string;
  }>({
    open: false,
    containerId: '',
    containerName: '',
    action: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [cRes, sRes] = await Promise.all([
        api.get('/containers'),
        api.get('/containers/stacks'),
      ]);
      setContainers(cRes.data);
      setStacks(sRes.data);
    } catch {
      setError("Erreur lors de la récupération des données Portainer / Docker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenLogs = async (container: any) => {
    try {
      const res = await api.get(`/containers/${container.id}/logs?tail=200`);
      setLogModal({
        open: true,
        containerName: container.name,
        logs: res.data.logs || 'Aucun journal disponible.',
      });
    } catch {
      setLogModal({
        open: true,
        containerName: container.name,
        logs: 'Erreur lors du chargement des journaux.',
      });
    }
  };

  const handleCopyLogs = () => {
    if (logModal.logs) {
      navigator.clipboard.writeText(logModal.logs);
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionModal.containerId || !actionModal.action) return;
    setActionLoading(true);
    try {
      await api.post(`/containers/${actionModal.containerId}/action`, {
        action: actionModal.action,
      });
      setActionModal({ open: false, containerId: '', containerName: '', action: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Échec de l'action sur le conteneur.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredContainers = containers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.stack.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = stateFilter === 'all' || c.state === stateFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading && containers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-nexus-purple" />
        <p className="text-sm font-medium animate-pulse">Chargement des conteneurs Portainer...</p>
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
          <h1 className="text-2xl font-black text-white tracking-wide">Gestion Docker & Portainer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Superviser, inspecter les logs et contrôler vos conteneurs et stacks
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

      {/* Tabs */}
      <div className="flex border-b border-dark-750 gap-6">
        <button
          onClick={() => setActiveTab('containers')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'containers'
              ? 'border-nexus-purple text-nexus-purple font-extrabold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-4 h-4" /> Conteneurs ({containers.length})
        </button>
        <button
          onClick={() => setActiveTab('stacks')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'stacks'
              ? 'border-nexus-purple text-nexus-purple font-extrabold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Stacks Portainer ({stacks.length})
        </button>
      </div>

      {activeTab === 'containers' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, image ou stack..."
                className="w-full bg-dark-950/70 border border-dark-750 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-nexus-purple transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-dark-950/70 border border-dark-750 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-nexus-purple"
              >
                <option value="all">Tous les états</option>
                <option value="running">Actifs (running)</option>
                <option value="exited">Arrêtés (exited)</option>
                <option value="paused">En pause</option>
              </select>
            </div>
          </div>

          {/* Containers Table */}
          <div className="glass-panel overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-950/80 text-slate-400 text-[11px] uppercase font-extrabold border-b border-dark-750">
                  <tr>
                    <th className="p-4">Conteneur</th>
                    <th className="p-4">État & Statut</th>
                    <th className="p-4">Image</th>
                    <th className="p-4">Ports Publiés</th>
                    <th className="p-4">Stack</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-750/60">
                  {filteredContainers.map((c) => (
                    <tr key={c.id} className="hover:bg-dark-800/60 transition">
                      <td className="p-4 font-mono">
                        <div className="font-extrabold text-white text-sm">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.id}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            c.state === 'running'
                              ? 'bg-nexus-emerald/15 text-nexus-emerald border border-nexus-emerald/30 shadow-glow-emerald'
                              : 'bg-nexus-amber/15 text-nexus-amber border border-nexus-amber/30'
                          }`}
                        >
                          <span className={c.state === 'running' ? 'led-pulse-green' : 'led-pulse-amber'} />
                          {c.state}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">{c.status}</p>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-300 max-w-xs truncate">
                        {c.image}
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-300">
                        {c.ports && c.ports.length > 0 ? (
                          c.ports.map((p: string, idx: number) => (
                            <span key={idx} className="block text-nexus-blue font-bold">
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">Aucun port</span>
                        )}
                      </td>
                      <td className="p-4 text-xs">
                        <span className="px-2.5 py-1 bg-dark-800 border border-dark-700 rounded text-slate-300 font-mono">
                          {c.stack}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenLogs(c)}
                            title="Voir les journaux (logs)"
                            className="p-2 text-slate-400 hover:text-nexus-blue hover:bg-dark-750 rounded-xl transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {c.state === 'running' ? (
                            <>
                              <button
                                onClick={() =>
                                  setActionModal({
                                    open: true,
                                    containerId: c.id,
                                    containerName: c.name,
                                    action: 'restart',
                                  })
                                }
                                title="Redémarrer"
                                className="p-2 text-slate-400 hover:text-nexus-amber hover:bg-dark-750 rounded-xl transition"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setActionModal({
                                    open: true,
                                    containerId: c.id,
                                    containerName: c.name,
                                    action: 'stop',
                                  })
                                }
                                title="Arrêter"
                                className="p-2 text-slate-400 hover:text-nexus-rose hover:bg-dark-750 rounded-xl transition"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                setActionModal({
                                  open: true,
                                  containerId: c.id,
                                  containerName: c.name,
                                  action: 'start',
                                })
                              }
                              title="Démarrer"
                              className="p-2 text-slate-400 hover:text-nexus-emerald hover:bg-dark-750 rounded-xl transition"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredContainers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Aucun conteneur ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stacks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stacks.map((stack) => (
            <div key={stack.id} className="p-5 glass-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-nexus-purple" /> {stack.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 bg-nexus-emerald/15 text-nexus-emerald border border-nexus-emerald/30 rounded font-bold">
                  {stack.status || 'Actif'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Type: <span className="font-mono text-slate-300">{stack.type || 'Docker Compose'}</span>
              </p>
              <div className="pt-2 border-t border-dark-750 flex items-center justify-between text-xs text-slate-400">
                <span>Conteneurs associés:</span>
                <span className="font-extrabold text-white font-mono">{stack.containers || 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Modal */}
      {logModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-dark-900 border border-dark-750 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-dark-950/80 border-b border-dark-750 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-nexus-blue" />
                <h2 className="font-bold text-white text-sm">
                  Journaux Docker: <span className="text-nexus-purple font-mono">{logModal.containerName}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-800 border border-dark-700 hover:border-nexus-blue text-xs text-slate-300 rounded-xl transition"
                >
                  {copiedLogs ? <Check className="w-3.5 h-3.5 text-nexus-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLogs ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={() => setLogModal({ open: false, containerName: '', logs: '' })}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-dark-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {logModal.logs}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal Confirmation */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-dark-900 border border-dark-750 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-nexus-amber">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-lg text-white">Confirmation Requise</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Voulez-vous vraiment exécuter l'action <strong className="text-nexus-purple uppercase">{actionModal.action}</strong> sur le conteneur <strong className="text-white font-mono">{actionModal.containerName}</strong> ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal({ open: false, containerId: '', containerName: '', action: '' })}
                className="px-4 py-2 bg-dark-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="px-4 py-2 bg-nexus-purple hover:bg-nexus-purpleDark text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-glow-purple disabled:opacity-50"
              >
                {actionLoading ? 'Exécution...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
