import React, { useEffect, useMemo, useState } from 'react';
import { ordersMine, contentGet, type OrderItem, type SiteContent } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const OverviewPage: React.FC = () => {
  const { authenticated, name } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [qrPreview, setQrPreview] = useState<{ code: string; token: string; title?: string; date?: string } | null>(null);
  const [content, setContent] = useState<SiteContent>({});

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!authenticated) {
          setOrders([]);
        } else {
          const res = await ordersMine();
          if (!cancel) setOrders(res.orders || []);
        }
        // Load content for hero image/text
        try {
          const c = await contentGet();
          if (!cancel) setContent(c.content || {});
        } catch {}
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : 'Fehler beim Laden');
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [authenticated]);

  const sorted = useMemo(() => {
    return [...orders].sort((a,b) => {
      if ((a.name||'').localeCompare(b.name||'')) return (a.name||'').localeCompare(b.name||'');
      return (a.date||'').localeCompare(b.date||'');
    });
  }, [orders]);

  const statusClass = (s?: OrderItem['status']) => {
    switch (s) {
      case 'paid': return 'bg-emerald-600/15 text-emerald-300 border-emerald-500/40';
      case 'confirmed': return 'bg-blue-600/15 text-blue-300 border-blue-500/40';
      case 'redirected': return 'bg-indigo-600/15 text-indigo-300 border-indigo-500/40';
      case 'reserved': return 'bg-amber-600/15 text-amber-300 border-amber-500/40';
      case 'cancelled': return 'bg-rose-600/15 text-rose-300 border-rose-500/40';
      default: return 'bg-neutral-700/20 text-neutral-300 border-neutral-600/40';
    }
  };
  const paymentLabel = (p?: string) => (p === 'external' ? 'online' : (p === 'onsite' ? 'vor Ort' : (p || '–')));
  const paymentClass = (p?: string) => {
    switch (p) {
      case 'external': return 'bg-sky-600/15 text-sky-300 border-sky-500/40';
      case 'onsite': return 'bg-pink-600/15 text-pink-300 border-pink-500/40';
      default: return 'bg-neutral-700/20 text-neutral-300 border-neutral-600/40';
    }
  };
  const formatDate = (d?: string) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length === 3) {
      const [y, m, day] = parts;
      return `${day}.${m}.${y}`; // DD.MM.YYYY
    }
    try {
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yy = String(dt.getFullYear());
      return `${dd}.${mm}.${yy}`;
    } catch {
      return d;
    }
  };
  const dateBadge = (date?: string) => (
    <span className="px-2 py-0.5 rounded-md text-[11px] border [text-shadow:0_0_1px_rgba(0,0,0,0.3)] bg-neutral-700/20 text-neutral-200 border-neutral-600/40">
      {formatDate(date)}
    </span>
  );

  // --- Scheduler Calendar ---
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const ordersByDate = useMemo(() => {
    const map = new Map<string, OrderItem[]>();
    for (const o of orders) {
      const key = (o.date || '').trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return map;
  }, [orders]);
  const monthMatrix = useMemo(() => {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7; // make Monday=0
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const cells: Array<{ d: number | null; iso?: string }>[] = [];
    let week: Array<{ d: number | null; iso?: string }> = [];
    for (let i=0;i<startDay;i++) week.push({ d: null });
    for (let day=1; day<=daysInMonth; day++) {
      const dd = String(day).padStart(2,'0');
      const mm = String(m+1).padStart(2,'0');
      const iso = `${y}-${mm}-${dd}`;
      week.push({ d: day, iso });
      if (week.length===7) { cells.push(week); week = []; }
    }
    if (week.length>0) { while (week.length<7) week.push({ d: null }); cells.push(week); }
    return cells;
  }, [calMonth]);
  const monthLabel = useMemo(() => calMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), [calMonth]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 self-start mt-2 md:mt-3 space-y-4">
      {/* Unified container (same style as Home) */}
      <section className="relative bg-neutral-900/80 rounded-xl border-[0.5px] border-neutral-700/20 p-4 sm:p-6 space-y-4">
        {(content.heroTitle || content.heroText || content.heroUrl) && (
          <div className="relative rounded-xl overflow-hidden bg-neutral-800/60 border border-neutral-700">
            <div className="w-full" style={{ height: `${content.heroHeight ?? 300}px` }}>
              {content.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.heroUrl}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `${content.heroFocusX ?? 50}% ${content.heroFocusY ?? 50}%`,
                    transform: `scale(${(content.heroZoom ?? 100) / 100})`,
                    transformOrigin: 'center',
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#909296] text-sm">Kein Bild</div>
              )}
            </div>
            {(content.heroTitle || content.heroText) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 sm:p-6 flex items-center justify-center text-center hero-overlay">
                <div className="max-w-3xl mx-auto">
                  {content.heroTitle && (
                    <h2 className="uppercase text-white drop-shadow tracking-wide text-2xl sm:text-3xl font-semibold">
                      {content.heroTitle}
                    </h2>
                  )}
                  {content.heroText && (
                    <p className="mt-2 uppercase text-neutral-200 drop-shadow tracking-wider whitespace-pre-line text-xs sm:text-sm font-extralight">
                      {content.heroText}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-neutral-100 mb-1">Übersicht</h2>
          {authenticated ? (
            <p className="text-neutral-300 text-sm">Hallo{name ? `, ${name}` : ''}! Hier findest du deine gebuchten Tickets.</p>
          ) : (
            <p className="text-neutral-300 text-sm">Bitte melde dich an, um deine Ticketkäufe zu sehen.</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-neutral-100 text-lg font-semibold">Meine Bestellungen</h3>
          {loading && <span className="text-neutral-400 text-sm">Lade…</span>}
        </div>
        {err && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{err}</div>}
        {!authenticated ? (
          <div className="text-neutral-500 text-sm">Nicht angemeldet.</div>
        ) : sorted.length === 0 ? (
          <div className="text-neutral-500 text-sm">Noch keine Bestellungen.</div>
        ) : (
          <div className="space-y-3">
            {/* Kalender */}
            <div className="rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="uppercase text-sm text-neutral-300">Kalender</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1))} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">←</button>
                  <div className="text-neutral-100 text-sm font-medium w-40 text-center truncate">{monthLabel}</div>
                  <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1))} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">→</button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-[11px] text-neutral-400 mb-1">
                {['Mo','Di','Mi','Do','Fr','Sa','So'].map((w)=> <div key={w} className="px-1 py-1 text-center">{w}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthMatrix.map((week, wi) => week.map((cell, ci) => {
                  const has = cell.iso ? ordersByDate.has(cell.iso) : false;
                  const isSel = selectedDate && cell.iso === selectedDate;
                  return (
                    <button key={`${wi}-${ci}`} disabled={cell.d===null} onClick={() => cell.iso && setSelectedDate(cell.iso)}
                      className={`h-9 rounded-lg border-[0.5px] text-sm ${cell.d===null? 'opacity-40 border-transparent' : (isSel? 'border-neutral-500 bg-neutral-700/50' : 'border-neutral-700/30 bg-neutral-800/40 hover:bg-neutral-800')}`}
                    >
                      <div className="text-center text-neutral-200 leading-8 relative">
                        {cell.d}
                        {has && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                    </button>
                  );
                }))}
              </div>
              {selectedDate && (
                <div className="mt-3 p-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                  <div className="text-neutral-300 text-xs mb-1">Ausgewählt: {formatDate(selectedDate)}</div>
                  <div className="space-y-1">
                    {(ordersByDate.get(selectedDate) || []).map((o)=> (
                      <div key={o.id} className="flex items-center justify-between text-[12px]">
                        <div className="text-neutral-200 truncate">{o.title}</div>
                        <span className={`px-2 py-0.5 rounded-md border text-[11px] capitalize ${statusClass(o.status)}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {sorted.map(o => (
              <div key={o.id} className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <div className="text-neutral-100 text-sm font-semibold truncate">{o.title}</div>
                  <div className="mt-1 text-[12px] text-neutral-300 truncate">{o.name || '–'} • {o.email || '–'}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {dateBadge(o.date)}
                    <span className={"px-2 py-0.5 rounded-md text-[11px] border "+paymentClass(o.payment)}>{paymentLabel(o.payment)}</span>
                    {o.status && (
                      <span className={"px-2 py-0.5 rounded-md text-[11px] border capitalize "+statusClass(o.status)}>{o.status}</span>
                    )}
                    {o.ticket_code && (
                      <span className="ml-1 px-2 py-0.5 rounded-md text-[11px] border bg-neutral-900 text-neutral-100 border-neutral-700/40">Ticket‑Nr.: {o.ticket_code}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {o.href && (
                    <a href={o.href} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800">Zum Anbieter</a>
                  )}
                  {o.qr_token && (
                    <button
                      type="button"
                      onClick={() => setQrPreview({ code: o.ticket_code || '', token: o.qr_token!, title: o.title, date: o.date })}
                      className="rounded-lg bg-neutral-900 border border-neutral-700/40 p-1 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                      aria-label="QR-Code anzeigen"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(`${o.ticket_code || ''}|${o.qr_token}`)}`}
                        alt="Ticket QR"
                        className="w-14 h-14 object-contain"
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setQrPreview(null)} aria-hidden="true" />
          <div className="relative z-10 w-[92vw] max-w-[420px] mx-auto rounded-2xl bg-neutral-900 border-[0.5px] border-neutral-700/40 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <div className="text-neutral-100 font-semibold truncate">{qrPreview.title || 'Ticket'}</div>
                {qrPreview.date && <div className="text-neutral-400 text-sm">{qrPreview.date}</div>}
              </div>
              <button onClick={() => setQrPreview(null)} className="ml-3 px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Schließen</button>
            </div>
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`${qrPreview.code}|${qrPreview.token}`)}`}
                alt="Ticket QR groß"
                className="w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] object-contain"
              />
            </div>
            <div className="mt-3 text-center">
              {qrPreview.code && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 bg-neutral-800/60 text-neutral-100 text-sm">Ticket‑Nr.: {qrPreview.code}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewPage;
