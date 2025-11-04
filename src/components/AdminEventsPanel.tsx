import React, { useEffect, useMemo, useState } from 'react';
import { contentGet, contentSave, type SiteContent } from '../lib/api';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={"w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none focus:ring-0 focus:border-neutral-600 "+(props.className||"")} />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={"w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none focus:ring-0 focus:border-neutral-600 "+(props.className||"")} />
);

const AdminEventsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>({});

  const load = async () => {
    setLoading(true); setError(null);
    try { const res = await contentGet(); setContent(res.content || {}); }
    catch (e) { setError(e instanceof Error ? e.message : 'Fehler beim Laden'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setOk(null); setError(null);
    try { const res = await contentSave(content); setContent(res.content); setOk('Gespeichert'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen'); }
    finally { setSaving(false); }
  };

  // Calendar (current month) with markers
  const now = new Date();
  const monthLabel = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const calendar = useMemo(() => {
    const y = now.getFullYear(); const m = now.getMonth();
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
  }, [now.getMonth(), now.getFullYear()]);
  const markers = useMemo(() => new Set<string>((content.events||[]).map(e => e.date).filter(Boolean) as string[]), [content.events]);

  if (loading) return <div className="text-neutral-400">Lade…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>}
      {ok && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-neutral-200 text-sm">{ok}</div>}

      <section>
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
          <div className="text-neutral-300 text-sm">Termine verwalten</div>
          <button
            type="button"
            onClick={() => setContent(prev => ({ ...prev, events: [ ...(prev.events||[]), { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), time: '', title: 'Neuer Termin', location: '', link: '', description: '', published: true } ] }))}
            className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
          >Termin hinzufügen</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
          <div className="lg:col-span-2 space-y-2">
            {(content.events||[]).length === 0 && (
              <div className="text-[#909296] text-sm">Keine Termine vorhanden.</div>
            )}
            {(content.events||[]).slice().sort((a,b)=> (a.date||'').localeCompare(b.date||'')).map((ev, idx) => (
              <div key={ev.id||idx} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="date" value={ev.date||''} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, date: e.target.value }: x) }))} className="px-2 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm" />
                  <input value={ev.time||''} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, time: e.target.value }: x) }))} placeholder="HH:MM" className="w-28 px-2 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm" />
                  <Input placeholder="Titel" value={ev.title||''} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, title: e.target.value }: x) }))} className="flex-1" />
                  <label className="flex items-center gap-2 text-neutral-200 text-sm">
                    <input type="checkbox" checked={ev.published !== false} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, published: e.target.checked }: x) }))} />
                    Veröffentlicht
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input placeholder="Ort / Location" value={ev.location||''} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, location: e.target.value }: x) }))} />
                  <Input placeholder="Link (optional)" value={ev.link||''} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, link: e.target.value }: x) }))} />
                  <Input placeholder="Beschreibung (kurz)" value={ev.description||''} onChange={e => setContent(prev => ({ ...prev, events: (prev.events||[]).map((x,i)=> i===idx? { ...x, description: e.target.value }: x) }))} />
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setContent(prev => ({ ...prev, events: (prev.events||[]).filter((_,i)=> i!==idx) }))} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
            <div className="text-neutral-300 text-sm mb-2">{monthLabel}</div>
            <div className="grid grid-cols-7 text-[11px] text-neutral-400 mb-1">
              {['Mo','Di','Mi','Do','Fr','Sa','So'].map(w => <div key={w} className="px-1 py-1 text-center">{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((wk, wi) => wk.map((cell, ci) => (
                <div key={`${wi}-${ci}`} className={`h-9 rounded-lg border-[0.5px] text-sm ${cell.d===null? 'opacity-40 border-transparent' : 'border-neutral-700/30 bg-neutral-800/40'}`}>
                  <div className="relative text-center text-neutral-200 leading-9">
                    {cell.d}
                    {cell.iso && markers.has(cell.iso) && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </div>
              )))}
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
        </div>
      </section>
    </div>
  );
};

export default AdminEventsPanel;
