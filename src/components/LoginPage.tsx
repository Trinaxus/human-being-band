import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { login as apiLogin } from '../lib/api';

type LoginPageProps = {
  onLoggedIn?: () => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoggedIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiLogin(username.trim(), password);
      onLoggedIn?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6 pt-12">
      <div className="w-full max-w-sm mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-1">Benutzername</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800/60 border border-neutral-700/40 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#8C1423]/40 focus:border-[#8C1423]/60 transition-colors"
              placeholder="Benutzername"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800/60 border border-neutral-700/40 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#8C1423]/40 focus:border-[#8C1423]/60 transition-colors"
              placeholder="Passwort"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2.5 text-sm font-medium rounded-lg text-white bg-[#8C1423] hover:bg-[#a0182a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;