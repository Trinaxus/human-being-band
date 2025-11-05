import React from 'react';
import { bookingRequestsList, bookingRequestsUpdate, bookingRequestsDelete } from '../lib/api';

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const map: Record<string, string> = {
    open: 'bg-blue-900/40 text-blue-200 border-blue-700/40',
    confirmed: 'bg-amber-900/40 text-amber-200 border-amber-700/40',
    done: 'bg-green-900/40 text-green-200 border-green-700/40',
    archived: 'bg-neutral-700/40 text-neutral-200 border-neutral-600/40',
  };
  const cls = map[status || 'open'] || map.open;
  return <span className={`px-2 py-0.5 rounded border text-xs ${cls}`}>{status || 'open'}</span>;
};

const AdminBookingRequestsPanel: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const [items, setItems] = React.useState<Array<any>>([]);

  const load = React.useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const res = await bookingRequestsList();
      setItems(res.requests || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: 'open'|'confirmed'|'done'|'archived') => {
    try {
      await bookingRequestsUpdate(id, status);
      setItems(prev => prev.map(x => x.id === id ? { ...x, status, updated_at: new Date().toISOString() } : x));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Anfrage wirklich löschen?')) return;
    try {
      await bookingRequestsDelete(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-100 text-base font-semibold">Booking Anfragen</h3>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Aktualisieren</button>
        </div>
      </div>
      {error && <div className="text-rose-300 text-sm">{error}</div>}
      {loading ? (
        <div className="text-[#909296] text-sm">Lade…</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (<div className="text-[#909296] text-sm">Keine Anfragen vorhanden.</div>)}
          {items.map((r) => (
            <div key={r.id} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-neutral-100 text-sm font-medium truncate">
                  {r.name} <span className="text-neutral-400 font-normal">&lt;{r.email}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <div className="text-neutral-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString('de-DE') : ''}</div>
                </div>
              </div>
              <div className="text-neutral-300 text-xs mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {r.date && <span><span className="text-neutral-400">Datum:</span> {r.date}</span>}
                {r.event && <span><span className="text-neutral-400">Event:</span> {r.event}</span>}
                {r.location && <span><span className="text-neutral-400">Ort:</span> {r.location}</span>}
                {r.budget && <span><span className="text-neutral-400">Budget:</span> {r.budget}</span>}
              </div>
              {r.message && <div className="text-neutral-200 text-sm mt-1 whitespace-pre-line">{r.message}</div>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={() => updateStatus(r.id, 'open')} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Offen</button>
                <button onClick={() => updateStatus(r.id, 'confirmed')} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Bestätigt</button>
                <button onClick={() => updateStatus(r.id, 'done')} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Erledigt</button>
                <button onClick={() => updateStatus(r.id, 'archived')} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Archiv</button>
                <button onClick={() => remove(r.id)} className="ml-auto px-2 py-1 rounded border-[0.5px] border-rose-700/40 text-rose-300 hover:bg-rose-900/20 text-xs">Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBookingRequestsPanel;
