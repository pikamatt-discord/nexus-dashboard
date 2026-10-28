import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Filter,
  RefreshCw,
  Info,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?limit=100');
      setEvents(res.data);
    } catch {
      // Degraded handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.user && e.user.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = levelFilter === 'all' || e.level === levelFilter;
    const matchesSource = sourceFilter === 'all' || e.source === sourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-nexus-rose/15 text-nexus-rose border border-nexus-rose/30">
            <XCircle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-nexus-amber/15 text-nexus-amber border border-nexus-amber/30">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-nexus-blue/15 text-nexus-blue border border-nexus-blue/30">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  if (loading && events.length === 0) {
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
          <h1 className="text-2xl font-bold text-white tracking-wide">Journal d'Événements & Audit</h1>
          <p className="text-sm text-slate-400">
            Historique des actions de sécurité, conteneurs, sauvegardes et système
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 hover:border-nexus-purple text-slate-300 hover:text-white rounded-xl text-sm transition"
        >
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un mot clé ou utilisateur..."
            className="w-full bg-dark-800 border border-dark-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-nexus-purple transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-nexus-purple"
            >
              <option value="all">Tous les niveaux</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-nexus-purple"
          >
            <option value="all">Toutes les sources</option>
            <option value="AUTH">AUTH</option>
            <option value="CONTAINER">CONTAINER</option>
            <option value="BACKUP">BACKUP</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-900/50 text-slate-400 text-xs uppercase font-semibold border-b border-dark-700">
              <tr>
                <th className="p-4">Horodatage</th>
                <th className="p-4">Niveau</th>
                <th className="p-4">Source</th>
                <th className="p-4">Message</th>
                <th className="p-4">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-dark-700/30 transition">
                  <td className="p-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">{getLevelBadge(evt.level)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-dark-700 text-slate-300 rounded text-xs font-mono">
                      {evt.source}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-white font-medium max-w-xl">
                    {evt.message}
                  </td>
                  <td className="p-4 text-xs text-slate-400 font-mono">
                    {evt.user || 'system'}
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Aucun événement d'audit ne correspond à vos critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
