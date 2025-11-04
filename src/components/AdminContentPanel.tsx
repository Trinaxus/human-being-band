import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../lib/api';
import { contentGet, contentSave, uploadFile, scanUploads, writeMetadata, type SiteContent } from '../lib/api';
import { Globe, Instagram, Facebook, Youtube, Twitter, Linkedin, Music2, MessageCircle } from 'lucide-react';

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

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-neutral-700 text-neutral-100 border border-neutral-600">{children}</span>
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

const AdminContentPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [localNewsHtmlMode, setLocalNewsHtmlMode] = useState<Record<string, boolean>>({});

  

  const gallery = useMemo(() => content.gallery || [], [content.gallery]);
  const galleries = useMemo(() => Array.isArray(content.galleries) ? content.galleries : [], [content.galleries]);
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const g of galleries) { if (typeof g.year === 'number') set.add(g.year); }
    return Array.from(set).sort((a,b)=> b-a);
  }, [galleries]);
  const galleriesByYear = useMemo(() => {
    const map = new Map<number, { name: string; items: any[]; status?: 'public'|'internal'|'locked' }[]>();
    for (const g of galleries) {
      const arr = map.get(g.year) || [];
      arr.push({ name: g.name, items: g.items||[], status: (g as any).status });
      map.set(g.year, arr);
    }
    // sort galleries by name
    for (const [y, arr] of map.entries()) map.set(y, arr.slice().sort((a,b)=>a.name.localeCompare(b.name)) as any);
    return map;
  }, [galleries]);

  const upsertContent = (patch: Partial<SiteContent>) => setContent(prev => ({ ...prev, ...patch }));
  const setGalleries = (next: SiteContent['galleries']) => upsertContent({ galleries: next });
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ');
  const galleryExists = (year: number, name: string) => (galleries||[]).some(g => g.year === year && g.name.toLowerCase() === name.toLowerCase());
  const validYear = (y: number) => Number.isFinite(y) && y >= 1900 && y <= 2999;
  const addGallery = (year: number, name: string) => {
    const y = Number(year);
    const n = norm(name || '');
    if (!validYear(y)) { setError('Bitte gültiges Jahr (1900–2999) angeben.'); return; }
    if (!n) { setError('Galeriename darf nicht leer sein.'); return; }
    if (galleryExists(y, n)) { setError('Diese Galerie existiert bereits.'); return; }
    setError(null);
    setGalleries([...(galleries||[]), { year: y, name: n, items: [] }]);
  };

  // Gallery status helpers
  type GalStatus = 'public'|'internal'|'locked';
  const statusLabel = (s?: GalStatus) => s==='internal' ? 'Intern' : s==='locked' ? 'Gesperrt' : 'Öffentlich';
  const statusClass = (s?: GalStatus) => (
    s==='internal' ? 'bg-blue-900/40 text-blue-200 border-blue-700/40' :
    s==='locked' ? 'bg-red-900/40 text-red-200 border-red-700/40' :
    'bg-green-900/40 text-green-200 border-green-700/40'
  );
  const nextStatus = (s?: GalStatus): GalStatus => (s==='public'? 'internal' : s==='internal' ? 'locked' : 'public');
  const setGalleryStatus = async (year: number, name: string, s: GalStatus, itemsForPersist?: Array<{ type: 'image'|'video'|'youtube'|'instagram'; url: string; title?: string }>) => {
    // Update local state immediately
    setGalleries((galleries||[]).map(g => (g.year===year && g.name===name) ? { ...g, status: s } : g));
    try {
      // Persist to metadata.json with status
      const gal = (galleries||[]).find(g => g.year===year && g.name===name);
      const items = itemsForPersist || (gal?.items || []);
      await writeMetadata(year, name, items as any, s);
    } catch (_) { /* ignore errors here; UI already updated */ }
  };

  // Status menu open state per gallery (year:name)
  const [statusOpen, setStatusOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const hasAny = Object.values(statusOpen).some(Boolean);
    if (!hasAny) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.('.gal-status-menu')) {
        setStatusOpen({});
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [statusOpen]);

  // Admin: gallery expand/collapse state (default collapsed)
  const [adminOpen, setAdminOpen] = useState<Record<string, boolean>>({});
  const toggleAdminOpen = (y: number, name: string) => setAdminOpen(prev => ({ ...prev, [`${y}:${name}`]: !prev[`${y}:${name}`] }));

  // Instagram thumbnails for admin preview
  const [instaThumbs, setInstaThumbs] = useState<Record<string, string | null>>({});
  useEffect(() => {
    const urls = new Set<string>();
    (galleries||[]).forEach(g => (g.items||[]).forEach(it => { if (it.type==='instagram' && it.url) urls.add(it.url); }));
    const missing = Array.from(urls).filter(u => instaThumbs[u] === undefined);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries: Array<[string, string|null]> = [];
      await Promise.all(missing.map(async (u) => {
        try {
          const q = new URLSearchParams({ url: u }).toString();
          const resp = await fetch(`${API_BASE}/link_preview.php?${q}`, { credentials: 'include' });
          const data = await resp.json().catch(()=>({}));
          entries.push([u, typeof data?.thumbnail === 'string' ? data.thumbnail : null]);
        } catch { entries.push([u, null]); }
      }));
      if (!cancelled && entries.length) {
        setInstaThumbs(prev => {
          const next = { ...prev } as Record<string, string|null>;
          entries.forEach(([u,t]) => { next[u] = t; });
          return next;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [galleries]);

  const getYTThumb = (u: string): string | null => {
    try {
      const url = new URL(u, window.location.origin);
      let id = '';
      if (url.hostname.includes('youtu.be')) id = url.pathname.replace('/', '');
      if (url.hostname.includes('youtube.com')) id = url.searchParams.get('v') || '';
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
    } catch { return null; }
  };

  const importFromUploads = async () => {
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const res = await scanUploads();
      const scanned = Array.isArray(res.galleries) ? res.galleries : [];
      // Merge: keep existing status if scan doesn't provide one
      const merged = scanned.map((sg: any) => {
        const prev = (galleries||[]).find(pg => pg.year === sg.year && pg.name === sg.name) as any;
        const status = sg.status ?? prev?.status ?? undefined;
        return status ? { ...sg, status } : sg;
      });
      const next: SiteContent = { ...content, galleries: merged };
      const saved = await contentSave(next);
      setContent(saved.content);
      setOk('Aus Uploads eingelesen und gespeichert');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Einlesen aus Uploads fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };
  const renameGallery = (year: number, oldName: string, newName: string) => {
    const y = Number(year);
    const n = norm(newName || '');
    if (!n) { setError('Galeriename darf nicht leer sein.'); return; }
    if (oldName.toLowerCase() !== n.toLowerCase() && galleryExists(y, n)) { setError('Eine Galerie mit diesem Namen existiert bereits.'); return; }
    setError(null);
    setGalleries((galleries||[]).map(g => (g.year===y && g.name===oldName) ? { ...g, name: n } : g));
  };
  const removeGallery = (year: number, name: string) => setGalleries((galleries||[]).filter(g => !(g.year===year && g.name===name)));
  const addItemUrl = (year: number, name: string, type: 'image'|'video'|'youtube'|'instagram', url: string) => setGalleries((galleries||[]).map(g => (g.year===year && g.name===name) ? { ...g, items: [ ...(g.items||[]), { type, url } ] } : g));
  const removeItem = (year: number, name: string, idx: number) => setGalleries((galleries||[]).map(g => (g.year===year && g.name===name) ? { ...g, items: (g.items||[]).filter((_,i)=>i!==idx) } : g));
  const moveItem = (year: number, name: string, idx: number, dir: -1|1) => setGalleries((galleries||[]).map(g => {
    if (!(g.year===year && g.name===name)) return g;
    const it = (g.items||[]).slice();
    const j = idx+dir; if (j<0||j>=it.length) return g;
    const tmp = it[idx]; it[idx] = it[j]; it[j] = tmp; return { ...g, items: it };
  }));
  const uploadItem = async (year: number, name: string, file: File) => {
    const res = await uploadFile(file, { year, gallery: name });
    const url = res?.url || '';
    const t: 'image'|'video' = (file.type||'').startsWith('video') ? 'video' : 'image';
    if (url) addItemUrl(year, name, t, url);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contentGet();
      setContent(res.content || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Inhalts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Upload entfernt – Bild-URL wird direkt eingetragen

  const save = async () => {
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const res = await contentSave(content);
      setContent(res.content);
      setOk('Gespeichert');
      // Notify app to re-apply global CSS (orb)
      try { window.dispatchEvent(new Event('content:updated')); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const addGalleryUrl = () => {
    const url = prompt('Bild-URL hinzufügen');
    if (!url) return;
    setContent(prev => ({ ...prev, gallery: [ ...(prev.gallery||[]), url ] }));
  };
  const removeGalleryUrl = (idx: number) => {
    setContent(prev => ({ ...prev, gallery: (prev.gallery||[]).filter((_, i) => i !== idx) }));
  };

  

  const [open, setOpen] = useState({
    hero: false,
    contact: false,
    gallery: false,
    map: false,
    about: false,
    socials: false,
    news: false,
  });

  

  if (loading) return <div className="text-neutral-400">Lade Inhalte…</div>;

  return (
    <div className="w-full space-y-6">
      {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#DC2626] text-sm">{error}</div>}
      {ok && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-neutral-200 text-sm">{ok}</div>}

      {/* Abschnitte anordnen */}
      <section>
        <ToggleButton label="Abschnitte anordnen" open={(open as any).sections === true} onClick={() => setOpen(prev => ({ ...prev, sections: !(prev as any).sections }))} />
        {(open as any).sections && (
          <div className="mt-3 space-y-2">
            {(() => {
              const defaultOrder = ['news','booking','media','about','social','contact','map'];
              const current = Array.isArray(content.sectionsOrder) && content.sectionsOrder.length ? content.sectionsOrder : defaultOrder;
              const setOrder = (next: string[]) => setContent(prev => ({ ...prev, sectionsOrder: next }));
              const move = (idx: number, dir: -1|1) => {
                const j = idx + dir; if (j < 0 || j >= current.length) return;
                const arr = current.slice(); const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp; setOrder(arr);
              };
              const labels: Record<string,string> = { news: 'News (Hero)', booking: 'Booking (Tickets)', media: 'Media (Galerien)', about: 'Über uns', social: 'Social Media', contact: 'Kontakt', map: 'Karte' };
              return (
                <div className="space-y-2">
                  {current.map((key, idx) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/60 border border-neutral-700/40">
                      <div className="text-neutral-200 text-sm">{labels[key] || key}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => move(idx, -1)} disabled={idx===0} className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40" title="Nach oben">↑</button>
                        <button onClick={() => move(idx, 1)} disabled={idx===current.length-1} className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40" title="Nach unten">↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* Hero */}
      <section>
        <ToggleButton label="Hero" open={open.hero} onClick={() => setOpen(prev => ({ ...prev, hero: !prev.hero }))} />
        {open.hero && (
        <>
        <div className="mb-4">
          <div className="relative rounded-xl overflow-hidden bg-neutral-800/60 border border-neutral-700">
            <div className="w-full" style={{ height: `${content.heroHeight ?? 300}px` }}>
              {content.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.heroUrl}
                  alt="Hero Preview"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 sm:p-6 flex items-center justify-center text-center">
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
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3">
            <Input placeholder="Hero-Titel (wird über dem Bild angezeigt)" value={content.heroTitle || ''} onChange={e => setContent({ ...content, heroTitle: e.target.value })} />
            <Textarea rows={4} placeholder="Hero-Beschreibung (wird über dem Bild angezeigt)" value={content.heroText || ''} onChange={e => setContent({ ...content, heroText: e.target.value })} />
            <Input placeholder="Bild-URL (Hero)" value={content.heroUrl || ''} onChange={e => setContent({ ...content, heroUrl: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                <label className="block text-xs text-neutral-400 mb-1">Höhe (px)</label>
                <input
                  type="range"
                  min={200}
                  max={700}
                  step={10}
                  value={content.heroHeight ?? 300}
                  onChange={(e) => setContent({ ...content, heroHeight: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-neutral-300 text-sm mt-1">{content.heroHeight ?? 300}px</div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                <label className="block text-xs text-neutral-400 mb-1">Zoom (%)</label>
                <input
                  type="range"
                  min={100}
                  max={150}
                  step={1}
                  value={content.heroZoom ?? 100}
                  onChange={(e) => setContent({ ...content, heroZoom: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-neutral-300 text-sm mt-1">{content.heroZoom ?? 100}%</div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                <label className="block text-xs text-neutral-400 mb-1">Bild-Fokus X (%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={content.heroFocusX ?? 50}
                  onChange={(e) => setContent({ ...content, heroFocusX: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-neutral-300 text-sm mt-1">{content.heroFocusX ?? 50}%</div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                <label className="block text-xs text-neutral-400 mb-1">Bild-Fokus Y (%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={content.heroFocusY ?? 50}
                  onChange={(e) => setContent({ ...content, heroFocusY: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-neutral-300 text-sm mt-1">{content.heroFocusY ?? 50}%</div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </section>

      {/* Hintergrundbild */}
      <section>
        <ToggleButton label="Hintergrundbild" open={(open as any).bg === true} onClick={() => setOpen(prev => ({ ...prev, bg: !(prev as any).bg }))} />
        {(open as any).bg && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <label className="block text-xs text-neutral-400 mb-1">Bild‑URL (Hintergrund)</label>
              <Input placeholder="https://…/bild.jpg" value={content.backgroundUrl || ''} onChange={e => setContent({ ...content, backgroundUrl: e.target.value })} />
              <div className="mt-2 text-[12px] text-neutral-400">Das Bild wird als statischer Seiten‑Hintergrund verwendet (Cover, zentriert, fixiert).</div>
            </div>
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(() => {
                const cfg = content.backgroundFilter || {} as any;
                const setCfg = (patch: any) => setContent(prev => ({ ...prev, backgroundFilter: { ...(prev.backgroundFilter||{}), ...patch } }));
                return (
                  <>
                    <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                      <label className="block text-xs text-neutral-400 mb-1">Helligkeit ({cfg.brightness ?? 100}%)</label>
                      <input type="range" min={0} max={200} step={1} value={cfg.brightness ?? 100} onChange={e=>setCfg({ brightness: Number(e.target.value) })} className="w-full" />
                      <label className="block text-xs text-neutral-400 mb-1 mt-3">Kontrast ({cfg.contrast ?? 100}%)</label>
                      <input type="range" min={0} max={200} step={1} value={cfg.contrast ?? 100} onChange={e=>setCfg({ contrast: Number(e.target.value) })} className="w-full" />
                      <label className="block text-xs text-neutral-400 mb-1 mt-3">Sättigung ({cfg.saturate ?? 100}%)</label>
                      <input type="range" min={0} max={200} step={1} value={cfg.saturate ?? 100} onChange={e=>setCfg({ saturate: Number(e.target.value) })} className="w-full" />
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Bild‑Position X ({(content.backgroundPosX ?? 50)}%)</label>
                          <input type="range" min={0} max={100} step={1} value={content.backgroundPosX ?? 50} onChange={e=>setContent(prev=>({ ...prev, backgroundPosX: Number(e.target.value) }))} className="w-full" />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Bild‑Position Y ({(content.backgroundPosY ?? 50)}%)</label>
                          <input type="range" min={0} max={100} step={1} value={content.backgroundPosY ?? 50} onChange={e=>setContent(prev=>({ ...prev, backgroundPosY: Number(e.target.value) }))} className="w-full" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                      <label className="block text-xs text-neutral-400 mb-1">Graustufen ({cfg.grayscale ?? 0}%)</label>
                      <input type="range" min={0} max={100} step={1} value={cfg.grayscale ?? 0} onChange={e=>setCfg({ grayscale: Number(e.target.value) })} className="w-full" />
                      <label className="block text-xs text-neutral-400 mb-1 mt-3">Sepia ({cfg.sepia ?? 0}%)</label>
                      <input type="range" min={0} max={100} step={1} value={cfg.sepia ?? 0} onChange={e=>setCfg({ sepia: Number(e.target.value) })} className="w-full" />
                      <label className="block text-xs text-neutral-400 mb-1 mt-3">Weichzeichnen ({cfg.blur ?? 0}px)</label>
                      <input type="range" min={0} max={20} step={1} value={cfg.blur ?? 0} onChange={e=>setCfg({ blur: Number(e.target.value) })} className="w-full" />
                      <label className="block text-xs text-neutral-400 mb-1 mt-3">Farbton (Hue) ({cfg.hue ?? 0}°)</label>
                      <input type="range" min={0} max={360} step={1} value={cfg.hue ?? 0} onChange={e=>setCfg({ hue: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 sm:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Farbfilter (Hex/RGB)</label>
                          <Input placeholder="#000000" value={cfg.tintColor || ''} onChange={e=>setCfg({ tintColor: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Farbfilter‑Deckkraft ({(cfg.tintOpacity ?? 0).toFixed(2)})</label>
                          <input type="range" min={0} max={1} step={0.01} value={cfg.tintOpacity ?? 0} onChange={e=>setCfg({ tintOpacity: Number(e.target.value) })} className="w-full" />
                        </div>
                        <div className="flex items-end">
                          <button type="button" onClick={()=> setContent(prev => ({ ...prev, backgroundFilter: undefined }))} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 w-full">Filter zurücksetzen</button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="rounded-lg bg-neutral-900/60 border-[0.5px] border-neutral-700/30 p-3">
              <div className="text-neutral-300 text-sm mb-2">Vorschau</div>
              {(() => {
                const f = content.backgroundFilter || ({} as any);
                const filterStr = [
                  `brightness(${(f.brightness ?? 100)}%)`,
                  `contrast(${(f.contrast ?? 100)}%)`,
                  `saturate(${(f.saturate ?? 100)}%)`,
                  `grayscale(${(f.grayscale ?? 0)}%)`,
                  `sepia(${(f.sepia ?? 0)}%)`,
                  `blur(${(f.blur ?? 0)}px)`,
                  `hue-rotate(${(f.hue ?? 0)}deg)`
                ].join(' ');
                return (
                  <div className="relative h-56 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700/50">
                    <div
                      className="absolute inset-0"
                      style={{ backgroundImage: content.backgroundUrl ? `url('${content.backgroundUrl}')` : undefined, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: `${content.backgroundPosX ?? 50}% ${content.backgroundPosY ?? 50}%`, filter: filterStr }}
                    />
                    {f.tintColor && (f.tintOpacity ?? 0) > 0 && (
                      <div className="absolute inset-0" style={{ backgroundColor: f.tintColor, opacity: f.tintOpacity ?? 0 }} />
                    )}
                    {!content.backgroundUrl && (
                      <div className="absolute inset-0 flex items-center justify-center text-[#909296] text-sm">Kein Bild</div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </section>

      {/* News / Blog */}
      <section>
        <ToggleButton label="News" open={open.news} onClick={() => setOpen(prev => ({ ...prev, news: !prev.news }))} />
        {open.news && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <label className="flex items-center gap-2 text-neutral-200 text-sm">
                <input type="checkbox" checked={!!content.newsEnabled} onChange={e => setContent({ ...content, newsEnabled: e.target.checked })} />
                News auf der Startseite anzeigen
              </label>
              <button
                type="button"
                onClick={() => {
                  const id = String(Date.now());
                  const post = { id, title: 'Neuer Beitrag', html: '<p>Text...</p>', date: new Date().toISOString().slice(0,10), published: true } as any;
                  setContent(prev => ({ ...prev, news: [ ...(prev.news||[]), post ] }));
                }}
                className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
              >Beitrag hinzufügen</button>
            </div>

            <div className="space-y-3">
              {(content.news||[]).length === 0 && (
                <div className="text-[#909296] text-sm">Keine Beiträge vorhanden.</div>
              )}
              {(content.news||[]).map((p, idx) => (
                <div key={p.id} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Titel" value={p.title || ''} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, title: e.target.value } : x) }))} />
                    <input type="date" value={(p.date||'').slice(0,10)} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, date: e.target.value } : x) }))} className="px-2 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm" />
                    <label className="flex items-center gap-2 text-neutral-200 text-sm">
                      <input type="checkbox" checked={p.published !== false} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, published: e.target.checked } : x) }))} />
                      Veröffentlicht
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocalNewsHtmlMode(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800"
                      title="HTML bearbeiten / Editor umschalten"
                    >{localNewsHtmlMode[p.id] ? 'Editor' : 'HTML'}</button>
                    <button type="button" onClick={() => setContent(prev => ({ ...prev, news: (prev.news||[]).filter((_,i)=> i!==idx) }))} className="ml-auto px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
                  </div>
                  {localNewsHtmlMode[p.id] ? (
                    <textarea
                      className="w-full min-h-[160px] p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 text-neutral-100 font-mono text-sm"
                      value={p.html || ''}
                      onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, html: e.target.value } : x) }))}
                      placeholder="<p>HTML‑Inhalt…</p>"
                    />
                  ) : (
                    <>
                      {/* Simple Rich Text Toolbar */}
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-neutral-800/60 border border-neutral-700/40 text-neutral-200 text-sm">
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => document.execCommand('bold')}>B</button>
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => document.execCommand('italic')}>I</button>
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => document.execCommand('underline')}>U</button>
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => { const url = prompt('Link-URL'); if (url) document.execCommand('createLink', false, url); }}>Link</button>
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => document.execCommand('unlink', false)}>Link entfernen</button>
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => { const c = prompt('Farbe (z.B. #ff0088 oder red)'); if (c) document.execCommand('foreColor', false, c); }}>Farbe</button>
                        <button type="button" className="px-2 py-1 hover:bg-neutral-700/40 rounded" onClick={() => document.execCommand('removeFormat', false)}>Format löschen</button>
                      </div>
                      <div
                        className="min-h-[140px] p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 prose-invert"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const html = (e.currentTarget as HTMLDivElement).innerHTML;
                          setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, html } : x) }));
                        }}
                        dangerouslySetInnerHTML={{ __html: p.html || '' }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Über uns */}
      <section>
        <ToggleButton label="Über uns" open={open.about} onClick={() => setOpen(prev => ({ ...prev, about: !prev.about }))} />
        {open.about && (
          <div className="mt-3 grid grid-cols-1 gap-3">
            <Input placeholder="Titel (Über uns)" value={content.about?.title || ''} onChange={e => setContent({ ...content, about: { ...(content.about||{}), title: e.target.value } })} />
            <Textarea rows={5} placeholder="Text (Über uns)" value={content.about?.text || ''} onChange={e => setContent({ ...content, about: { ...(content.about||{}), text: e.target.value } })} />
          </div>
        )}
      </section>

      {/* Social */}
      <section>
        <ToggleButton label="Social" open={open.socials} onClick={() => setOpen(prev => ({ ...prev, socials: !prev.socials }))} />
        {open.socials && (
          <div className="mt-3 space-y-3">
            <div className="text-[13px] text-[#909296]">Trage hier eure Social-Links ein. Wähle den Kanal und füge die URL hinzu.</div>
            <div className="space-y-2">
              {(content.socials || []).map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center rounded bg-neutral-900 border border-neutral-700/50 flex-shrink-0">
                    {(() => {
                      const t = s.type as any;
                      const cls = 'h-3.5 w-3.5 text-neutral-100';
                      switch (t) {
                        case 'instagram': return <Instagram className={cls} />;
                        case 'facebook': return <Facebook className={cls} />;
                        case 'youtube': return <Youtube className={cls} />;
                        case 'twitter': return <Twitter className={cls} />;
                        case 'linkedin': return <Linkedin className={cls} />;
                        case 'whatsapp': return <MessageCircle className={cls} />;
                        case 'spotify': return <Music2 className={cls} />;
                        case 'soundcloud': return <Music2 className={cls} />;
                        case 'bandcamp': return <Music2 className={cls} />;
                        case 'tiktok': return <Music2 className={cls} />;
                        default: return <Globe className={cls} />;
                      }
                    })()}
                  </div>
                  <select
                    value={s.type}
                    onChange={e => setContent(prev => ({ ...prev, socials: (prev.socials||[]).map((x,i) => i===idx ? { ...x, type: e.target.value as any } : x) }))}
                    className="px-2 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm"
                  >
                    {['instagram','facebook','youtube','tiktok','twitter','linkedin','spotify','soundcloud','bandcamp','website','whatsapp'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="https://…"
                    value={s.url}
                    onChange={e => setContent(prev => ({ ...prev, socials: (prev.socials||[]).map((x,i) => i===idx ? { ...x, url: e.target.value } : x) }))}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setContent(prev => ({ ...prev, socials: (prev.socials||[]).filter((_,i) => i!==idx) }))}
                    className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800"
                  >Entfernen</button>
                </div>
              ))}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setContent(prev => ({ ...prev, socials: [ ...(prev.socials||[]), { type: 'website', url: '' } ] }))}
                className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
              >Eintrag hinzufügen</button>
            </div>
          </div>
        )}
      </section>


      {/* Kontakt */}
      <section>
        <ToggleButton label="Kontakt" open={open.contact} onClick={() => setOpen(prev => ({ ...prev, contact: !prev.contact }))} />
        {open.contact && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="E-Mail" value={content.contact?.email || ''} onChange={e => setContent({ ...content, contact: { ...(content.contact||{}), email: e.target.value } })} />
            <Input placeholder="Telefon" value={content.contact?.phone || ''} onChange={e => setContent({ ...content, contact: { ...(content.contact||{}), phone: e.target.value } })} />
            <Input placeholder="Adresse" value={content.contact?.address || ''} onChange={e => setContent({ ...content, contact: { ...(content.contact||{}), address: e.target.value } })} />
          </div>
        )}
      </section>

      {/* Galerie Verwaltung (Jahr -> Galerie -> Items) */}
      <section>
        <ToggleButton label="Galerien" open={open.gallery} onClick={() => setOpen(prev => ({ ...prev, gallery: !prev.gallery }))} />
        {open.gallery && (
          <div className="mt-3 space-y-3">
            {/* Add/Import controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const yStr = prompt('Jahr für neue Galerie (z. B. 2025)');
                  const y = Number(yStr);
                  if (!validYear(y)) { setError('Bitte gültiges Jahr (1900–2999) angeben.'); return; }
                  const name = prompt('Galeriename');
                  if (!name) { setError('Galeriename darf nicht leer sein.'); return; }
                  addGallery(y, name);
                }}
                className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
              >Galerie hinzufügen</button>
              <button
                type="button"
                onClick={importFromUploads}
                className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
              >Aus Uploads einlesen</button>
            </div>

            {/* Years and galleries */}
            {years.length === 0 && (
              <div className="text-[#909296] text-sm">Noch keine Galerien angelegt.</div>
            )}

            <div className="space-y-4">
              {years.map((y) => (
                <div key={y} className="rounded-xl bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/30">
                    <div className="text-neutral-100 font-semibold">{y}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const name = prompt('Galeriename');
                          if (!name) { setError('Galeriename darf nicht leer sein.'); return; }
                          addGallery(y, name);
                        }}
                        className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-xs"
                      >Galerie hinzufügen</button>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {(galleriesByYear.get(y) || []).map(g => (
                      <div key={g.name} className="rounded-lg bg-neutral-900/60 border border-neutral-700/40">
                        <div
                          className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/30 cursor-pointer"
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button, input, a, label')) return;
                            toggleAdminOpen(y, g.name);
                          }}
                          role="button"
                          aria-expanded={!!adminOpen[`${y}:${g.name}`]}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Collapsed preview */}
                            {(() => {
                              const first = (g.items||[])[0];
                              let purl: string | null = null;
                              if (first) {
                                if (first.type==='image') purl = first.url;
                                else if (first.type==='youtube') purl = getYTThumb(first.url);
                                else if (first.type==='instagram') purl = instaThumbs[first.url] || null;
                              }
                              return purl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={purl} alt="Preview" className="w-10 h-10 rounded object-cover border border-neutral-700/40" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-center text-[10px] text-neutral-400">Keine Vorschau</div>
                              );
                            })()}
                            <input
                              value={g.name}
                              onChange={e => renameGallery(y, g.name, e.target.value)}
                              className="px-2 py-1 rounded bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm min-w-[180px]"
                            />
                            <span className="px-2 py-0.5 rounded text-[11px] border bg-neutral-700/20 text-neutral-300 border-neutral-600/40">{(g.items||[]).length} Elemente</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Status control with popup */}
                            <div className="relative gal-status-menu">
                              <button
                                onClick={(e) => { e.stopPropagation(); setStatusOpen(prev => ({ ...prev, [`${y}:${g.name}`]: !prev[`${y}:${g.name}`] })); }}
                                className={`px-2 py-1 rounded border text-xs ${statusClass((g as any).status)}`}
                                title="Galerie‑Status wählen"
                              >{statusLabel((g as any).status)}</button>
                              {statusOpen[`${y}:${g.name}`] && (
                                <div className="absolute right-0 mt-1 w-40 rounded-md border border-neutral-700 bg-neutral-900 shadow-xl p-1 z-50" onClick={(e)=>e.stopPropagation()}>
                                  <button className={`w-full text-left px-3 py-1.5 rounded ${((g as any).status||'public')==='public' ? 'bg-green-900/30 text-green-200' : 'text-neutral-200 hover:bg-neutral-800'}`} onClick={()=>{ setGalleryStatus(y, g.name, 'public', (g as any).items); setStatusOpen(prev=>({ ...prev, [`${y}:${g.name}`]: false })); }}>Öffentlich</button>
                                  <button className={`w-full text-left px-3 py-1.5 rounded ${((g as any).status)==='internal' ? 'bg-blue-900/30 text-blue-200' : 'text-neutral-200 hover:bg-neutral-800'}`} onClick={()=>{ setGalleryStatus(y, g.name, 'internal', (g as any).items); setStatusOpen(prev=>({ ...prev, [`${y}:${g.name}`]: false })); }}>Intern</button>
                                  <button className={`w-full text-left px-3 py-1.5 rounded ${((g as any).status)==='locked' ? 'bg-red-900/30 text-red-200' : 'text-neutral-200 hover:bg-neutral-800'}`} onClick={()=>{ setGalleryStatus(y, g.name, 'locked', (g as any).items); setStatusOpen(prev=>({ ...prev, [`${y}:${g.name}`]: false })); }}>Gesperrt</button>
                                </div>
                              )}
                            </div>
                            {/* Delete first, then plus/minus at far right of this control group */}
                            <button
                              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Galerie "${g.name}" (${y}) wirklich löschen?`)) removeGallery(y, g.name); }}
                              className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs"
                            >Galerie löschen</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleAdminOpen(y, g.name); }}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800"
                              title={adminOpen[`${y}:${g.name}`] ? 'Zuklappen' : 'Aufklappen'}
                              aria-label={adminOpen[`${y}:${g.name}`] ? 'Zuklappen' : 'Aufklappen'}
                            >
                              <span className="text-base leading-none">{adminOpen[`${y}:${g.name}`] ? '−' : '+'}</span>
                            </button>
                          </div>
                        </div>
                        {adminOpen[`${y}:${g.name}`] && (
                        <div className="p-3 space-y-2">
                          {/* Items list */}
                          {(g.items||[]).length === 0 && <div className="text-[#909296] text-sm">Keine Elemente</div>}
                          {(g.items||[]).map((it, idx) => (
                            <div key={idx} className="relative flex items-center gap-3 p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/40 group">
                              <div className="w-16 h-12 rounded overflow-hidden bg-neutral-900 border border-neutral-700/50 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {it.type==='image' ? (
                                  <img src={it.url} alt={it.title||`Bild ${idx+1}`} className="w-full h-full object-cover"/>
                                ) : it.type==='video' ? (
                                  <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-300">Video</div>
                                ) : it.type==='youtube' ? (
                                  <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-300">YouTube</div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-300">Instagram</div>
                                )}
                              </div>
                              {/* Hover preview outside of overflow container */}
                              {it.type==='image' && (
                                <div className="pointer-events-none absolute left-20 top-2 hidden group-hover:block z-50">
                                  <div className="rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700 shadow-xl">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={it.url} alt={it.title||`Bild ${idx+1}`} className="w-[360px] h-[240px] object-contain bg-black" />
                                  </div>
                                </div>
                              )}
                              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                                <div className="min-w-0">
                                  <div className="text-neutral-200 text-sm truncate">{it.title || it.url}</div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <button onClick={() => moveItem(y, g.name, idx, -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">↑</button>
                                  <button onClick={() => moveItem(y, g.name, idx, 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">↓</button>
                                  <a href={it.url} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Öffnen</a>
                                  <button onClick={() => removeItem(y, g.name, idx)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Add item controls */}
                          <div className="flex items-center flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const u = prompt('Bild-URL einfügen'); if (u) addItemUrl(y, g.name, 'image', u);
                              }}
                              className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-sm"
                            >Bild-URL</button>
                            <button
                              onClick={() => {
                                const u = prompt('Video-URL einfügen'); if (u) addItemUrl(y, g.name, 'video', u);
                              }}
                              className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-sm"
                            >Video-URL</button>
                            <button
                              onClick={() => {
                                const u = prompt('YouTube-Link einfügen (https://youtu.be/… oder https://www.youtube.com/watch?v=…)'); if (u) addItemUrl(y, g.name, 'youtube', u);
                              }}
                              className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-sm"
                            >YouTube-Link</button>
                            <button
                              onClick={() => {
                                const u = prompt('Instagram-Link einfügen (Beitrag/Reel URL)'); if (u) addItemUrl(y, g.name, 'instagram', u);
                              }}
                              className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-sm"
                            >Instagram-Link</button>
                            {/* Multi-file upload */}
                            <label className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 text-sm cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={async (e) => {
                                  const input = e.currentTarget;
                                  const files = input.files ? Array.from(input.files) : [];
                                  input.value = '';
                                  for (const f of files) {
                                    await uploadItem(y, g.name, f);
                                  }
                                }}
                              />
                              Dateien hochladen
                            </label>

                            
                          </div>
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button disabled={saving} onClick={save} className="mt-2 px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>
          </div>
        )}
      </section>

      

      {/* Karte (zuletzt) */}
      <section>
        <ToggleButton label="Karte / Google Maps" open={open.map} onClick={() => setOpen(prev => ({ ...prev, map: !prev.map }))} />
        {open.map && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Adresse (z. B. Karl-Liebknecht-Straße 1, Leipzig)" value={content.mapAddress || ''} onChange={e => setContent({ ...content, mapAddress: e.target.value })} />
            <Input placeholder="Maps Embed URL (optional)" value={content.map?.embedUrl || ''} onChange={e => setContent({ ...content, map: { ...(content.map||{}), embedUrl: e.target.value } })} />
            <div className="md:col-span-3">
              {content.map?.embedUrl ? (
                <div className="relative left-1/2 -translate-x-1/2 w-[min(1200px,100vw)]">
                  <iframe
                    title="Karte Vorschau"
                    src={content.map.embedUrl}
                    className="w-full h-72 md:h-96 rounded-lg border border-neutral-700/40"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="text-[#909296] text-sm">Füge eine Maps Embed URL ein, um die Vorschau zu sehen.</div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Save button at the very end */}
      <div className="flex justify-end">
        <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
      </div>
    </div>
  );
};

export default AdminContentPanel;
