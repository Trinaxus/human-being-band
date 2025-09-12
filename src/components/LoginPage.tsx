import React, { useState } from 'react';
import { TicketCheck, AlertCircle } from 'lucide-react';
import { login as apiLogin, register as apiRegister, twofaVerify, requestPasswordReset } from '../lib/api';

type LoginPageProps = {
  onLoggedIn?: () => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoggedIn }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [username, setUsername] = useState(''); // login: username oder E-Mail
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState(''); // register only
  const [email, setEmail] = useState(''); // register only
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOk, setResetOk] = useState<string | null>(null);
  // Supabase wird nicht mehr verwendet; keine DB-Connectivity-Prüfung nötig

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === 'login' && !needsTotp) {
      try {
        const res = await apiLogin(username.trim(), password);
        if (res?.require_totp) {
          setNeedsTotp(true);
          setError(null);
          return;
        }
        setError(null);
        onLoggedIn?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Login fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'login' && needsTotp) {
      // Verify TOTP code
      try {
        if (!totpCode.trim()) {
          setError('Bitte den 6-stelligen Code eingeben.');
          setLoading(false);
          return;
        }
        const res = await twofaVerify(totpCode.trim());
        if (res?.ok) {
          setError(null);
          onLoggedIn?.();
        } else {
          setError('Code ungültig.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Code ungültig');
      } finally {
        setLoading(false);
      }
    } else {
      // Registration flow
      if (password !== password2) {
        setError('Passwörter stimmen nicht überein.');
        return;
      }
      try {
        if (!name.trim()) {
          setError('Bitte Name eingeben.');
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Bitte E-Mail eingeben.');
          setLoading(false);
          return;
        }
        await apiRegister(name.trim(), email.trim(), password);
        setError(null);
        onLoggedIn?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registrierung fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetOk(null);
    setError(null);
    try {
      const mail = (resetEmail || username).trim();
      if (!mail) { setError('Bitte E-Mail eingeben.'); setLoading(false); return; }
      await requestPasswordReset(mail);
      setResetOk('Wenn ein Konto existiert, wurde ein Reset-Link gesendet.');
      setShowReset(false);
    } catch (e) {
      setResetOk('Wenn ein Konto existiert, wurde ein Reset-Link gesendet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4ECBD9]/10 mb-4 shadow-glow-cyan">
            <TicketCheck className="h-8 w-8 text-[#4ECBD9]" />
          </div>
          <p className="text-[#909296]">Bitte anmelden oder registrieren</p>
        </div>

        {/* Segmented control for mode */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex bg-neutral-700/40 border border-neutral-600/50 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('login')}
            aria-pressed={mode === 'login'}
            className={`px-4 py-2 text-sm transition-colors ${mode === 'login' ? 'bg-[#0d1718] text-[#4ECBD9] ring-1 ring-[#4ECBD9]/40' : 'text-neutral-300 hover:bg-neutral-600/40'}`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            aria-pressed={mode === 'register'}
            className={`px-4 py-2 text-sm transition-colors ${mode === 'register' ? 'bg-[#0d1718] text-[#4ECBD9] ring-1 ring-[#4ECBD9]/40' : 'text-neutral-300 hover:bg-neutral-600/40'}`}
          >
            Registrieren
          </button>
          </div>
        </div>

        <form id="login-form" onSubmit={handleLogin} className="bg-neutral-800/50 backdrop-blur-sm border-[0.1px] border-[#4ECBD9] rounded-xl p-6 space-y-4">
          {/* Social login */}
          <div>
            <a
              href="/server/api/oauth_google_start.php"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 text-neutral-100 border border-neutral-700 hover:bg-neutral-800"
            >
              <span>Mit Google anmelden</span>
            </a>
          </div>
          <div className="h-px bg-neutral-700/50" />
          {/* Hinweis-Block */}
          {error && (
            <div className="p-4 rounded-lg bg-[#F471B5]/10 border border-[#F471B5]/20 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-[#F471B5] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#F471B5]">{error}</p>
          </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-[#C1C2C5]">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700/50 border border-[#4ECBD9]/10 rounded-lg text-[#C1C2C5] placeholder-[#909296] focus:outline-none focus:ring-2 focus:ring-[#4ECBD9]/20 focus:border-transparent transition-colors"
                placeholder="Ihr Name"
                required
                disabled={loading}
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[#C1C2C5]">E-Mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700/50 border border-[#4ECBD9]/10 rounded-lg text-[#C1C2C5] placeholder-[#909296] focus:outline-none focus:ring-2 focus:ring-[#4ECBD9]/20 focus:border-transparent transition-colors"
                placeholder="name@example.com"
                required
                disabled={loading}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-[#C1C2C5]">Benutzername oder E-Mail</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700/50 border border-[#4ECBD9]/10 rounded-lg text-[#C1C2C5] placeholder-[#909296] focus:outline-none focus:ring-2 focus:ring-[#4ECBD9]/20 focus:border-transparent transition-colors"
                placeholder="Benutzername oder E-Mail"
                required
                disabled={loading}
              />
            </div>
          )}

          {!needsTotp && (
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[#C1C2C5]">Passwort</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700/50 border border-[#4ECBD9]/10 rounded-lg text-[#C1C2C5] placeholder-[#909296] focus:outline-none focus:ring-2 focus:ring-[#4ECBD9]/20 focus:border-transparent transition-colors"
                placeholder="Geben Sie Ihr Passwort ein"
                required
                disabled={loading}
              />
            </div>
          )}

          {needsTotp && (
            <div className="space-y-2">
              <label htmlFor="totp" className="block text-sm font-medium text-[#C1C2C5]">2FA Code</label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700/50 border border-[#4ECBD9]/10 rounded-lg text-[#C1C2C5] placeholder-[#909296] focus:outline-none focus:ring-2 focus:ring-[#4ECBD9]/20 focus:border-transparent transition-colors"
                placeholder="6-stelliger Code"
                required
                disabled={loading}
              />
              <p className="text-xs text-neutral-400">Bitte den 6-stelligen Code aus Google Authenticator eingeben.</p>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <label htmlFor="password2" className="block text-sm font-medium text-[#C1C2C5]">Passwort bestätigen</label>
              <input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700/50 border border-[#4ECBD9]/10 rounded-lg text-[#C1C2C5] placeholder-[#909296] focus:outline-none focus:ring-2 focus:ring-[#4ECBD9]/20 focus:border-transparent transition-colors"
                placeholder="Passwort wiederholen"
                required
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl text-[#C1C2C5] bg-[#4ECBD9]/10 border border-[#4ECBD9]/30 hover:bg-[#4ECBD9]/20 hover:border-[#4ECBD9]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4ECBD9]/10 disabled:hover:border-[#4ECBD9]/30"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#4ECBD9]/30 border-t-[#4ECBD9] rounded-full animate-spin" />
            ) : (
              mode === 'login' ? (needsTotp ? 'Bestätigen' : 'Anmelden') : 'Registrieren'
            )}
          </button>
          {/* Hinweis entfernt */}
        </form>
        <div className="mt-3 space-y-2">
          {!showReset ? (
            <button type="button" onClick={() => setShowReset(true)} className="text-xs text-neutral-300 hover:text-white underline">Passwort vergessen?</button>
          ) : (
            <form onSubmit={handleRequestReset} className="p-3 rounded-lg bg-neutral-900/60 border-[0.5px] border-neutral-700/30 space-y-2">
              <div className="text-xs text-neutral-300">Gib deine E‑Mail ein. Wenn ein Konto existiert, senden wir dir einen Link.</div>
              <input
                type="email"
                value={resetEmail}
                onChange={(e)=> setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button type="submit" disabled={loading} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-100 hover:bg-neutral-800 disabled:opacity-60">Link senden</button>
                <button type="button" onClick={()=> setShowReset(false)} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Abbrechen</button>
              </div>
            </form>
          )}
          {resetOk && <div className="text-xs text-[#4ECBD9]">{resetOk}</div>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;