import React, { useEffect, useState } from 'react';
import { me, twofaSetup, twofaEnable, twofaDisable } from '../lib/api';

const TwoFASetupCard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await me() as any;
      setEnabled(!!info.twofaEnabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des 2FA-Status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await twofaSetup();
      setSecret(res.secret);
      setOtpauth(res.otpauth);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Starten der Einrichtung');
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    if (!secret || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await twofaEnable(secret, code.trim());
      setSecret(null);
      setOtpauth(null);
      setCode('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktivierung fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      await twofaDisable();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deaktivierung fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-neutral-800/60 border-[0.5px] border-neutral-700/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-neutral-100 font-medium">Sicherheit – Zwei-Faktor-Authentifizierung</h4>
        {enabled ? (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-neutral-700 text-neutral-100 border border-neutral-600">Aktiv</span>
        ) : (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-neutral-700 text-[#909296] border border-neutral-600">Inaktiv</span>
        )}
      </div>

      {error && <div className="p-2 rounded bg-neutral-900/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>}
      {loading && <div className="text-neutral-400 text-sm">Lade…</div>}

      {!loading && enabled && (
        <div className="flex gap-2">
          <button disabled={busy} onClick={disable} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">2FA deaktivieren</button>
        </div>
      )}

      {!loading && !enabled && (
        <div className="space-y-3">
          {!secret ? (
            <button disabled={busy} onClick={startSetup} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">2FA einrichten</button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-neutral-300">Füge diesen Account in Google Authenticator hinzu.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs text-neutral-400">Secret</label>
                  <input readOnly value={secret} className="w-full px-3 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700 text-neutral-200" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs text-neutral-400">otpauth:// URL</label>
                  <input readOnly value={otpauth || ''} className="w-full px-3 py-2 rounded-lg bg-neutral-900/60 border border-neutral-700 text-neutral-200" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-neutral-300">Bestätigungs-Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-stelliger Code"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296]"
                />
                <div>
                  <button disabled={busy || !code.trim()} onClick={activate} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">Aktivieren</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoFASetupCard;
