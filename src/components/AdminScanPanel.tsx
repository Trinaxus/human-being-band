import React, { useEffect, useRef, useState } from 'react';
import { ordersFind, ordersUpdate, type OrderItem } from '../lib/api';

// Simple QR scan panel using the native BarcodeDetector API when available.
// Fallback: show camera preview and allow manual input of the code.
// QR payload format we generate: "<ticket_code>|<qr_token>"

const AdminScanPanel: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasDetector, setHasDetector] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [detected, setDetected] = useState<{ code?: string; token?: string; raw?: string } | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);
  const [lastFoundAt, setLastFoundAt] = useState<number | null>(null);
  const [flash, setFlash] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [found, setFound] = useState<OrderItem | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for BarcodeDetector support
    const supported = typeof (window as any).BarcodeDetector !== 'undefined';
    setHasDetector(supported);
  }, []);

  const tick = () => {
    rafRef.current = requestAnimationFrame(tick);
    const v = videoRef.current;
    if (!v || v.readyState !== 4 || !detectorRef.current) return;
    detectorRef.current.detect(v).then((codes: Array<{ rawValue: string }>) => {
      setAttempts(prev => prev + 1);
      setLastScanAt(Date.now());
      if (!codes || codes.length === 0) return;
      const raw = (codes[0]?.rawValue || '').trim();
      if (!raw) return;
      try {
        const parts = raw.split('|');
        const code = (parts[0] || '').trim();
        const token = (parts[1] || '').trim();
        setDetected({ code, token, raw });
        setLastFoundAt(Date.now());
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
        // Lookup order details when we have a valid code/token
        if (code || token) {
          ordersFind({ code: code || undefined, token: token || undefined })
            .then((res) => setFound(res.order))
            .catch(() => setFound(null));
        }
      } catch {
        setDetected({ raw });
      }
    }).catch(() => {});
  };

  const stopCamera = () => {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    const ms = v && (v.srcObject as MediaStream);
    if (ms) {
      ms.getTracks().forEach(t => t.stop());
      if (v) v.srcObject = null;
    }
  };

  const startCamera = async () => {
    setStreamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream as MediaStream;
        await videoRef.current.play().catch(() => {});
      }
      if (hasDetector && (window as any).BarcodeDetector) {
        const BarcodeDetector = (window as any).BarcodeDetector;
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
        setScanning(true);
        tick();
      }
    } catch (e) {
      setStreamError('Kamera konnte nicht geöffnet werden. Bitte Berechtigungen prüfen.');
    }
  };

  useEffect(() => {
    // Do not auto-start for privacy; user must click "Kamera starten".
    return () => { stopCamera(); };
  }, [hasDetector]);

  const manualRef = useRef<HTMLInputElement | null>(null);

  const canQuickActions = !!(detected?.code && detected.code.toUpperCase().startsWith('BAR-'));

  const doUpdate = async (status: OrderItem['status']) => {
    if (!found) return;
    setBusy(true);
    try {
      await ordersUpdate(found.id, status);
      setFound({ ...found, status });
    } catch (e) {
      // noop, UI will remain
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-neutral-100 text-base sm:text-lg font-semibold">Scan Ticket</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 hidden sm:inline">{hasDetector ? 'BarcodeDetector aktiv' : 'Kein BarcodeDetector – manueller Modus'}</span>
            {scanning ? (
              <button onClick={stopCamera} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Kamera stoppen</button>
            ) : (
              <button onClick={startCamera} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Kamera starten</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative rounded-lg overflow-hidden bg-black border border-neutral-800">
            <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
            {/* Scan status badge */}
            {scanning && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 border border-neutral-700 text-white text-[11px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Scan aktiv</span>
              </div>
            )}
            {/* Flash on detection */}
            {flash && <div className="absolute inset-0 bg-emerald-400/20 pointer-events-none" />}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-neutral-300 flex items-center justify-between">
              <span>Ergebnis</span>
              {!hasDetector && <span className="text-xs text-neutral-500">Hinweis: QR-Scan erfordert Chrome/Edge/Android. Auf iOS/Safari ggf. nur manuell möglich.</span>}
            </div>
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 min-h-[80px]">
              {streamError && <div className="text-[#F471B5] text-sm">{streamError}</div>}
              {!streamError && detected ? (
                <div className="text-sm text-neutral-200">
                  {detected.code && (
                    <div className="mb-1">Ticket‑Nr.: <span className="px-2 py-0.5 rounded-md border bg-neutral-900 text-neutral-100 border-neutral-700/40">{detected.code}</span></div>
                  )}
                  {detected.token && (
                    <div className="mb-1 text-neutral-400 truncate">Token: {detected.token}</div>
                  )}
                  {!detected.code && <div className="text-neutral-400 break-all">{detected.raw}</div>}
                </div>
              ) : (
                <div className="text-sm text-neutral-400">
                  {scanning ? 'Scanne…' : 'Kamera aus.'}
                  <div className="mt-1 text-[11px] text-neutral-500">
                    Versuche: {attempts} {lastScanAt ? `• letzter Scan: ${new Date(lastScanAt).toLocaleTimeString()}` : ''} {lastFoundAt ? `• letzter Treffer: ${new Date(lastFoundAt).toLocaleTimeString()}` : ''}
                  </div>
                </div>
              )}
            </div>
            {!hasDetector && (
              <div className="space-y-2">
                <label className="block text-xs text-neutral-400">Code manuell eingeben (Format: CODE|TOKEN)</label>
                <input ref={manualRef} placeholder="BAR-XXXX-XXXX|<token>" className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none focus:ring-0 focus:border-neutral-600" />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const v = manualRef.current?.value || '';
                      const parts = v.split('|');
                      const code = (parts[0]||'').trim();
                      const token = (parts[1]||'').trim();
                      setDetected({ code, token, raw: v });
                      if (code || token) {
                        ordersFind({ code: code || undefined, token: token || undefined })
                          .then((res) => setFound(res.order))
                          .catch(() => setFound(null));
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
                  >Übernehmen</button>
                  <button onClick={() => setDetected(null)} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Reset</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/30 p-4">
        <div className="text-sm text-neutral-300 mb-2">Aktion</div>
        {found ? (
          <div className="space-y-2">
            <div className="text-[13px] text-neutral-300">
              <span className="font-medium text-neutral-100">{found.title}</span>
              <span className="text-neutral-400"> • {found.date}</span>
              {found.name && <span className="text-neutral-400"> • {found.name}</span>}
              {found.email && <span className="text-neutral-400"> • {found.email}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md border text-[11px] bg-neutral-800/60 text-neutral-200 border-neutral-700/40">Status: {found.status}</span>
              <span className="px-2 py-0.5 rounded-md border text-[11px] bg-neutral-800/60 text-neutral-200 border-neutral-700/40">Zahlung: {found.payment}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={!canQuickActions || busy}
                onClick={() => doUpdate('confirmed')}
                className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
              >Check‑in</button>
              <button
                disabled={!canQuickActions || busy}
                onClick={() => doUpdate('paid')}
                className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
              >Bezahlt</button>
              <button onClick={() => { setDetected(null); setFound(null); }} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Leeren</button>
            </div>
            {!canQuickActions && (
              <p className="text-xs text-neutral-500">Hinweis: Quick‑Aktionen sind für BAR‑Codes (Vor Ort) gedacht.</p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button disabled className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-500 bg-neutral-900/50">Check‑in</button>
              <button disabled className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-500 bg-neutral-900/50">Bezahlt</button>
              <button onClick={() => { setDetected(null); setFound(null); }} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Leeren</button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Scanne einen QR oder gib CODE|TOKEN manuell ein, um Aktionen freizuschalten.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScanPanel;
