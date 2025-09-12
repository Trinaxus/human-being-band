import React, { useEffect, useMemo, useState } from 'react';
import {
  contentGet,
  contentSave,
  ordersList,
  ordersUpdate,
  type SiteContent,
  type OrderItem,
} from '../lib/api';

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-3">
    <h3 className="text-base sm:text-lg font-semibold text-neutral-100">{title}</h3>
    {subtitle && <p className="text-[13px] text-[#909296] mt-0.5">{subtitle}</p>}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={"w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none focus:ring-0 focus:border-neutral-600 "+(props.className||"")} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={"w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none focus:ring-0 focus:border-neutral-600 "+(props.className||"")} />
);

const ToggleButton: React.FC<{ label: string; open: boolean; onClick: () => void }> = ({ label, open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800"
  >
    <span className="uppercase text-xs tracking-wider">{label}</span>
    <span className="text-neutral-400 text-sm">{open ? '–' : '+'}</span>
  </button>
);

const AdminTicketsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [ticketOpenMap, setTicketOpenMap] = useState<Record<string, boolean>>({});

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
  // Admin scheduler calendar state
  const [calMonthA, setCalMonthA] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const ordersByDateA = useMemo(() => {
    const map = new Map<string, OrderItem[]>();
    for (const o of orders) {
      const key = (o.date || '').trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return map;
  }, [orders]);
  const monthMatrixA = useMemo(() => {
    const y = calMonthA.getFullYear();
    const m = calMonthA.getMonth();
    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const cells: Array<{ d: number | null; iso?: string }>[] = [];
    let week: Array<{ d: number | null; iso?: string }> = [];
    for (let i=0;i<startDay;i++) week.push({ d: null });
    for (let day=1; day<=daysInMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const mm = String(m+1).padStart(2, '0');
      const iso = `${y}-${mm}-${dd}`;
      week.push({ d: day, iso });
      if (week.length===7) { cells.push(week); week = []; }
    }
    if (week.length>0) { while (week.length<7) week.push({ d: null }); cells.push(week); }
    return cells;
  }, [calMonthA]);
  const monthLabelA = useMemo(() => calMonthA.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), [calMonthA]);
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
  const paymentClass = (p?: string) => {
    switch (p) {
      case 'external': return 'bg-sky-600/15 text-sky-300 border-sky-500/40';
      case 'onsite': return 'bg-pink-600/15 text-pink-300 border-pink-500/40';
      default: return 'bg-neutral-700/20 text-neutral-300 border-neutral-600/40';
    }
  };
  const paymentLabel = (p?: string) => (p === 'external' ? 'online' : (p === 'onsite' ? 'vor Ort' : (p || '—')));
  const dateBadge = (d?: string) => (
    <span className="px-2 py-0.5 rounded-md text-[11px] border bg-neutral-700/20 text-neutral-200 border-neutral-600/40">{d || '—'}</span>
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contentGet();
      setContent(res.content || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await ordersList();
      setOrders(res.orders || []);
    } catch (_) {}
  };

  useEffect(() => {
    load();
    loadOrders();
  }, []);

  const save = async () => {
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const res = await contentSave(content);
      setContent(res.content);
      setOk('Gespeichert');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const [open, setOpen] = useState({ tickets: true, orders: false });

  // Aggregate orders per month and payment type (fixed Jan–Dec for current year)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const keys: string[] = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const init: Record<string, { onsite: number; online: number; label: string }> = {};
    keys.forEach((k, idx) => {
      const label = new Date(year, idx, 1).toLocaleDateString('de-DE', { month: 'short' });
      init[k] = { onsite: 0, online: 0, label };
    });
    for (const o of orders) {
      if ((o.status || '').toLowerCase() !== 'paid') continue; // only count paid
      const d = (o.date || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      const key = d.slice(0, 7); // YYYY-MM
      if (!init[key]) continue; // only current year
      if (o.payment === 'onsite') init[key].onsite += 1; else if (o.payment === 'external') init[key].online += 1;
    }
    const rows = keys.map(k => ({ key: k, ...init[k] }));
    const max = rows.reduce((m, r) => Math.max(m, r.onsite + r.online, r.onsite, r.online), 0) || 1;
    return { rows, max };
  }, [orders]);

  if (loading) return <div className="text-neutral-400">Lade…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>}
      {ok && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-neutral-200 text-sm">{ok}</div>}

      {/* Tickets */}
      <section>
        <ToggleButton label="Tickets" open={open.tickets} onClick={() => setOpen(prev => ({ ...prev, tickets: !prev.tickets }))} />
        {open.tickets && (
          <div className="mt-3 space-y-3">
            <SectionTitle title="Ticket-Links" subtitle="Externe URLs zu deinem Ticket-/Zahlungsanbieter. Ohne URL wird vor Ort bezahlt. Nur aktive Tickets werden auf der Startseite angezeigt." />
            <div className="space-y-2">
              {(content.tickets || []).map((t, idx) => {
                const tid = t.id || String(idx);
                const opened = !!ticketOpenMap[tid];
                return (
                  <div key={tid} className="rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 flex flex-col">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-800/40 border-b border-neutral-700/30"
                      onClick={() => setTicketOpenMap(prev => ({ ...prev, [tid]: !prev[tid] }))}
                      aria-expanded={opened}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-neutral-400 text-xs">{opened ? '▼' : '▶'}</span>
                        <span className="text-neutral-100 text-sm font-semibold truncate">{t.title || 'Unbenanntes Ticket'}</span>
                        <span className={"px-2 py-0.5 rounded text-[11px] font-medium border "+(t.active!==false?"bg-emerald-600/20 text-emerald-300 border-emerald-500/40":"bg-rose-600/20 text-rose-300 border-rose-500/40")}>{t.active!==false? 'Aktiv' : 'Deaktiviert'}</span>
                        <span className={"px-2 py-0.5 rounded text-[11px] font-medium border "+((t.paymentType|| (t.url? 'online':'onsite'))==='online' ? 'bg-sky-600/15 text-sky-300 border-sky-500/40' : 'bg-pink-600/15 text-pink-300 border-pink-500/40')}>{(t.paymentType|| (t.url? 'online':'onsite'))==='online'?'Online':'Vor Ort'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).map((x:any,i:number)=> i===idx? { ...x, active: !(x.active!==false) }: x) })); }}
                          className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-xs"
                        >{t.active!==false? 'Deaktivieren' : 'Aktivieren'}</button>
                      </div>
                    </button>
                    {opened && (
                      <div className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-8 gap-2">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-neutral-400 mb-1">Titel</label>
                            <Input value={t.title} onChange={e => {
                              const v = e.target.value; setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).map((x:any,i:number)=> i===idx? { ...x, title: v }: x) }));
                            }} />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs text-neutral-400 mb-1">Ticket-URL (extern)</label>
                            <Input value={t.url} onChange={e => {
                              const v = e.target.value; setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).map((x:any,i:number)=> i===idx? { ...x, url: v }: x) }));
                            }} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-neutral-400 mb-1">Bild-URL (optional)</label>
                            <Input value={t.image || ''} onChange={e => {
                              const v = e.target.value; setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).map((x:any,i:number)=> i===idx? { ...x, image: v }: x) }));
                            }} />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs text-neutral-400 mb-1">Zahlung</label>
                            <select
                              value={t.paymentType || (t.url ? 'online' : 'onsite')}
                              onChange={e => {
                                const v = e.target.value as 'online' | 'onsite';
                                setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).map((x:any,i:number)=> i===idx? { ...x, paymentType: v }: x) }));
                              }}
                              className="w-full px-2 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100"
                            >
                              <option value="online">Online</option>
                              <option value="onsite">Vor Ort</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Beschreibung (optional, wird auf der Startseite angezeigt)</label>
                          <Textarea rows={2} placeholder="Kurze Beschreibung" value={t.description || ''} onChange={e => {
                            const v = e.target.value; setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).map((x:any,i:number)=> i===idx? { ...x, description: v }: x) }));
                          }} />
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => setContent(prev => ({ ...prev, tickets: (prev.tickets||[]).filter((_:any,i:number)=> i!==idx) }))} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              <button onClick={() => setContent(prev => ({ ...prev, tickets: [ ...(prev.tickets||[]), { id: crypto.randomUUID(), title: 'Neues Ticket', url: '', image: '', description: '', active: true } ] }))} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Ticket hinzufügen</button>
            </div>
            <div className="flex justify-end">
              <button disabled={saving} onClick={save} className="mt-2 px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>
          </div>
        )}
      </section>

      {/* Bestellungen */}
      <section>
        <ToggleButton label="Bestellungen" open={open.orders} onClick={() => setOpen(prev => ({ ...prev, orders: !prev.orders }))} />
        {open.orders && (
          <div className="mt-3 p-4 rounded-xl bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-neutral-200 font-medium">Übersicht Bestellungen</h4>
              <button onClick={loadOrders} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Aktualisieren</button>
            </div>
            <div className="overflow-auto space-y-4">
              {/* Kalender über allen Bestellungen */}
              <div className="rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="uppercase text-sm text-neutral-300">Kalender (alle Bestellungen)</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCalMonthA(new Date(calMonthA.getFullYear(), calMonthA.getMonth()-1, 1))} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">←</button>
                    <div className="text-neutral-100 text-sm font-medium w-40 text-center truncate">{monthLabelA}</div>
                    <button onClick={() => setCalMonthA(new Date(calMonthA.getFullYear(), calMonthA.getMonth()+1, 1))} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">→</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-[11px] text-neutral-400 mb-1">
                  {['Mo','Di','Mi','Do','Fr','Sa','So'].map(w => <div key={w} className="px-1 py-1 text-center">{w}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthMatrixA.map((week, wi) => week.map((cell, ci) => {
                    const has = cell.iso ? ordersByDateA.has(cell.iso) : false;
                    const isSel = selectedA && cell.iso === selectedA;
                    return (
                      <button key={`${wi}-${ci}`} disabled={cell.d===null} onClick={() => cell.iso && setSelectedA(cell.iso)}
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
                {selectedA && (
                  <div className="mt-3 p-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                    <div className="text-neutral-300 text-xs mb-1">Ausgewählt: {selectedA}</div>
                    <div className="space-y-1">
                      {(ordersByDateA.get(selectedA) || []).map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-[12px]">
                          <div className="truncate">
                            <span className="text-neutral-100">{o.name || '—'}</span>
                            <span className="text-neutral-400"> • {o.email || '—'} • </span>
                            <span className="text-neutral-200">{o.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={"px-2 py-0.5 rounded-md text-[11px] border capitalize "+paymentClass(o.payment)}>{paymentLabel(o.payment)}</span>
                            {o.status && <span className={"px-2 py-0.5 rounded-md text-[11px] border capitalize "+statusClass(o.status)}>{o.status}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {(() => {
                if (orders.length === 0) return (
                  <div className="py-3 text-[#909296]">Keine Bestellungen vorhanden.</div>
                );
                // Group by buyer (name/email)
                const groups: Record<string, OrderItem[]> = {};
                for (const o of orders) {
                  const key = (o.name && o.name.trim()) || (o.email && o.email.trim()) || 'Unbekannt';
                  if (!groups[key]) groups[key] = [] as OrderItem[];
                  groups[key].push(o);
                }
                const names = Object.keys(groups).sort((a,b)=>a.localeCompare(b));
                return names.map((buyer) => {
                  const rows = groups[buyer].slice().sort((a,b)=> (a.date||'').localeCompare(b.date||''));
                  const email = rows.find(r=> (r.email||'').trim())?.email || '—';
                  const isOpen = !!groupOpen[buyer];
                  return (
                    <div key={buyer} className="rounded-lg bg-neutral-900/60 border-[0.5px] border-neutral-700/30">
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 border-b border-neutral-700/30 text-left hover:bg-neutral-800/40"
                        onClick={() => setGroupOpen(prev => ({ ...prev, [buyer]: !prev[buyer] }))}
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                          <span className="text-neutral-100 text-sm font-semibold">{buyer}</span>
                          <span className="text-neutral-400 text-xs">({rows.length})</span>
                        </div>
                        <div className="text-neutral-300 text-xs">{email}</div>
                      </button>
                      {isOpen && (
                        <div className="overflow-auto">
                          <table className="w-full text-sm text-neutral-200">
                            <thead className="text-left text-neutral-400">
                              <tr>
                                <th className="py-2 px-3">Datum</th>
                                <th className="py-2 px-3">Titel</th>
                                <th className="py-2 px-3">Payment</th>
                                <th className="py-2 px-3">Status</th>
                                <th className="py-2 px-3">Aktion</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map(o => (
                                <tr key={o.id} className="border-t border-neutral-700/30">
                                  <td className="py-2 px-3 whitespace-nowrap">{dateBadge(o.date)}</td>
                                  <td className="py-2 px-3 min-w-[220px]">{o.title}</td>
                                  <td className="py-2 px-3"><span className={"px-2 py-0.5 rounded-md text-[11px] border capitalize "+paymentClass(o.payment)}>{paymentLabel(o.payment)}</span></td>
                                  <td className="py-2 px-3">
                                    <select
                                      className="px-2 py-1 rounded bg-neutral-900 border-[0.5px] border-neutral-700/40 text-neutral-100"
                                      defaultValue={o.status}
                                      onChange={e => setOrders(prev => prev.map(x => x.id===o.id? { ...x, status: e.target.value as OrderItem['status'] } : x))}
                                    >
                                      <option value="reserved">reserved</option>
                                      <option value="redirected">redirected</option>
                                      <option value="confirmed">confirmed</option>
                                      <option value="paid">paid</option>
                                      <option value="cancelled">cancelled</option>
                                    </select>
                                  </td>
                                  <td className="py-2 px-3">
                                    <button
                                      disabled={busyOrder===o.id}
                                      onClick={async () => {
                                        setBusyOrder(o.id);
                                        try {
                                          await ordersUpdate(o.id, (orders.find(x => x.id===o.id)?.status || 'reserved'));
                                        } catch {}
                                        setBusyOrder(null);
                                      }}
                                      className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
                                    >Speichern</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            {/* Monthly bar chart */}
            <div className="mt-4 p-4 rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-neutral-200 font-medium">Monatsübersicht (Vor Ort vs. Online) — nur Paid</h4>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-700/40 bg-neutral-800/60 text-neutral-200"><span className="w-3 h-3 bg-pink-400/60 border border-pink-400/70 inline-block" /> Vor Ort</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-700/40 bg-neutral-800/60 text-neutral-200"><span className="w-3 h-3 bg-sky-400/60 border border-sky-400/70 inline-block" /> Online</span>
                </div>
              </div>
              <div>
                <ChartBars data={monthlyData.rows} max={monthlyData.max} />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminTicketsPanel;

// Simple inline chart component (no external libs)
const ChartBars: React.FC<{ data: Array<{ key: string; label: string; onsite: number; online: number }>; max: number }>
  = ({ data, max }) => {
  const width = 960; // logical width; scales to 100%
  const height = 220;
  const padding = { top: 10, right: 16, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const groups = Math.max(1, data.length);
  const barGroupWidth = innerW / groups; // fill entire width evenly
  const groupGap = 10;
  const barWidth = Math.max(8, (barGroupWidth - groupGap) / 2);
  const scaleY = (v: number) => padding.top + innerH - (v / max) * innerH;
  const trans = 'y 400ms ease, height 400ms ease';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="block">
      <rect x={0} y={0} width={width} height={height} fill="none" />
      {/* Y axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
        const y = padding.top + innerH - t * innerH;
        const val = Math.round(t * max);
        return (
          <g key={idx}>
            <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="rgba(120,120,120,0.25)" strokeWidth={1} />
            <text x={6} y={y + 4} fontSize={10} fill="#9CA3AF">{val}</text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x0 = padding.left + i * barGroupWidth + (barGroupWidth - (barWidth * 2 + groupGap)) / 2;
        const yOn = scaleY(d.onsite);
        const yOl = scaleY(d.online);
        const hOn = padding.top + innerH - yOn;
        const hOl = padding.top + innerH - yOl;
        return (
          <g key={d.key}>
            <rect x={x0} y={yOn} width={barWidth} height={hOn} fill="rgba(236,72,153,0.6)" stroke="rgba(236,72,153,0.7)" style={{ transition: trans }} />
            <rect x={x0 + barWidth + groupGap} y={yOl} width={barWidth} height={hOl} fill="rgba(56,189,248,0.6)" stroke="rgba(56,189,248,0.7)" style={{ transition: trans }} />
            <text x={padding.left + i * barGroupWidth + barGroupWidth / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#D1D5DB">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};
