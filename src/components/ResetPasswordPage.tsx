import React, { useMemo, useState } from 'react';
import { confirmPasswordReset } from '../lib/api';

type Props = {
  onDone?: () => void;
};

const ResetPasswordPage: React.FC<Props> = ({ onDone }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEmail = params.get('email') || '';
  const token = params.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !token.trim()) { setError('Ungültiger Link.'); return; }
    if (pw1.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return; }
    if (pw1 !== pw2) { setError('Passwörter stimmen nicht überein.'); return; }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await confirmPasswordReset(email.trim(), token.trim(), pw1);
      setOk('Passwort wurde geändert. Du kannst dich jetzt anmelden.');
      setTimeout(() => onDone?.(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Zurücksetzen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full px-6">
      <div className="w-full max-w-md mx-auto">
        <section className="rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/20 p-5 space-y-3">
          <h2 className="text-neutral-100 text-lg font-semibold">Passwort zurücksetzen</h2>
          <form onSubmit={submit} className="space-y-3">
            {!initialEmail && (
              <div>
                <label className="block text-sm text-neutral-300 mb-1">E‑Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                  placeholder="name@example.com"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Neues Passwort</label>
              <input
                type="password"
                value={pw1}
                onChange={e=>setPw1(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                placeholder="mind. 8 Zeichen"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Passwort bestätigen</label>
              <input
                type="password"
                value={pw2}
                onChange={e=>setPw2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                placeholder="nochmal eingeben"
              />
            </div>
            {error && <div className="text-sm text-[#F471B5]">{error}</div>}
            {ok && <div className="text-sm text-emerald-300">{ok}</div>}
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => onDone?.()} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Abbrechen</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-900 bg-neutral-200 hover:bg-white disabled:opacity-50">Speichern</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
