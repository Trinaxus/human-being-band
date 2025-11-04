import React, { useEffect, useMemo, useState } from 'react';
import { contentGet, type SiteContent } from '../lib/api';

const AdminSchedulerPanel: React.FC = () => {
  const [content, setContent] = useState<SiteContent>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try { const res = await contentGet(); setContent(res.content||{}); }
      catch (e) { setError(e instanceof Error? e.message: 'Fehler beim Laden'); }
      finally { setLoading(false); }
    })();
  }, []);

  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [selected, setSelected] = useState<string | null>(null);

  const monthLabel = useMemo(() => cursor.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Array<NonNullable<SiteContent['events']>[number]>>();
    for (const e of (content.events||[])) {
      if (!e?.date) continue;
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    for (const arr of map.values()) arr.sort((a,b)=> (a.time||'').localeCompare(b.time||''));
    return map;
  }, [content.events]);

  const monthKeyPrefix = useMemo(() => {
    const y = cursor.getFullYear(); const m = String(cursor.getMonth()+1).padStart(2,'0');
    return `${y}-${m}-`;
  }, [cursor]);

  const monthEvents = useMemo(() => {
    const all = (content.events||[]).filter(e => (e.date||'').startsWith(monthKeyPrefix));
    return all.slice().sort((a,b)=> (
      (a.date||'').localeCompare(b.date||'') || (a.time||'').localeCompare(b.time||'')
    ));
  }, [content.events, monthKeyPrefix]);

  const calendar = useMemo(() => {
    const y = cursor.getFullYear(); const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const weeks: Array<Array<{ d: number|null; iso?: string }>> = [];
    let week: Array<{ d: number|null; iso?: string }> = [];
    for (let i=0;i<startDay;i++) week.push({ d: null });
    for (let day=1; day<=daysInMonth; day++) {
      const dd = String(day).padStart(2,'0'); const mm = String(m+1).padStart(2,'0'); const iso = `${y}-${mm}-${dd}`;
      week.push({ d: day, iso }); if (week.length===7) { weeks.push(week); week = []; }
    }
    if (week.length>0) { while (week.length<7) week.push({ d: null }); weeks.push(week); }
    return weeks;
  }, [cursor]);

  const markers = useMemo(() => new Set<string>((content.events||[]).map(e => e.date).filter(Boolean) as string[]), [content.events]);

  const prevMonth = () => setCursor(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setCursor(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  if (loading) return <div className="text-neutral-400">Lade…</div>;
  if (error) return <div className="text-[#F471B5]">{error}</div>;

  const selectedEvents = selected ? (eventsByDate.get(selected) || []) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
        <div className="text-neutral-300 text-sm">Scheduler</div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">←</button>
          <div className="text-neutral-200 text-sm min-w-[180px] text-center">{monthLabel}</div>
          <button onClick={nextMonth} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">→</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
          <div className="grid grid-cols-7 text-[11px] text-neutral-400 mb-1">
            {['Mo','Di','Mi','Do','Fr','Sa','So'].map(w => <div key={w} className="px-1 py-1 text-center">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendar.map((wk, wi) => wk.map((cell, ci) => (
              <button key={`${wi}-${ci}`} onClick={()=> cell.iso && setSelected(cell.iso)} className={`h-24 rounded-lg border-[0.5px] text-sm w-full text-left ${cell.d===null? 'opacity-40 border-transparent' : 'border-neutral-700/30 bg-neutral-800/40 hover:bg-neutral-700/40'}`}>
                <div className="relative px-2 pt-2 text-neutral-200">
                  <div className="text-[12px] font-medium">{cell.d}</div>
                  {cell.iso && markers.has(cell.iso) && <span className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                {cell.iso && (eventsByDate.get(cell.iso)||[]).slice(0,3).map((e, ei) => (
                  <div key={ei} className="mx-2 mt-1 px-2 py-0.5 rounded bg-neutral-900/70 border border-neutral-700/40 text-[11px] text-neutral-200 truncate">
                    {(e.time? e.time+' · ': '') + (e.title||'')}
                  </div>
                ))}
              </button>
            )))}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
          {/* Selected day (optional) */}
          {selected && (
            <div className="mb-3">
              <div className="text-neutral-300 text-sm mb-2">{selected}</div>
              <div className="space-y-2">
                {selectedEvents.length===0 && <div className="text-[#909296] text-sm">Keine Termine</div>}
                {selectedEvents.map((e, idx) => (
                  <div key={e.id||idx} className="p-2 rounded border border-neutral-700/40 bg-neutral-800/60">
                    <div className="text-neutral-100 text-sm font-medium">{e.title}</div>
                    <div className="text-neutral-400 text-xs">{[e.time, e.location].filter(Boolean).join(' · ')}</div>
                    {e.description && <div className="text-neutral-300 text-xs mt-1 whitespace-pre-line">{e.description}</div>}
                    {e.link && <a href={e.link} target="_blank" rel="noopener" className="inline-block mt-1 text-xs text-emerald-300 underline">Link</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month list */}
          <div>
            <div className="text-neutral-300 text-sm mb-2">Alle Termine · {monthLabel}</div>
            <div className="space-y-2">
              {monthEvents.length===0 && <div className="text-[#909296] text-sm">Keine Termine in diesem Monat</div>}
              {monthEvents.map((e, idx) => (
                <div key={e.id||idx} className="p-2 rounded border border-neutral-700/40 bg-neutral-800/60">
                  <div className="text-neutral-100 text-sm font-medium">{e.title}</div>
                  <div className="text-neutral-400 text-xs">{[e.date, e.time, e.location].filter(Boolean).join(' · ')}</div>
                  {e.description && <div className="text-neutral-300 text-xs mt-1 whitespace-pre-line">{e.description}</div>}
                  {e.link && <a href={e.link} target="_blank" rel="noopener" className="inline-block mt-1 text-xs text-emerald-300 underline">Link</a>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedulerPanel;
