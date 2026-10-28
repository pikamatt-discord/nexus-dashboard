import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Server, Lock, User, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', usernameInput);
      formData.append('password', passwordInput);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      login(res.data.access_token, usernameInput);
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Erreur de connexion au serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Glow backdrop decorative effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-nexus-purple/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-nexus-blue/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-nexus-purple to-nexus-blue rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-nexus-purple/20">
            <Server className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">NEXUS DASHBOARD</h1>
          <p className="text-slate-400 text-sm mt-1">Console d'administration serveur Ubuntu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-nexus-rose/10 border border-nexus-rose/30 rounded-xl flex items-center gap-3 text-nexus-rose text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Ex: admin"
                className="w-full bg-dark-900/80 border border-dark-600 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-nexus-purple transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900/80 border border-dark-600 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-nexus-purple transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-nexus-purple to-nexus-blue hover:from-nexus-purpleDark hover:to-nexus-blueDark text-white font-semibold rounded-xl transition shadow-lg shadow-nexus-purple/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Accès restreint au réseau local (LAN) • V1.0
        </div>
      </div>
    </div>
  );
};
