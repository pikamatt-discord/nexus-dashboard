import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  Folder,
  FileText,
  ChevronRight,
  ArrowLeft,
  Search,
  RefreshCw,
  X,
  Eye,
  Copy,
  Check
} from 'lucide-react';

export const Files: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/app');
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileModal, setFileModal] = useState<{ open: boolean; name: string; content: string }>({
    open: false,
    name: '',
    content: '',
  });

  const fetchDirectory = async (path: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/files/browse?path=${encodeURIComponent(path)}`);
      setFileData(res.data);
      setCurrentPath(res.data.current_path);
    } catch {
      // Fallback or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(currentPath);
  }, []);

  const handleOpenFile = async (item: any) => {
    if (item.is_dir) {
      fetchDirectory(item.path);
    } else {
      try {
        const res = await api.get(`/files/content?path=${encodeURIComponent(item.path)}`);
        setFileModal({
          open: true,
          name: item.name,
          content: res.data.content || 'Fichier vide.',
        });
      } catch (err: any) {
        setFileModal({
          open: true,
          name: item.name,
          content: err.response?.data?.detail || "Impossible de lire le contenu du fichier.",
        });
      }
    }
  };

  const handleCopyContent = () => {
    if (fileModal.content) {
      navigator.clipboard.writeText(fileModal.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredItems = fileData?.items?.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const pathParts = currentPath.split('/').filter(Boolean);

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
          <h1 className="text-2xl font-black text-white tracking-wide">Gestionnaire de Fichiers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Explorateur de répertoires système et visionneuse de code/fichiers
          </p>
        </div>
        <button
          onClick={() => fetchDirectory(currentPath)}
          className="flex items-center gap-2 px-4 py-2 bg-dark-900 border border-dark-700/80 hover:border-nexus-purple text-slate-300 hover:text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-glow-purple"
        >
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {/* Breadcrumb & Controls */}
      <div className="p-4 glass-panel space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono overflow-x-auto">
          <button
            onClick={() => fetchDirectory(fileData?.parent_path || '/')}
            disabled={currentPath === '/'}
            className="p-1.5 bg-dark-800 hover:bg-dark-700 rounded-lg disabled:opacity-30 text-white transition border border-dark-700"
            title="Dossier parent"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => fetchDirectory('/')}
            className="hover:text-nexus-purple font-bold text-sm"
          >
            /
          </button>

          {pathParts.map((part, idx) => {
            const pathAcc = '/' + pathParts.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={pathAcc}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <button
                  onClick={() => fetchDirectory(pathAcc)}
                  className="hover:text-nexus-purple text-xs"
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les fichiers du dossier courant..."
            className="w-full bg-dark-950/60 border border-dark-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-nexus-purple transition"
          />
        </div>
      </div>

      {/* File Browser Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-950/60 text-slate-400 text-[11px] uppercase font-bold border-b border-dark-700/80">
              <tr>
                <th className="p-4">Nom</th>
                <th className="p-4">Taille</th>
                <th className="p-4">Modifié le</th>
                <th className="p-4">Permissions</th>
                <th className="p-4 text-right">Aperçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-nexus-purple mx-auto mb-2" />
                    Chargement du répertoire...
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr
                    key={item.path}
                    onClick={() => handleOpenFile(item)}
                    className="hover:bg-dark-800/60 cursor-pointer transition font-mono"
                  >
                    <td className="p-4 font-semibold text-white flex items-center gap-3">
                      {item.is_dir ? (
                        <Folder className="w-5 h-5 text-nexus-purple flex-shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-nexus-blue flex-shrink-0" />
                      )}
                      <span>{item.name}</span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {formatBytes(item.size_bytes)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(item.modified_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-400">
                      {item.permissions}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFile(item);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Ce répertoire est vide ou aucun fichier ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Preview Modal */}
      {fileModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-dark-950/80 border-b border-dark-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-nexus-purple" />
                <h2 className="font-bold text-white text-sm truncate">{fileModal.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-800 border border-dark-700 hover:border-nexus-blue text-xs text-slate-300 rounded-xl transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-nexus-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={() => setFileModal({ open: false, name: '', content: '' })}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-dark-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {fileModal.content}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
