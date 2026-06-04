import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE, contentGet, contentSave, uploadFile, scanUploads, writeMetadata, deleteGallery, deleteUploads, bookingRequestsList, type SiteContent, newsletterSubscribersList, newsletterCampaignsList, newsletterCampaignSave, newsletterCampaignDelete, newsletterSend, type NewsletterSubscriber, type NewsletterCampaign } from '../lib/api';
import { Globe, Instagram, Facebook, Youtube, Twitter, Linkedin, Music2, MessageCircle, Check, AlertTriangle, X } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import LandingPage from './LandingPage';

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

const CopyLandingLink: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?view=landing`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button onClick={handleCopy} className="text-xs px-2 py-1 rounded border border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 transition-colors">
      {copied ? 'Kopiert!' : 'Link kopieren'}
    </button>
  );
};

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

const HeaderLogoPicker: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
  previewBg: string;
  galleries: Array<{ year: number; name: string; items?: Array<{ type: string; url: string }> }>;
}> = ({ label, value, onChange, previewBg, galleries }) => {
  const [selectedYear, setSelectedYear] = React.useState<number | ''>('');
  const [selectedGallery, setSelectedGallery] = React.useState<{ year: number; name: string } | null>(null);

  const years = React.useMemo(() => [...new Set(galleries.map(g => g.year))].sort((a, b) => b - a), [galleries]);
  const filteredGalleries = React.useMemo(() =>
    selectedYear !== '' ? galleries.filter(g => g.year === selectedYear) : galleries,
    [galleries, selectedYear]
  );
  const galleryImages = React.useMemo(() => {
    if (!selectedGallery) return [];
    const g = galleries.find(g => g.year === selectedGallery.year && g.name === selectedGallery.name);
    return (g?.items || []).filter(it => it.type === 'image');
  }, [galleries, selectedGallery]);

  return (
    <div>
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      <Input
        placeholder="https://…/logo.png"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {galleries.length > 0 && (
        <div className="mt-2 space-y-2">
          {/* Year filter */}
          <select
            className="w-full px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm"
            value={selectedYear === '' ? '' : String(selectedYear)}
            onChange={e => {
              const y = e.target.value ? Number(e.target.value) : '';
              setSelectedYear(y);
              setSelectedGallery(null);
            }}
          >
            <option value="">Alle Jahre</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Gallery selector */}
          <select
            className="w-full px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm"
            value={selectedGallery ? `${selectedGallery.year}::${selectedGallery.name}` : ''}
            onChange={e => {
              const val = e.target.value;
              if (!val) { setSelectedGallery(null); return; }
              const [y, name] = val.split('::');
              setSelectedGallery({ year: Number(y), name });
            }}
          >
            <option value="">Galerie wählen…</option>
            {filteredGalleries.map(g => (
              <option key={`${g.year}::${g.name}`} value={`${g.year}::${g.name}`}>{g.year} — {g.name}</option>
            ))}
          </select>

          {/* Image thumbnails grid */}
          {selectedGallery && galleryImages.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(img.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    value === img.url ? 'border-[#4ECBD9] ring-2 ring-[#4ECBD9]/30' : 'border-neutral-700 hover:border-neutral-500'
                  }`}
                  title={img.url.split('/').pop() || ''}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {value === img.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedGallery && galleryImages.length === 0 && (
            <div className="text-xs text-neutral-500">Keine Bilder in dieser Galerie.</div>
          )}
        </div>
      )}
      {value && (
        <div className={`mt-2 p-2 rounded-lg border border-neutral-700/30 ${previewBg}`}>
          <img src={value} alt={`${label} Preview`} className="h-10 w-auto object-contain" />
        </div>
      )}
    </div>
  );
};

const AdminContentPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [newsMode, setNewsMode] = useState<Record<string, 'editor'|'html'|'preview'>>({});
  const [newsPostOpen, setNewsPostOpen] = useState<Record<string, boolean>>({});
  const [newsLang, setNewsLang] = useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return v === 'en' ? 'en' : 'de'; } catch { return 'de'; }
  });
  const [aboutLang, setAboutLang] = useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return v === 'en' ? 'en' : 'de'; } catch { return 'de'; }
  });
  const [previewTheme, setPreviewTheme] = useState<'light'|'dark'>(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  // Observe theme for light/dark specific styles
  const [theme, setTheme] = useState<'dark'|'light'>(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      setTheme(isLight ? 'light' : 'dark');
    });
    try { observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch {}
    const onStorage = (e: StorageEvent) => { if (e.key === 'theme') setTheme(e.newValue === 'light' ? 'light' : 'dark'); };
    window.addEventListener('storage', onStorage);
    return () => { try { observer.disconnect(); } catch {}; window.removeEventListener('storage', onStorage); };
  }, []);
  const readI18n = (v: string | { de?: string; en?: string } | undefined, l: 'de'|'en'): string => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return (v[l] || '') as string;
  };


  // Helper: robustly fetch metadata.json for a given gallery.
  const fetchGalleryMeta = async (year: number, name: string, sampleUrl?: string) => {
    const encName = encodeURIComponent(name || '');
    const candidates: string[] = [];
    // Determine server base (strip trailing /server/api from API_BASE)
    let serverBase = '';
    try { serverBase = (API_BASE || '').replace(/\/server\/api\/?$/,''); } catch {}
    // 1) Try deriving from a known item URL (replace filename with metadata.json)
    if (sampleUrl) {
      try {
        const u = new URL(sampleUrl, window.location.origin);
        const parts = u.pathname.split('/');
        if (parts.length >= 4) { parts[parts.length - 1] = 'metadata.json'; candidates.push(parts.join('/')); }
      } catch {}
    }
    // 2) Server-side served path
    candidates.push(`${serverBase}/server/uploads/${year}/${encName}/metadata.json`);
    // 3) Public uploads path
    candidates.push(`${serverBase}/uploads/${year}/${encName}/metadata.json`);
    for (const p of candidates) {
      try {
        const resp = await fetch(p, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json().catch(()=>null);
          if (data && typeof data === 'object') return data as any;
        }
      } catch {}
    }
    return null;
  };

  // Prune all galleries to match metadata.json (keep items listed in metadata; drop others).
  const [pruneBusy, setPruneBusy] = useState(false);
  const writeI18n = (v: string | { de?: string; en?: string } | undefined, l: 'de'|'en', next: string): { de?: string; en?: string } | string => {
    if (typeof v === 'string') {
      return l === 'de' ? { de: next, en: v } : { de: v, en: next };
    }
    return { ...(v||{}), [l]: next } as any;
  };
  const stripInlineColors = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('[style]').forEach(el => {
        const style = (el.getAttribute('style') || '');
        const cleaned = style.replace(/color:\s*[^;]+;?/gi, '').trim();
        if (cleaned) el.setAttribute('style', cleaned);
        else el.removeAttribute('style');
      });
      doc.querySelectorAll('span:not([style]):not([class])').forEach(el => {
        const span = el as HTMLSpanElement;
        while (span.firstChild) {
          span.parentNode!.insertBefore(span.firstChild, span);
        }
        if (span.parentNode) span.parentNode.removeChild(span);
      });
      return doc.body.innerHTML;
    } catch {
      return html;
    }
  };
  const [bookingReqs, setBookingReqs] = useState<Array<{ id: string; name: string; email: string; date?: string; event?: string; location?: string; budget?: string; message?: string; created_at?: string }>>([]);
  const [bookingReqsLoading, setBookingReqsLoading] = useState(false);
  const [bookingReqsError, setBookingReqsError] = useState<string | null>(null);
  // Newsletter
  const [newsletterTab, setNewsletterTab] = useState<'subscribers' | 'campaigns' | 'editor'>('subscribers');
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState<NewsletterCampaign[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterEditorLang, setNewsletterEditorLang] = useState<'de'|'en'>('de');
  const [activeCampaign, setActiveCampaign] = useState<NewsletterCampaign | null>(null);
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterSendMsg, setNewsletterSendMsg] = useState<string | null>(null);

  // About main text: mode per language ('editor' | 'html' | 'preview')
  const [aboutTextMode, setAboutTextMode] = useState<Record<'de'|'en', 'editor'|'html'|'preview'>>({ de: 'editor', en: 'editor' });
  // Background filter theme being edited/previewed
  const [bgTheme, setBgTheme] = useState<'light'|'dark'>(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; } catch { return 'light'; }
  });

  

  const gallery = useMemo(() => content.gallery || [], [content.gallery]);
  const galleries = useMemo(() => Array.isArray(content.galleries) ? content.galleries : [], [content.galleries]);
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const g of galleries) { if (typeof g.year === 'number') set.add(g.year); }
    return Array.from(set).sort((a,b)=> b-a);
  }, [galleries]);
  const galleriesByYear = useMemo(() => {
    // Preserve saved order within each year (array order)
    const map = new Map<number, { name: string; items: any[]; status?: 'public'|'internal'|'locked' }[]>();
    for (const g of galleries) {
      const arr = map.get(g.year) || [];
      arr.push({ name: g.name, items: g.items||[], status: (g as any).status });
      map.set(g.year, arr);
    }
    return map;
  }, [galleries]);
  const allGalleryImages = useMemo(() => {
    const urls: string[] = [];
    for (const g of galleries) {
      for (const it of (g.items||[])) {
        if (it?.url && (it.type==='image' || (!it.type && String(it.url).match(/\.(jpg|jpeg|png|gif|webp|svg)/i)))) {
          urls.push(it.url);
        }
      }
    }
    return urls;
  }, [galleries]);

  const upsertContent = (patch: Partial<SiteContent>) => setContent(prev => ({ ...prev, ...patch }));
  const setGalleries = (next: SiteContent['galleries']) => upsertContent({ galleries: next });
  // Manage ignore list for scanned galleries so deleted ones don't reappear
  const getIgnore = () => (Array.isArray((content as any).galleriesIgnore) ? (content as any).galleriesIgnore as Array<{ year: number; name: string }> : []);
  const addIgnore = (year: number, name: string) => {
    const key = `${year}:::${name}`.toLowerCase();
    const list = getIgnore();
    if (!list.some(g => `${g.year}:::${g.name}`.toLowerCase() === key)) {
      upsertContent({ galleriesIgnore: [ ...list, { year, name } ] as any });
    }
  };
  const removeIgnore = (year: number, name: string) => {
    const key = `${year}:::${name}`.toLowerCase();
    const list = getIgnore();
    const next = list.filter(g => `${g.year}:::${g.name}`.toLowerCase() !== key);
    if (next.length !== list.length) upsertContent({ galleriesIgnore: next as any });
  };
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ');
  const galleryExists = (year: number, name: string) => (galleries||[]).some(g => g.year === year && g.name.toLowerCase() === name.toLowerCase());
  const validYear = (y: number) => Number.isFinite(y) && y >= 1900 && y <= 2999;
  const addGallery = async (year: number, name: string) => {
    const y = Number(year);
    const n = norm(name || '');
    if (!validYear(y)) { setError('Bitte gültiges Jahr (1900–2999) angeben.'); return; }
    if (!n) { setError('Galeriename darf nicht leer sein.'); return; }
    if (galleryExists(y, n)) { setError('Diese Galerie existiert bereits.'); return; }
    setError(null);
    // Create folder on server first
    try {
      await writeMetadata(y, n, [], 'public');
    } catch (e) {
      setError('Ordner konnte nicht erstellt werden: ' + (e instanceof Error ? e.message : String(e)));
      return;
    }
    setGalleries([...(galleries||[]), { year: y, name: n, items: [], status: 'public' }]);
    removeIgnore(y, n);
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

  // Info toggle per item (year:name:idx)
  const [infoOpen, setInfoOpen] = useState<Record<string, boolean>>({});
  const toggleInfo = (key: string) => setInfoOpen(prev => ({ ...prev, [key]: !prev[key] }));
  // Admin: gallery expand/collapse state (default collapsed)
  const [adminOpen, setAdminOpen] = useState<Record<string, boolean>>({});
  const toggleAdminOpen = (y: number, name: string) => setAdminOpen(prev => ({ ...prev, [`${y}:${name}`]: !prev[`${y}:${name}`] }));
  // Year expand/collapse state (default collapsed = false)
  const [yearOpen, setYearOpen] = useState<Record<number, boolean>>({});
  const toggleYearOpen = (y: number) => setYearOpen(prev => ({ ...prev, [y]: !prev[y] }));
  // Selection per gallery removed; Scan-Report works auf alle Galerien
  // Scan report state
  type ScanEntry = { year: number; name: string; metaCount: number; serverCount: number; diff: number; extraFiles: Array<{ filename: string; url: string; type: 'image'|'video'; selected?: boolean }>; missingInServer: Array<{ type: string; url: string }>; error?: string; metaStatus?: 'public'|'internal'|'locked' };
  const [scanLoading, setScanLoading] = useState(false);
  const [scanReport, setScanReport] = useState<ScanEntry[] | null>(null);
  const clearScanReport = () => setScanReport(null);
  const scanGalleries = async () => {
    setScanLoading(true); setError(null); setOk(null);
    try {
      const list = (galleries||[]);
      const out: ScanEntry[] = [];
      for (const g of list) {
        try {
          const q = new URLSearchParams({ year: String(g.year), gallery: String(g.name) });
          const url = `${API_BASE}/scan_gallery.php?${q.toString()}`;
          const resp = await fetch(url, { credentials: 'include' });
          let data: any = null;
          try { data = await resp.json(); }
          catch (_) {
            let txt = '';
            try { txt = await resp.text(); } catch {}
            const snippet = txt ? txt.slice(0, 200) : '';
            throw new Error(`HTTP ${resp.status} ${resp.statusText}${snippet ? `: ${snippet}` : ''}`);
          }
          if (!resp.ok || !data?.ok) throw new Error(data?.error||`HTTP ${resp.status} ${resp.statusText}`);
          const extras = Array.isArray(data.extraFiles) ? data.extraFiles.map((e: any)=>({ filename: String(e.filename||''), url: String(e.url||''), type: (e.type==='video'?'video':'image') as 'image'|'video', selected: true })) : [];
          const st = data.metaStatus;
          const metaStatus = (st==='public'||st==='internal'||st==='locked') ? st : undefined;
          out.push({ year: Number(data.year), name: String(data.gallery), metaCount: Number(data.metaCount||0), serverCount: Number(data.serverCount||0), diff: Number(data.diff||0), extraFiles: extras, missingInServer: Array.isArray(data.missingInServer)? data.missingInServer as any : [], metaStatus });
        } catch (e: any) {
          out.push({ year: Number(g.year), name: g.name, metaCount: 0, serverCount: 0, diff: 0, extraFiles: [], missingInServer: [], error: e?.message||'Fehler' });
        }
      }
      setScanReport(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan fehlgeschlagen');
    } finally { setScanLoading(false); }
  };
  const deleteExtras = async (entry: ScanEntry) => {
    const files = entry.extraFiles.filter(f=>f.selected).map(f=>f.filename||f.url).filter(Boolean);
    if (files.length===0) { window.alert('Bitte Dateien auswählen.'); return; }
    const ok = window.confirm(`Wirklich ${files.length} Datei(en) in ${entry.year} / ${entry.name} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`);
    if (!ok) return;
    try {
      const resp = await fetch(`${API_BASE}/delete_uploads.php`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year: entry.year, gallery: entry.name, files }) });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error||'Löschen fehlgeschlagen');
      const deleted: string[] = Array.isArray(data.deleted) ? data.deleted : [];
      setOk(`Gelöscht: ${deleted.length}`);
      // Update report view and local gallery items (remove deleted files from items too)
      setScanReport(prev => (prev||[]).map(en => {
        if (en.year!==entry.year || en.name!==entry.name) return en;
        const rest = en.extraFiles.filter(f => !deleted.includes(f.filename));
        const newServerCount = en.serverCount - deleted.length;
        return { ...en, extraFiles: rest, serverCount: newServerCount, diff: newServerCount - en.metaCount };
      }));
      // Remove from current content items by URL match (best-effort)
      const updated = (galleries||[]).map(g => {
        if (g.year!==entry.year || g.name!==entry.name) return g;
        const urlsDeleted = new Set<string>(entry.extraFiles.filter(f=>f.selected).map(f=>f.url));
        const items = (g.items||[]).filter((it:any)=> !urlsDeleted.has(String(it?.url||'')));
        return { ...g, items };
      });
      setGalleries(updated as any);
    } catch (e:any) {
      setError(e?.message||'Löschen fehlgeschlagen');
    }
  };

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
      // Build per-gallery metadata whitelist (type@@url) for image/video
      type Item = { type: 'image'|'video'|'youtube'|'instagram'; url: string };
      const sig = (it: Item) => `${it.type}@@${it.url}`;
      const metaWhitelist = new Map<string, Set<string>>(); // key: year:::name
      await Promise.all(scanned.map(async (sg: any) => {
        try {
          const key = `${sg.year}:::${sg.name}`.toLowerCase();
          const firstUrl = Array.isArray(sg.items) && sg.items.length ? sg.items[0]?.url : undefined;
          const data = await fetchGalleryMeta(Number(sg.year), String(sg.name||''), firstUrl);
          if (data) {
            const arr: Item[] = Array.isArray((data as any)?.items) ? (data as any).items : [];
            const set = new Set<string>();
            arr.forEach(it => { if (it?.url && (it.type==='image' || it.type==='video')) set.add(sig(it)); });
            metaWhitelist.set(key, set);
          }
        } catch {}
      }));
      // Merge: union with existing by (year,name), preserve prev items and status.
      // DO NOT resurrect deleted galleries or items unless admin confirms.
      const keyOf = (y: number, n: string) => `${y}:::${n}`.toLowerCase();
      const prevMap = new Map<string, any>();
      (galleries||[]).forEach(pg => prevMap.set(keyOf(pg.year, pg.name), { ...pg, items: (pg.items||[]).slice() }));
      const outMap = new Map<string, any>(prevMap);
      const newGalleries: any[] = [];
      const newItemsByKey: Record<string, any[]> = {};
      const sigAny = (it: any) => `${it.type||''}@@${it.url||''}`;
      const ignoredSet = new Set<string>(getIgnore().map(g => `${g.year}:::${g.name}`.toLowerCase()));
      scanned.forEach((sg: any) => {
        const k = keyOf(sg.year, sg.name);
        const prev = prevMap.get(k);
        const status = sg.status ?? prev?.status ?? undefined;
        const scanItems = Array.isArray(sg.items) ? sg.items : [];
        if (!prev) {
          // New gallery found by scan; skip if ignored, otherwise propose
          if (!ignoredSet.has(k)) {
            // If metadata whitelist exists, only propose whitelisted files for image/video
            const wl = metaWhitelist.get(k);
            const filtered = wl && wl.size
              ? scanItems.filter((it: any) => (it?.type==='image'||it?.type==='video') ? wl.has(sigAny(it)) : true)
              : scanItems;
            newGalleries.push({ year: sg.year, name: sg.name, status, items: filtered });
          }
          return;
        }
        // Existing gallery: keep previous items, track new ones separately
        const prevItems = Array.isArray(prev.items) ? prev.items : [];
        const seen = new Set<string>(prevItems.map(sigAny));
        const newOnes: any[] = [];
        scanItems.forEach((it: any) => {
          const s = sigAny(it);
          if (seen.has(s)) return;
          // Apply whitelist for image/video if available
          const wl = metaWhitelist.get(k);
          if ((it?.type==='image' || it?.type==='video') && wl && wl.size && !wl.has(s)) return;
          newOnes.push(it);
        });
        if (newOnes.length) newItemsByKey[k] = newOnes;
        outMap.set(k, { year: sg.year, name: sg.name, status, items: prevItems });
      });

      // Ask for confirmation to add newly discovered galleries and items
      let confirmText = '';
      if (newGalleries.length) confirmText += `Neue Ordner gefunden: ${newGalleries.length}. `;
      const newItemsTotal = Object.values(newItemsByKey).reduce((a,b)=> a + (b?.length||0), 0);
      if (newItemsTotal) confirmText += `Neue Dateien gefunden: ${newItemsTotal}. `;
      if (confirmText) {
        confirmText += '\nSollen diese übernommen werden?';
        const ok = window.confirm(confirmText);
        if (ok) {
          // Add galleries
          newGalleries.forEach(g => { outMap.set(keyOf(g.year, g.name), g); removeIgnore(g.year, g.name); });
          // Add new items into existing galleries
          Object.entries(newItemsByKey).forEach(([k, arr]) => {
            const cur = outMap.get(k);
            const currItems = Array.isArray(cur?.items) ? cur.items.slice() : [];
            const seen = new Set<string>(currItems.map(sig));
            for (const it of arr) { const s = sig(it); if (!seen.has(s)) { seen.add(s); currItems.push(it); } }
            outMap.set(k, { ...cur, items: currItems });
          });
        }
      }

      // Preserve galleries that existed but weren't in scan (e.g., external-only galleries) are already in outMap
      const merged = Array.from(outMap.values());
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
  const removeGallery = async (year: number, name: string) => {
    // Delete from server first
    try { await deleteGallery(year, name); } catch {}
    // Then remove from state
    setGalleries((galleries||[]).filter(g => !(g.year===year && g.name===name)));
    addIgnore(year, name);
  };
  const moveGallery = (year: number, name: string, dir: -1|1) => {
    setContent(prev => {
      type Gal = NonNullable<SiteContent['galleries']>[number];
      const arr = ((prev.galleries || []) as NonNullable<SiteContent['galleries']>).slice();
      const idxs = (arr as Gal[]).map((g, i) => [g, i] as const).filter(([g]) => g.year === year).map(([, i]) => i);
      const currentIndex = (arr as Gal[]).findIndex(g => g.year === year && g.name === name);
      if (currentIndex < 0) return prev;
      const posInYear = idxs.indexOf(currentIndex);
      const neighborPos = posInYear + dir;
      if (neighborPos < 0 || neighborPos >= idxs.length) return prev;
      const j = idxs[neighborPos];
      const tmp = arr[currentIndex]; (arr as Gal[])[currentIndex] = arr[j] as Gal; (arr as Gal[])[j] = tmp as Gal;
      return { ...prev, galleries: arr };
    });
  };
  const addItemUrl = (year: number, name: string, type: 'image'|'video'|'youtube'|'instagram', url: string) => setGalleries((galleries||[]).map(g => (g.year===year && g.name===name) ? { ...g, items: [ ...(g.items||[]), { type, url } ] } : g));
  const removeItem = async (year: number, name: string, idx: number) => {
    const gal = (galleries||[]).find(g => g.year===year && g.name===name);
    const item = gal?.items?.[idx];
    // Delete file from server if it's an image/video (not external links)
    if (item && (item.type==='image' || item.type==='video') && item.url) {
      try {
        await deleteUploads(year, name, [item.url]);
      } catch {}
    }
    // Remove from state
    setGalleries((galleries||[]).map(g => (g.year===year && g.name===name) ? { ...g, items: (g.items||[]).filter((_,i)=>i!==idx) } : g));
  };
  const moveItem = (year: number, name: string, idx: number, dir: -1|1) => setGalleries((galleries||[]).map(g => {
    if (!(g.year===year && g.name===name)) return g;
    const it = (g.items||[]).slice();
    const j = idx+dir; if (j<0||j>=it.length) return g;
    const tmp = it[idx]; it[idx] = it[j]; it[j] = tmp; return { ...g, items: it };
  }));
  const uploadItem = async (year: number, name: string, file: File): Promise<{type: 'image'|'video', url: string} | null> => {
    const res = await uploadFile(file, { year, gallery: name });
    const url = res?.url || '';
    const t: 'image'|'video' = (file.type||'').startsWith('video') ? 'video' : 'image';
    return url ? { type: t, url } : null;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contentGet();
      const baseContent = res.content || {};
      // Sync galleries from server upload folders to ensure content.json reflects actual files
      try {
        const scan = await scanUploads();
        if (scan.ok && Array.isArray(scan.galleries) && scan.galleries.length > 0) {
          const scannedMap = new Map<string, typeof scan.galleries[0]>();
          for (const g of scan.galleries) {
            scannedMap.set(`${g.year}::${g.name}`, g);
          }
          const mergedGalleries = (baseContent.galleries || []).map((g: any) => {
            const key = `${g.year}::${g.name}`;
            if (scannedMap.has(key)) {
              const scanned = scannedMap.get(key)!;
              scannedMap.delete(key);
              return { ...g, items: scanned.items };
            }
            // Gallery not found on server - keep only if it has external links (youtube/instagram)
            const items = g.items || [];
            const hasExternalLinks = items.some((it: any) => it.type === 'youtube' || it.type === 'instagram');
            return hasExternalLinks ? g : null;
          }).filter(Boolean) as any[];
          // Add any galleries found on server but not in content.json (except ignored ones)
          const ignoredSet = new Set<string>((baseContent.galleriesIgnore || []).map((ig: any) => `${ig.year}::${ig.name}`.toLowerCase()));
          for (const [, g] of scannedMap) {
            const key = `${g.year}::${g.name}`.toLowerCase();
            if (!ignoredSet.has(key)) {
              mergedGalleries.push(g);
            }
          }
          // Sort by year desc, name asc
          mergedGalleries.sort((a: any, b: any) => {
            if (a.year === b.year) return (a.name || '').localeCompare(b.name || '');
            return (b.year || 0) - (a.year || 0);
          });
          setContent({ ...baseContent, galleries: mergedGalleries });
        } else {
          setContent(baseContent);
        }
      } catch {
        setContent(baseContent);
      }
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
      // Sync gallery items to metadata.json so externe Links (YouTube/Instagram) erhalten bleiben
      try {
        const gals = Array.isArray(res.content?.galleries) ? res.content.galleries : [];
        for (const g of gals) {
          try { await writeMetadata(g.year as any, g.name as any, (g.items||[]) as any, (g as any).status); } catch (_) {}
        }
      } catch (_) {}
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
    header: false,
    contact: false,
    gallery: false,
    map: false,
    booking: false,
    about: false,
    socials: false,
    news: false,
    mediaEmbeds: false,
    legal: false,
    cards: false,
    landingPage: false,
    newsletter: false,
  });

  // Auto-load newsletter data when section opens (must be after 'open' declaration to avoid TDZ in minified build)
  useEffect(() => {
    if ((open as any).newsletter) {
      (async () => {
        setNewsletterLoading(true);
        setNewsletterError(null);
        try {
          const [subRes, campRes] = await Promise.all([
            newsletterSubscribersList(),
            newsletterCampaignsList(),
          ]);
          setNewsletterSubscribers(subRes.subscribers || []);
          setNewsletterCampaigns(campRes.campaigns || []);
        } catch (e: any) {
          setNewsletterError(e instanceof Error ? e.message : 'Fehler beim Laden');
        } finally {
          setNewsletterLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(open as any).newsletter]);

  

  // Admin cards order (server-side via content.adminOrder)
  const defaultAdminOrder = ['sections','hero','header','bg','cards','about','news','socials','contact','mediaEmbeds','gallery','booking','legal','landingPage','newsletter'] as const;
  type AdminKey = typeof defaultAdminOrder[number];
  const [adminEdit, setAdminEdit] = useState(false);
  const getAdminOrder = (): AdminKey[] => {
    try {
      const saved = Array.isArray((content as any).adminOrder) ? ((content as any).adminOrder as string[]) : [];
      if (saved.length) {
        const base = defaultAdminOrder.slice() as AdminKey[];
        const filtered = (saved.filter(k => (base as any).includes(k)) as AdminKey[]);
        base.forEach(k => { if (!filtered.includes(k)) filtered.push(k); });
        return filtered as AdminKey[];
      }
    } catch {}
    return defaultAdminOrder.slice() as AdminKey[];
  };
  const orderOf = (key: AdminKey) => {
    const arr = getAdminOrder();
    const i = arr.indexOf(key);
    return i >= 0 ? i : 999;
  };
  const moveAdmin = (key: AdminKey, dir: -1|1) => {
    const arr = getAdminOrder().slice();
    const i = arr.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    setContent(prev => ({ ...prev, adminOrder: arr as any }));
  };

  const [legalLang, setLegalLang] = useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return v === 'en' ? 'en' : 'de'; } catch { return 'de'; }
  });
  const [legalMode, setLegalMode] = useState<{ impressum: Record<'de'|'en','editor'|'html'|'preview'>; privacy: Record<'de'|'en','editor'|'html'|'preview'>}>({
    impressum: { de: 'editor', en: 'editor' },
    privacy: { de: 'editor', en: 'editor' },
  });
  const [adminTab, setAdminTab] = useState<'content' | 'design'>('content');

  

  if (loading) return <div className="text-neutral-400">Lade Inhalte…</div>;

  const sectionStyle = (key: AdminKey, tab: 'content' | 'design') => ({
    display: (adminTab === tab ? 'block' : 'none') as 'block' | 'none',
    order: orderOf(key),
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#DC2626] text-sm">{error}</div>}
      {ok && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-neutral-200 text-sm">{ok}</div>}

      {/* Admin Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAdminTab('content')}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
            adminTab === 'content'
              ? 'bg-white text-neutral-900 border-neutral-200 shadow-sm'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
          }`}
        >
          Inhalte & Texte
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('design')}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
            adminTab === 'design'
              ? 'bg-white text-neutral-900 border-neutral-200 shadow-sm'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
          }`}
        >
          Design & Layout
        </button>
      </div>

      {/* Abschnitte anordnen */}
      <section
        style={sectionStyle('sections', 'design')}
      >
        <ToggleButton label="Abschnitte anordnen" open={(open as any).sections === true} onClick={() => setOpen(prev => ({ ...prev, sections: !(prev as any).sections }))} />
        {(open as any).sections && (
          <div className="mt-3 space-y-2">
            {(() => {
              // Allowed sections (no 'map' here)
              const labels: Record<string,string> = { news: 'News (Hero)', events: 'Events / Termine', booking: 'Booking', media: 'Media (Galerien)', about: 'Über uns', social: 'Social Media', contact: 'Kontakt' };
              const allowed = Object.keys(labels);
              const defaultOrder = ['news','events','booking','media','about','social','contact'];
              const saved = (Array.isArray(content.sectionsOrder) && content.sectionsOrder.length ? content.sectionsOrder : defaultOrder) as string[];
              // Filter out disallowed (e.g., legacy 'map') and append any missing allowed keys
              const filtered = saved.filter(k => allowed.includes(k));
              for (const k of allowed) if (!filtered.includes(k)) filtered.push(k);
              const current = filtered;
              const setOrder = (next: string[]) => setContent(prev => ({ ...prev, sectionsOrder: next }));
              const move = (idx: number, dir: -1|1) => {
                const j = idx + dir; if (j < 0 || j >= current.length) return;
                const arr = current.slice(); const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp; setOrder(arr);
              };
              return (
                <div className="space-y-2">
                  <div className="px-2 py-1 text-neutral-300 text-sm">Kategorien der Startseite</div>
                  {current.map((key, idx) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-2 rounded-lg border bg-neutral-800/60 border-neutral-700/40`}
                    >
                      <div className="text-neutral-200 text-sm flex items-center gap-2">{labels[key] || key}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => move(idx, -1)} disabled={idx===0} className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40" title="Nach oben">↑</button>
                        <button onClick={() => move(idx, 1)} disabled={idx===current.length-1} className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40" title="Nach unten">↓</button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <button onClick={save} disabled={saving} className={`px-3 py-1.5 rounded border ${saving ? 'opacity-60' : ''} ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'}`}>{saving ? 'Speichert…' : 'Speichern'}</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      


      {/* Booking (Band anfragen) */}
      <section
        style={sectionStyle('booking', 'content')}
      >
        <ToggleButton label="Booking" open={(open as any).booking === true} onClick={() => setOpen(prev => ({ ...prev, booking: !(prev as any).booking }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('booking', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('booking', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).booking && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-neutral-200 text-sm">
                <input type="checkbox" checked={!!content.booking?.enabled} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), enabled: e.target.checked } }))} />
                Aktiviert
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Überschrift (DE)</label>
                  <Input placeholder="Booking / Band anfragen" value={readI18n(content.booking?.headline, 'de')} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), headline: writeI18n(prev.booking?.headline, 'de', e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Überschrift (EN)</label>
                  <Input placeholder="Booking / Band request" value={readI18n(content.booking?.headline, 'en')} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), headline: writeI18n(prev.booking?.headline, 'en', e.target.value) } }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Empfänger‑E‑Mail</label>
                <Input placeholder="booking@domain.tld" value={content.booking?.recipientEmail || ''} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), recipientEmail: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Telefon (optional)</label>
                <Input placeholder="+49 …" value={content.booking?.phone || ''} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), phone: e.target.value } }))} />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Hinweis (DE, optional)</label>
                  <Textarea rows={3} placeholder="Kurzer Hinweis unter dem Formular" value={readI18n(content.booking?.note, 'de')} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), note: writeI18n(prev.booking?.note, 'de', e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Note (EN, optional)</label>
                  <Textarea rows={3} placeholder="Short note under the form" value={readI18n(content.booking?.note, 'en')} onChange={e => setContent(prev => ({ ...prev, booking: { ...(prev.booking||{}), note: writeI18n(prev.booking?.note, 'en', e.target.value) } }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button disabled={saving} onClick={save} className={`px-4 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'} disabled:opacity-60`}>{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
              <div className="flex items-center justify-between mb-2">
                <div className="text-neutral-200 text-sm">Eingegangene Anfragen</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setBookingReqsError(null); setBookingReqsLoading(true);
                      try {
                        const res = await bookingRequestsList();
                        setBookingReqs(res.requests || []);
                      } catch (e) {
                        setBookingReqsError(e instanceof Error ? e.message : 'Fehler beim Laden');
                      } finally { setBookingReqsLoading(false); }
                    }}
                    className="px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800"
                  >Aktualisieren</button>
                </div>
              </div>
              {bookingReqsError && <div className="text-rose-300 text-sm mb-2">{bookingReqsError}</div>}
              {bookingReqsLoading ? (
                <div className="text-[#909296] text-sm">Lade…</div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-auto">
                  {bookingReqs.length === 0 && (
                    <div className="text-[#909296] text-sm">Keine Anfragen vorhanden.</div>
                  )}
                  {bookingReqs.map((r) => (
                    <div key={r.id} className="p-2 rounded-lg bg-neutral-800/60 border border-neutral-700/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-neutral-100 text-sm font-medium truncate">{r.name} <span className="text-neutral-400 font-normal">&lt;{r.email}&gt;</span></div>
                        <div className="text-neutral-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString('de-DE') : ''}</div>
                      </div>
                      <div className="text-neutral-300 text-xs mt-1">
                        {[r.date, r.event, r.location, r.budget].filter(Boolean).join(' · ')}
                      </div>
                      {r.message && <div className="text-neutral-200 text-sm mt-1 whitespace-pre-line">{r.message}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      

      {/* Hero */}
      <section
        style={sectionStyle('hero', 'design')}
      >
        <ToggleButton label="Hero" open={open.hero} onClick={() => setOpen(prev => ({ ...prev, hero: !prev.hero }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('hero', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('hero', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
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

      {/* Header & Logo */}
      <section
        style={sectionStyle('header', 'design')}
      >
        <ToggleButton label="Header & Logo" open={(open as any).header === true} onClick={() => setOpen(prev => ({ ...prev, header: !(prev as any).header }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('header', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('header', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).header && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 space-y-4">
              {/* Dark mode logo */}
              <HeaderLogoPicker
                label="Logo (Dunkler Modus)"
                value={content.headerLogo?.dark || ''}
                onChange={url => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, dark: url } }))}
                previewBg="bg-neutral-900/40"
                galleries={galleries}
              />

              {/* Light mode logo */}
              <HeaderLogoPicker
                label="Logo (Heller Modus)"
                value={content.headerLogo?.light || ''}
                onChange={url => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, light: url } }))}
                previewBg="bg-white/10"
                galleries={galleries}
              />

              {/* Logo size & effects */}
              <div className="space-y-3 pt-2 border-t border-neutral-700/30">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Größe & Effekte</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Desktop Höhe ({content.headerLogo?.height ?? 48}px)</label>
                    <input type="range" min={24} max={120} step={1} value={content.headerLogo?.height ?? 48}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, height: Number(e.target.value) } }))}
                      className="w-full accent-blue-500" />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Mobile Höhe ({content.headerLogo?.mobileHeight ?? 36}px)</label>
                    <input type="range" min={24} max={80} step={1} value={content.headerLogo?.mobileHeight ?? 36}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, mobileHeight: Number(e.target.value) } }))}
                      className="w-full accent-blue-500" />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Hover Vergrößerung ({(content.headerLogo?.hoverScale ?? 1).toFixed(2)}x)</label>
                    <input type="range" min={100} max={130} step={5} value={Math.round((content.headerLogo?.hoverScale ?? 1) * 100)}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, hoverScale: Number(e.target.value) / 100 } }))}
                      className="w-full accent-blue-500" />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Hover Helligkeit ({content.headerLogo?.hoverBrightness ?? 100}%)</label>
                    <input type="range" min={50} max={150} step={5} value={content.headerLogo?.hoverBrightness ?? 100}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, hoverBrightness: Number(e.target.value) } }))}
                      className="w-full accent-blue-500" />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Hover Opacity ({content.headerLogo?.hoverOpacity ?? 100}%)</label>
                    <input type="range" min={50} max={100} step={5} value={Math.round((content.headerLogo?.hoverOpacity ?? 1) * 100)}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, hoverOpacity: Number(e.target.value) / 100 } }))}
                      className="w-full accent-blue-500" />
                  </div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mt-1">Header Höhe</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Desktop Abstand ({content.headerLogo?.headerDesktopPadding ?? 10}px)</label>
                    <input type="range" min={0} max={40} step={2} value={content.headerLogo?.headerDesktopPadding ?? 10}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, headerDesktopPadding: Number(e.target.value) } }))}
                      className="w-full accent-blue-500" />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/40 border border-neutral-700/20">
                    <label className="block text-xs text-neutral-400 mb-1">Mobile Abstand ({content.headerLogo?.headerMobilePadding ?? 6}px)</label>
                    <input type="range" min={0} max={30} step={2} value={content.headerLogo?.headerMobilePadding ?? 6}
                      onChange={e => setContent(prev => ({ ...prev, headerLogo: { ...prev.headerLogo, headerMobilePadding: Number(e.target.value) } }))}
                      className="w-full accent-blue-500" />
                  </div>
                </div>
              </div>

              <div className="text-[12px] text-neutral-400">
                Wenn kein Logo gesetzt ist, wird das Standard-Logo verwendet. Für den hellen Modus sollte ein dunkles Logo (z. B. schwarz) hinterlegt werden.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Hintergrundbild */}
      <section
        style={sectionStyle('bg', 'design')}
      >
        <ToggleButton label="Hintergrundbild" open={(open as any).bg === true} onClick={() => setOpen(prev => ({ ...prev, bg: !(prev as any).bg }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('bg', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('bg', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).bg && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <label className="block text-xs text-neutral-400 mb-1">Bild‑URL (Hintergrund)</label>
              <Input placeholder="https://…/bild.jpg" value={content.backgroundUrl || ''} onChange={e => setContent({ ...content, backgroundUrl: e.target.value })} />
              <div className="mt-2 text-[12px] text-neutral-400">Das Bild wird als statischer Seiten‑Hintergrund verwendet (Cover, zentriert, fixiert).</div>
            </div>
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 -mb-1">
                <div className="inline-flex items-center rounded-md border border-neutral-700/40 overflow-hidden">
                  <button type="button" onClick={()=>setBgTheme('light')} className={`px-3 py-1.5 text-xs ${bgTheme==='light'?'bg-neutral-700/40 text-neutral-100':'text-neutral-300 hover:bg-neutral-800'}`}>Light</button>
                  <button type="button" onClick={()=>setBgTheme('dark')} className={`px-3 py-1.5 text-xs ${bgTheme==='dark'?'bg-neutral-700/40 text-neutral-100':'text-neutral-300 hover:bg-neutral-800'}`}>Dark</button>
                </div>
              </div>
              {(() => {
                const cfg = (bgTheme==='light' ? (content as any).backgroundFilterLight : (content as any).backgroundFilterDark) || (content.backgroundFilter || {}) as any;
                const setCfg = (patch: any) => setContent(prev => (
                  bgTheme==='light'
                    ? { ...prev, backgroundFilterLight: { ...((prev as any).backgroundFilterLight||{}), ...patch } as any }
                    : { ...prev, backgroundFilterDark:  { ...((prev as any).backgroundFilterDark ||{}), ...patch } as any }
                ));
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
                          <button type="button" onClick={()=> setContent(prev => (bgTheme==='light' ? { ...prev, backgroundFilterLight: undefined as any } : { ...prev, backgroundFilterDark: undefined as any }))} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 w-full">Filter zurücksetzen ({bgTheme})</button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="rounded-lg bg-neutral-900/60 border-[0.5px] border-neutral-700/30 p-3">
              <div className="text-neutral-300 text-sm mb-2">Vorschau ({bgTheme})</div>
              {(() => {
                const base = content.backgroundFilter || ({} as any);
                const f = (bgTheme==='light' ? ((content as any).backgroundFilterLight || base) : ((content as any).backgroundFilterDark || base));
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

      {/* Karten-Design */}
      <section
        style={sectionStyle('cards', 'design')}
      >
        <ToggleButton label="Karten-Design" open={(open as any).cards === true} onClick={() => setOpen(prev => ({ ...prev, cards: !(prev as any).cards }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('cards', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('cards', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).cards && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Transparenz ({content.cardOpacity ?? 40}%)</label>
                <input type="range" min={0} max={100} step={5} value={content.cardOpacity ?? 40} onChange={e => setContent(prev => ({ ...prev, cardOpacity: Number(e.target.value) }))} className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Hintergrund-Blur ({content.cardBlur ?? 0}px)</label>
                <input type="range" min={0} max={20} step={1} value={content.cardBlur ?? 0} onChange={e => setContent(prev => ({ ...prev, cardBlur: Number(e.target.value) }))} className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Border ({content.cardBorder ?? 1}px)</label>
                <input type="range" min={0} max={8} step={1} value={content.cardBorder ?? 1} onChange={e => setContent(prev => ({ ...prev, cardBorder: Number(e.target.value) }))} className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Radius ({content.cardRadius ?? 8}px)</label>
                <input type="range" min={0} max={24} step={1} value={content.cardRadius ?? 8} onChange={e => setContent(prev => ({ ...prev, cardRadius: Number(e.target.value) }))} className="w-full accent-blue-500" />
              </div>
              <div className="sm:col-span-2 flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-1">Border-Farbe</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.cardBorderColor || '#8C1423'}
                      onChange={e => setContent(prev => ({ ...prev, cardBorderColor: e.target.value }))}
                      className="w-10 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-xs text-neutral-400">{content.cardBorderColor || 'Auto (Theme)'}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-1">Border-Deckkraft ({content.cardBorderOpacity ?? 100}%)</label>
                  <input type="range" min={0} max={100} step={5} value={content.cardBorderOpacity ?? 100} onChange={e => setContent(prev => ({ ...prev, cardBorderOpacity: Number(e.target.value) }))} className="w-full accent-blue-500" />
                </div>
                {content.cardBorderColor && (
                  <button
                    onClick={() => setContent(prev => { const { cardBorderColor, cardBorderOpacity, ...rest } = prev as any; return rest; })}
                    className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-400 hover:bg-neutral-800 text-xs"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* News / Blog */}
      <section
        style={sectionStyle('news', 'content')}
      >
        <ToggleButton label="News" open={open.news} onClick={() => setOpen(prev => ({ ...prev, news: !prev.news }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('news', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('news', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {open.news && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <label className="flex items-center gap-2 text-neutral-200 text-sm">
                <input type="checkbox" checked={!!content.newsEnabled} onChange={e => setContent({ ...content, newsEnabled: e.target.checked })} />
                News auf der Startseite anzeigen
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 mr-2">
                  <button type="button" onClick={() => setNewsLang('de')} className={`px-2 py-1 rounded border ${newsLang==='de'?'border-neutral-300 text-neutral-100':'border-neutral-700 text-neutral-300'} bg-neutral-800 hover:bg-neutral-700`}>DE</button>
                  <button type="button" onClick={() => setNewsLang('en')} className={`px-2 py-1 rounded border ${newsLang==='en'?'border-neutral-300 text-neutral-100':'border-neutral-700 text-neutral-300'} bg-neutral-800 hover:bg-neutral-700`}>EN</button>
                </div>
                <button
                type="button"
                onClick={() => {
                  const id = String(Date.now());
                  const post = { id, title: { de: 'Neuer Beitrag', en: 'New post' }, html: { de: '<p>Text…</p>', en: '<p>Text…</p>' }, date: new Date().toISOString().slice(0,10), published: true } as any;
                  setContent(prev => ({ ...prev, news: [ ...(prev.news||[]), post ] }));
                }}
                className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
              >Beitrag hinzufügen</button>
              </div>
            </div>

            <div className="space-y-3">
              {(content.news||[]).length === 0 && (
                <div className="text-[#909296] text-sm">Keine Beiträge vorhanden.</div>
              )}
              {(content.news||[]).map((p, idx) => {
                const isOpen = !!newsPostOpen[p.id];
                return (
                <div key={p.id} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 space-y-3">
                  <div className="flex items-center gap-2">
                    {newsLang==='de' ? (
                      <Input placeholder="Titel (DE)" value={readI18n(p.title as any, 'de')} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, title: writeI18n(x.title as any, 'de', e.target.value) } : x) }))} />
                    ) : (
                      <Input placeholder="Title (EN)" value={readI18n(p.title as any, 'en')} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, title: writeI18n(x.title as any, 'en', e.target.value) } : x) }))} />
                    )}
                    <input type="date" value={(p.date||'').slice(0,10)} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, date: e.target.value } : x) }))} className="px-2 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm shrink-0" />
                    <label className="flex items-center gap-2 text-neutral-200 text-sm shrink-0">
                      <input type="checkbox" checked={p.published !== false} onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, published: e.target.checked } : x) }))} />
                      Veröffentlicht
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewsPostOpen(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${isOpen ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600'}`}
                        title={isOpen ? 'Zuklappen' : 'Aufklappen'}
                      >{isOpen ? '−' : '+'}</button>
                      <button type="button" onClick={() => { if (window.confirm('Beitrag wirklich entfernen?')) { setContent(prev => ({ ...prev, news: (prev.news||[]).filter((_,i)=> i!==idx) })); } }} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Entfernen</button>
                    </div>
                  </div>
                  {isOpen && (
                  <>
                  <div className="flex items-center gap-2">
                    {(['editor','html','preview'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNewsMode(prev => ({ ...prev, [p.id]: mode }))}
                        className={`px-2 py-1 rounded border-[0.5px] text-xs ${newsMode[p.id]==='preview' && mode==='preview'?'bg-green-900/40 border-green-700/40 text-green-200':newsMode[p.id]===mode?'bg-blue-900/40 border-blue-700/40 text-blue-200':'border-neutral-700/40 text-neutral-300 hover:bg-neutral-800'}`}
                      >{mode==='editor'?'Editor':mode==='html'?'HTML':'Vorschau'}</button>
                    ))}
                    <button
                      type="button"
                      className="text-[10px] text-neutral-400 hover:text-neutral-200 underline"
                      title="Entfernt alle inline Textfarben → Theme passt sich an"
                      onClick={() => {
                        const current = readI18n(p.html as any, newsLang);
                        const cleaned = stripInlineColors(current);
                        setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i) => i===idx ? { ...x, html: writeI18n(x.html as any, newsLang, cleaned) } : x) }));
                      }}
                    >🎨 Inline-Farben entfernen</button>
                  </div>
                  {newsMode[p.id] === 'html' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {newsLang==='de' ? (
                        <div>
                          <Badge>HTML</Badge>
                          <label className="block text-xs text-neutral-400 mb-1 mt-1">HTML (DE)</label>
                          <textarea
                            className="w-full min-h-[160px] p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 text-neutral-100 font-mono text-sm"
                            value={readI18n(p.html as any, 'de')}
                            onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, html: writeI18n(x.html as any, 'de', e.target.value) } : x) }))}
                            placeholder="<p>HTML‑Inhalt…</p>"
                          />
                        </div>
                      ) : (
                        <div>
                          <Badge>HTML</Badge>
                          <label className="block text-xs text-neutral-400 mb-1 mt-1">HTML (EN)</label>
                          <textarea
                            className="w-full min-h-[160px] p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 text-neutral-100 font-mono text-sm"
                            value={readI18n(p.html as any, 'en')}
                            onChange={e => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, html: writeI18n(x.html as any, 'en', e.target.value) } : x) }))}
                            placeholder="<p>HTML content…</p>"
                          />
                        </div>
                      )}
                    </div>
                  ) : newsMode[p.id] === 'preview' ? (
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>Vorschau</Badge>
                        <button
                          type="button"
                          onClick={() => setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light')}
                          className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs"
                        >{previewTheme === 'light' ? 'Dark' : 'Light'} Preview</button>
                      </div>
                      <div className={`p-3 rounded-lg border ${previewTheme==='light'?'bg-white border-neutral-200':'bg-neutral-900/60 border-neutral-700/40'}`}>
                        <style>{`
                          .preview-content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
                          .preview-content p { margin: 0 0 0.5em 0; min-height: 0.5em; }
                          .preview-content h1 { font-size: 1.75em; font-weight: 700; margin: 0 0 0.3em 0; }
                          .preview-content h2 { font-size: 1.5em; font-weight: 600; margin: 0 0 0.3em 0; }
                          .preview-content h3 { font-size: 1.25em; font-weight: 600; margin: 0 0 0.3em 0; }
                          .preview-content ul { list-style-type: disc; padding-left: 1.5em; margin: 0 0 0.5em 0; }
                          .preview-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 0 0 0.5em 0; }
                          .preview-content li { margin: 0.15em 0; }
                          .preview-content a { color: #3b82f6; text-decoration: underline; }
                          .preview-content a.button-link { display: inline-block; padding: 8px 16px; border-radius: 6px; text-decoration: none; color: #fff !important; }
                          .preview-content span[style*="text-transform: uppercase"] { text-transform: uppercase; }
                          .preview-content img { max-width: 100%; height: auto; display: block; }
                          .preview-content div[data-youtube-video] { position: relative; }
                          .preview-content iframe { max-width: 100%; border-radius: 6px; }
                          .preview-content div[data-card] { margin: 0.5em 0; }
                        `}</style>
                        <div className={`preview-content max-w-none text-sm ${previewTheme==='light'?'text-neutral-800':'text-neutral-200'}`} dangerouslySetInnerHTML={{ __html: readI18n(p.html as any, newsLang) }} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>Editor</Badge>
                      </div>
                      {newsLang==='de' ? (
                        <RichTextEditor
                          value={readI18n(p.html as any, 'de')}
                          onChange={(html) => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, html: writeI18n(x.html as any, 'de', html) } : x) }))}
                          onPickImage={(insert) => { const url = window.prompt('Bild-URL'); if (url) insert(url); }}
                          galleryImages={allGalleryImages}
                        />
                      ) : (
                        <RichTextEditor
                          value={readI18n(p.html as any, 'en')}
                          onChange={(html) => setContent(prev => ({ ...prev, news: (prev.news||[]).map((x,i)=> i===idx ? { ...x, html: writeI18n(x.html as any, 'en', html) } : x) }))}
                          onPickImage={(insert) => { const url = window.prompt('Bild-URL'); if (url) insert(url); }}
                          galleryImages={allGalleryImages}
                        />
                      )}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <button disabled={saving} onClick={save} className={`px-4 py-2 rounded-lg border font-medium ${saving ? 'opacity-60' : ''} ${theme==='light' ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500' : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'}`}>{saving ? 'Speichert…' : 'Beitrag speichern'}</button>
                  </div>
                  </>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </section>

      {/* Über uns */}
      <section
        style={sectionStyle('about', 'content')}
      >
        <ToggleButton label="Über uns" open={open.about} onClick={() => setOpen(prev => ({ ...prev, about: !prev.about }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('about', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('about', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {open.about && (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {/* Language switcher like News */}
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setAboutLang('de')} className={`px-3 py-1.5 rounded border text-sm ${aboutLang==='de' ? 'border-neutral-300 text-neutral-100 bg-neutral-700/40' : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'}`}>DE</button>
              <button type="button" onClick={() => setAboutLang('en')} className={`px-3 py-1.5 rounded border text-sm ${aboutLang==='en' ? 'border-neutral-300 text-neutral-100 bg-neutral-700/40' : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'}`}>EN</button>
            </div>
            <div className="space-y-3">
              <div>
                <Input
                  placeholder={aboutLang==='en' ? 'Title (EN)' : 'Titel (DE)'}
                  value={readI18n(content.about?.title as any, aboutLang)}
                  onChange={e => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), title: writeI18n(prev.about?.title as any, aboutLang, e.target.value) } }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-neutral-400">{aboutLang==='en' ? 'About text (EN)' : 'Über uns Text (DE)'}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-[10px] text-neutral-400 hover:text-neutral-200 underline"
                      title="Entfernt alle inline Textfarben → Theme passt sich an"
                      onClick={() => {
                        const current = readI18n(content.about?.text as any, aboutLang);
                        const cleaned = stripInlineColors(current);
                        setContent(prev => ({ ...prev, about: { ...(prev.about||{}), text: writeI18n(prev.about?.text as any, aboutLang, cleaned) } }));
                      }}
                    >🎨 Inline-Farben entfernen</button>
                    <div className="inline-flex items-center rounded-md border border-neutral-700/40 overflow-hidden">
                      {(['editor','html','preview'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAboutTextMode(prev => ({ ...prev, [aboutLang]: m }))}
                          className={`px-2 py-1 text-xs ${aboutTextMode[aboutLang]===m ? 'bg-neutral-700/40 text-neutral-100' : 'text-neutral-300 hover:bg-neutral-800'}`}
                        >{m==='editor' ? 'Editor' : m==='html' ? 'HTML' : 'Vorschau'}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {aboutTextMode[aboutLang] === 'editor' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>Editor</Badge>
                    </div>
                    {aboutLang==='de' ? (
                      <RichTextEditor
                        value={readI18n(content.about?.text as any, 'de')}
                        onChange={(html) => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), text: writeI18n(prev.about?.text as any, 'de', html) } }))}
                        onPickImage={(insert) => { const url = window.prompt('Bild-URL'); if (url) insert(url); }}
                        galleryImages={allGalleryImages}
                      />
                    ) : (
                      <RichTextEditor
                        value={readI18n(content.about?.text as any, 'en')}
                        onChange={(html) => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), text: writeI18n(prev.about?.text as any, 'en', html) } }))}
                        onPickImage={(insert) => { const url = window.prompt('Bild-URL'); if (url) insert(url); }}
                        galleryImages={allGalleryImages}
                      />
                    )}
                  </div>
                )}
                {aboutTextMode[aboutLang] === 'html' && (
                  <textarea
                    className="w-full min-h-[160px] p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 text-neutral-100 font-mono text-sm"
                    value={readI18n(content.about?.text as any, aboutLang)}
                    onChange={e => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), text: writeI18n(prev.about?.text as any, aboutLang, e.target.value) } }))}
                    placeholder={aboutLang==='en' ? '<p>HTML content…</p>' : '<p>HTML‑Inhalt…</p>'}
                  />
                )}
                {aboutTextMode[aboutLang] === 'preview' && (
                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
                    <div className="prose prose-invert max-w-none text-neutral-300 text-sm" dangerouslySetInnerHTML={{ __html: readI18n(content.about?.text as any, aboutLang) }} />
                  </div>
                )}
              </div>
            </div>
            {/* Bandmitglieder */}
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-neutral-300 text-sm">Bandmitglieder</div>
                <button
                  type="button"
                  onClick={() => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: [ ...((prev.about?.members)||[]), { id: crypto.randomUUID(), name: 'Neues Mitglied', role: '', bio: '', image: '', order: (prev.about?.members?.length||0) } ] } }))}
                  className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
                >Mitglied hinzufügen</button>
              </div>
              {((content.about?.members)||[]).length === 0 && (
                <div className="text-[#909296] text-sm">Noch keine Bandmitglieder angelegt.</div>
              )}
              <div className="space-y-3">
                {((content.about?.members)||[]).slice().sort((a,b)=> (a.order??0)-(b.order??0)).map((m, idx, arr) => (
                  <div key={m.id||idx} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                      <div className="md:col-span-1 space-y-2">
                        <Input placeholder="Name" value={m.name||''} onChange={e => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: (prev.about?.members||[]).map(x => x.id===m.id? { ...x, name: e.target.value } : x) } }))} />
                        <Input placeholder="Rolle (z. B. Gesang, Gitarre)" value={m.role||''} onChange={e => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: (prev.about?.members||[]).map(x => x.id===m.id? { ...x, role: e.target.value } : x) } }))} />
                        <Input placeholder="Bild‑URL" value={m.image||''} onChange={e => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: (prev.about?.members||[]).map(x => x.id===m.id? { ...x, image: e.target.value } : x) } }))} />
                        <div className="flex items-center gap-1">
                          <button onClick={() => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: (prev.about?.members||[]).map(x => x.id===m.id? { ...x, order: Math.max(0, (m.order??idx)-1) } : x).sort((a,b)=> (a.order??0)-(b.order??0)) } }))} disabled={idx===0} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40">↑</button>
                          <button onClick={() => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: (prev.about?.members||[]).map(x => x.id===m.id? { ...x, order: Math.min(arr.length-1, (m.order??idx)+1) } : x).sort((a,b)=> (a.order??0)-(b.order??0)) } }))} disabled={idx===arr.length-1} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40">↓</button>
                          <button onClick={() => setContent(prev => ({ ...prev, about: { ...(prev.about||{}), members: (prev.about?.members||[]).filter(x => x.id!==m.id).map((x,i)=> ({ ...x, order: i })) } }))} className="ml-2 px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <Textarea
                          rows={5}
                          placeholder={aboutLang==='en' ? 'Short bio (EN)' : 'Kurzbiografie (DE)'}
                          value={readI18n(m.bio as any, aboutLang)}
                          onChange={e => setContent(prev => ({
                            ...prev,
                            about: {
                              ...(prev.about||{}),
                              members: (prev.about?.members||[]).map(x => x.id===m.id ? { ...x, bio: writeI18n(x.bio as any, aboutLang, e.target.value) } : x)
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>
          </div>
        )}
      </section>

      {/* Social */}
      <section
        style={sectionStyle('socials', 'content')}
      >
        <ToggleButton label="Social" open={open.socials} onClick={() => setOpen(prev => ({ ...prev, socials: !prev.socials }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('socials', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('socials', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
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
      <section
        style={sectionStyle('contact', 'content')}
      >
        <ToggleButton label="Kontakt" open={open.contact} onClick={() => setOpen(prev => ({ ...prev, contact: !prev.contact }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('contact', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('contact', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {open.contact && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="E-Mail" value={content.contact?.email || ''} onChange={e => setContent({ ...content, contact: { ...(content.contact||{}), email: e.target.value } })} />
            <Input placeholder="Telefon" value={content.contact?.phone || ''} onChange={e => setContent({ ...content, contact: { ...(content.contact||{}), phone: e.target.value } })} />
            <Input placeholder="Adresse" value={content.contact?.address || ''} onChange={e => setContent({ ...content, contact: { ...(content.contact||{}), address: e.target.value } })} />
          </div>
        )}
      </section>

      {/* Media/Embeds (Spotify) */}
      <section
        style={sectionStyle('mediaEmbeds', 'content')}
      >
        <ToggleButton label="Media/Embeds (Spotify)" open={open.mediaEmbeds} onClick={() => setOpen(prev => ({ ...prev, mediaEmbeds: !prev.mediaEmbeds }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('mediaEmbeds', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('mediaEmbeds', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {open.mediaEmbeds && (
          <div className="mt-3 space-y-3">
            {(() => {
              const embeds = content.mediaEmbeds || [];
              const setEmbeds = (next: NonNullable<SiteContent['mediaEmbeds']>) => setContent(prev => ({ ...prev, mediaEmbeds: next }));
              const parseSpotify = (url: string) => {
                try {
                  const u = new URL(url);
                  if (!u.hostname.includes('spotify.com')) return null;
                  let parts = u.pathname.split('/').filter(Boolean);
                  if (parts[0] && parts[0].startsWith('intl-')) parts = parts.slice(1);
                  if (parts[0] === 'embed') parts = parts.slice(1);
                  const type = parts[0];
                  const id = parts[1];
                  if (!type || !id) return null;
                  const allowed = ['track','album','playlist','show','episode','artist'];
                  if (!allowed.includes(type)) return null;
                  return { type, id } as { type: string; id: string };
                } catch { return null; }
              };
              const toEmbedSrc = (rawUrl: string) => {
                const p = parseSpotify(rawUrl);
                if (!p) return null;
                return `https://open.spotify.com/embed/${p.type}/${p.id}`;
              };
              const add = () => {
                const url = prompt('Spotify‑URL (Track/Album/Playlist/Show/Episode)');
                if (!url) return;
                const ok = parseSpotify(url);
                if (!ok) { setError('Ungültige Spotify‑URL.'); return; }
                const id = String(Date.now());
                const order = embeds.length;
                setError(null);
                setEmbeds([ ...embeds, { id, type: 'spotify', url, title: '', enabled: true, order } ]);
              };
              const move = (idx: number, dir: -1|1) => {
                const j = idx + dir; if (j<0 || j>=embeds.length) return;
                const arr = embeds.slice(); const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp;
                setEmbeds(arr.map((e, i) => ({ ...e, order: i })));
              };
              const remove = (idx: number) => {
                setEmbeds(embeds.filter((_,i)=> i!==idx).map((e,i)=>({ ...e, order: i })));
              };
              return (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                    <div className="text-neutral-300 text-sm">Spotify‑Embeds verwalten</div>
                    <button type="button" onClick={add} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Eintrag hinzufügen</button>
                  </div>
                  {embeds.length === 0 && (
                    <div className="text-[#909296] text-sm">Keine Spotify‑Einträge vorhanden.</div>
                  )}
                  <div className="space-y-3">
                    {embeds.map((m, idx) => {
                      const src = toEmbedSrc(m.url || '');
                      const p = parseSpotify(m.url || '') || { type: 'track' } as any;
                      const largeTypes = ['track','album','playlist'];
                      const height = largeTypes.includes(p.type) ? 352 : 152;
                      return (
                        <div key={m.id} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700/40 space-y-3">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-neutral-200 text-sm">
                              <input type="checkbox" checked={m.enabled !== false} onChange={e => setEmbeds(embeds.map((x,i)=> i===idx ? { ...x, enabled: e.target.checked } : x))} />
                              Aktiv
                            </label>
                            <Input placeholder="Titel (optional)" value={m.title || ''} onChange={e => setEmbeds(embeds.map((x,i)=> i===idx ? { ...x, title: e.target.value } : x))} />
                            <Input placeholder="Spotify‑URL" value={m.url} onChange={e => setEmbeds(embeds.map((x,i)=> i===idx ? { ...x, url: e.target.value } : x))} />
                            <Input placeholder="Cover‑URL (1:1)" value={m.coverUrl || ''} onChange={e => setEmbeds(embeds.map((x,i)=> i===idx ? { ...x, coverUrl: e.target.value } : x))} />
                            <div className="flex items-center gap-1 ml-auto">
                              <button onClick={()=>move(idx,-1)} disabled={idx===0} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40" title="Nach oben">↑</button>
                              <button onClick={()=>move(idx,1)} disabled={idx===embeds.length-1} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40" title="Nach unten">↓</button>
                              <button onClick={()=>remove(idx)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
                            </div>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-neutral-700/40 bg-neutral-900">
                            {src ? (
                              <iframe
                                title={m.title || 'Spotify'}
                                src={src}
                                width="100%"
                                height={height}
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                              />
                            ) : (
                              <div className="p-6 text-neutral-400 text-sm">Ungültige Spotify‑URL</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Galerie Verwaltung (Jahr -> Galerie -> Items) */}
      <section
        style={sectionStyle('gallery', 'content')}
      >
        <ToggleButton label="Galerien" open={open.gallery} onClick={() => setOpen(prev => ({ ...prev, gallery: !prev.gallery }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('gallery', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('gallery', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {open.gallery && (
          <div className="mt-3 space-y-3">
            {/* Add/Import controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const currentYear = new Date().getFullYear();
                  const yStr = prompt('Jahr für neue Galerie', String(currentYear));
                  const y = Number(yStr);
                  if (!validYear(y)) { setError('Bitte gültiges Jahr (1900–2999) angeben.'); return; }
                  const name = prompt('Galeriename');
                  if (!name) { setError('Galeriename darf nicht leer sein.'); return; }
                  await addGallery(y, name);
                }}
                className={`px-3 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'}`}
              >Galerie hinzufügen</button>
              <button
                type="button"
                onClick={importFromUploads}
                className={`px-3 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'}`}
              >Aus Uploads einlesen</button>
              
              <button
                type="button"
                onClick={()=> scanGalleries()}
                disabled={scanLoading}
                className={`px-3 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'} disabled:opacity-60`}
              >Scan-Report (alle)</button>
              {scanReport && (
                <button type="button" onClick={clearScanReport} className={`px-3 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'}`}>Report schließen</button>
              )}
            </div>

            {scanReport && (
              <div className="mt-3 p-3 rounded-lg border bg-neutral-900/40 border-neutral-700/40">
                <div className="text-neutral-100 font-semibold mb-2">Scan‑Report</div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm text-neutral-200">
                    <thead className="text-neutral-400">
                      <tr>
                        <th className="text-left px-2 py-1">Galerie</th>
                        <th className="text-left px-2 py-1">Soll (metadata)</th>
                        <th className="text-left px-2 py-1">Ist (Ordner)</th>
                        <th className="text-left px-2 py-1">Status</th>
                        <th className="text-left px-2 py-1">Diff</th>
                        <th className="text-left px-2 py-1">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanReport.map((en, idx) => {
                        const filesSoll = (en as any).metaFileCount ?? en.metaCount;
                        const urlsOnly = (en as any).metaUrlsOnly === true;
                        const diffFiles = (en as any).diffFiles ?? (en.serverCount - filesSoll);
                        const okMatch = urlsOnly ? true : (en.serverCount === filesSoll);
                        const tooMany = !urlsOnly && en.serverCount > filesSoll;
                        const clsSoll = urlsOnly ? 'text-sky-300' : (okMatch ? 'text-green-400' : tooMany ? 'text-rose-400' : 'text-amber-400');
                        const clsIst = urlsOnly ? 'text-sky-300' : (okMatch ? 'text-green-400' : tooMany ? 'text-rose-400' : 'text-amber-400');
                        const clsDiff = urlsOnly ? 'text-sky-300' : (diffFiles===0 ? 'text-green-400' : diffFiles>0 ? 'text-rose-400' : 'text-amber-400');
                        const statusLabel = (s?: string) => s==='internal' ? 'Intern' : s==='locked' ? 'Gesperrt' : s==='public' ? 'Öffentlich' : '—';
                        const statusClass = (s?: string) => s==='internal' ? 'text-blue-300' : s==='locked' ? 'text-red-300' : s==='public' ? 'text-green-300' : 'text-neutral-400';
                        return (
                          <tr key={`${en.year}:${en.name}:${idx}`} className="border-t border-neutral-700/40">
                            <td className="px-2 py-1">{en.year} / {en.name} {en.error && <span className="text-rose-400">({en.error})</span>}</td>
                            <td className={`px-2 py-1 ${clsSoll}`}>
                              {urlsOnly ? (<span>URLs ({(en as any).metaLinkCount ?? 0})</span>) : filesSoll}
                            </td>
                            <td className={`px-2 py-1 ${clsIst}`}>
                              {urlsOnly ? (<span>URLs</span>) : en.serverCount}
                            </td>
                            <td className={`px-2 py-1 ${statusClass(en.metaStatus)}`}>
                              {statusLabel(en.metaStatus)}
                            </td>
                            <td className={`px-2 py-1 ${clsDiff}`}>
                              {urlsOnly ? (
                                <span className="inline-flex items-center gap-1 text-sky-300">URLs</span>
                              ) : okMatch ? (
                                <span className="inline-flex items-center gap-1 text-green-400"><Check size={16}/> OK</span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 ${diffFiles>0 ? 'text-rose-400' : 'text-amber-400'}`}><AlertTriangle size={16}/> {diffFiles>0 ? `+${diffFiles}` : `${diffFiles}`}</span>
                              )}
                            </td>
                            <td className="px-2 py-1">
                              {en.extraFiles.length>0 ? (
                                <details>
                                  <summary className="cursor-pointer text-neutral-300">{en.extraFiles.length} extra Datei(en) verwalten</summary>
                                  <div className="mt-2 space-y-1 max-h-60 overflow-auto">
                                    {en.extraFiles.map((f, i) => (
                                      <label key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-800/60">
                                        <input type="checkbox" checked={!!f.selected} onChange={(e)=>{
                                          setScanReport(prev => (prev||[]).map((row, rIdx)=>{
                                            if (rIdx!==idx) return row; const arr=row.extraFiles.slice(); arr[i] = { ...arr[i], selected: e.target.checked }; return { ...row, extraFiles: arr };
                                          }));
                                        }} />
                                        <span className="text-xs text-neutral-300">{f.filename}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <div className="mt-2">
                                    <button onClick={()=> deleteExtras(en)} className="px-3 py-1.5 rounded border border-neutral-700/40 text-neutral-200 hover:bg-neutral-800">Auswahl löschen</button>
                                  </div>
                                </details>
                              ) : (
                                <span className="text-neutral-500">{urlsOnly ? 'Nur URLs (keine Dateien im Ordner)' : 'Keine extra Dateien'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Years and galleries */}
            {years.length === 0 && (
              <div className="text-[#909296] text-sm">Noch keine Galerien angelegt.</div>
            )}

            <div className="space-y-4">
              {years.map((y) => {
                const isYearOpen = !!yearOpen[y];
                return (
                <div key={y} className={`rounded-xl border ${theme==='light' ? 'bg-white/85 border-neutral-200' : 'bg-neutral-800/60 border-neutral-700/30'}`}>
                  <div
                    className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/30 cursor-pointer select-none"
                    onClick={() => toggleYearOpen(y)}
                    role="button"
                    aria-expanded={isYearOpen}
                  >
                    <span className="text-neutral-100 font-semibold">{y}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          const name = prompt('Galeriename');
                          if (!name) { setError('Galeriename darf nicht leer sein.'); return; }
                          await addGallery(y, name);
                        }}
                        className={`px-2 py-1 rounded border text-xs ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'}`}
                      >Galerie hinzufügen</button>
                      <span className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-sm">{isYearOpen ? '−' : '+'}</span>
                    </div>
                  </div>
                  {isYearOpen && (
                  <div className="p-3 space-y-2">
                    {(galleriesByYear.get(y) || []).map((g, gi, arrByYear) => {
                      const rowKey = `${y}:${gi}`;
                      const isOpen = !!adminOpen[rowKey];
                      return (
                      <div key={rowKey} className={`rounded-lg border ${theme==='light' ? 'bg-white/85 border-neutral-200' : 'bg-neutral-900/60 border-neutral-700/40'}`}>
                        <div
                          className="flex items-center justify-between px-3 py-2 border-b border-neutral-700/30 cursor-pointer"
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button, input, a, label')) return;
                            setAdminOpen(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
                          }}
                          role="button"
                          aria-expanded={isOpen}
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
                              onClick={async (e) => { e.stopPropagation(); if (window.confirm(`Galerie "${g.name}" (${y}) wirklich löschen?`)) await removeGallery(y, g.name); }}
                              className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs"
                            >Galerie löschen</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setAdminOpen(prev => ({ ...prev, [rowKey]: !prev[rowKey] })); }}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800"
                              title={isOpen ? 'Zuklappen' : 'Aufklappen'}
                              aria-label={isOpen ? 'Zuklappen' : 'Aufklappen'}
                            >
                              <span className="text-base leading-none">{isOpen ? '−' : '+'}</span>
                            </button>
                            {/* Reorder within year */}
                            <button
                              onClick={(e) => { e.stopPropagation(); moveGallery(y, g.name, -1); }}
                              disabled={gi===0}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
                              title="Nach oben"
                              aria-label="Nach oben"
                            >↑</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveGallery(y, g.name, 1); }}
                              disabled={gi===arrByYear.length-1}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-md border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
                              title="Nach unten"
                              aria-label="Nach unten"
                            >↓</button>
                          </div>
                        </div>
                        {adminOpen[rowKey] && (
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
                                  <div className="text-neutral-200 text-sm">{it.title || `${it.type==='image'?'Bild':it.type==='video'?'Video':it.type==='youtube'?'YouTube':'Instagram'} #${idx+1}`}</div>
                                  {infoOpen[`${y}:${g.name}:${idx}`] && (
                                    <div className="text-neutral-400 text-xs break-all mt-1">{it.url}</div>
                                  )}
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <button onClick={() => moveItem(y, g.name, idx, -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">↑</button>
                                  <button onClick={() => moveItem(y, g.name, idx, 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">↓</button>
                                  <button onClick={() => toggleInfo(`${y}:${g.name}:${idx}`)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Info</button>
                                  <a href={it.url} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Öffnen</a>
                                  <button onClick={async () => await removeItem(y, g.name, idx)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Entfernen</button>
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
                                  const errors: string[] = [];
                                  const newItems: Array<{type: 'image'|'video', url: string}> = [];
                                  for (const f of files) {
                                    try {
                                      const item = await uploadItem(y, g.name, f);
                                      if (item) newItems.push(item);
                                    } catch (err: any) {
                                      errors.push(`${f.name}: ${err?.message || 'Fehler'}`);
                                    }
                                  }
                                  // Batch add all items at once to prevent race conditions
                                  if (newItems.length > 0) {
                                    setGalleries((galleries||[]).map(ga => {
                                      if (!(ga.year===y && ga.name===g.name)) return ga;
                                      return { ...ga, items: [ ...(ga.items||[]), ...newItems ] };
                                    }));
                                  }
                                  if (errors.length > 0) {
                                    setError(`${errors.length} von ${files.length} Dateien konnten nicht hochgeladen:\n${errors.join('\n')}`);
                                  }
                                }}
                              />
                              Dateien hochladen
                            </label>

                            
                          </div>
                        </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
              })}
            </div>
            
          </div>
        )}
      </section>

      {/* Rechtliches (Impressum, Datenschutz) */}
      <section
        style={sectionStyle('legal', 'content')}
      >
        <ToggleButton label="Rechtliches (Impressum & Datenschutz)" open={(open as any).legal === true} onClick={() => setOpen(prev => ({ ...prev, legal: !(prev as any).legal }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('legal', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('legal', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).legal && (
          <div className="mt-3 space-y-3">
            {/* Language switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Sprache:</span>
              <div className="inline-flex rounded-md overflow-hidden border border-neutral-700/40">
                <button onClick={()=>setLegalLang('de')} className={`px-3 py-1 text-xs ${legalLang==='de' ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-400'}`}>DE</button>
                <button onClick={()=>setLegalLang('en')} className={`px-3 py-1 text-xs ${legalLang==='en' ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-400'}`}>EN</button>
              </div>
            </div>

            {/* Impressum */}
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-neutral-200 text-sm font-semibold">Impressum ({legalLang.toUpperCase()})</h4>
                <div className="inline-flex rounded-md overflow-hidden border border-neutral-700/40">
                  {(['editor','html','preview'] as const).map(m => (
                    <button key={m} onClick={()=> setLegalMode(prev=> ({ ...prev, impressum: { ...prev.impressum, [legalLang]: m } }))} className={`px-3 py-1 text-xs ${legalMode.impressum[legalLang]===m ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-400'}`}>{m}</button>
                  ))}
                </div>
              </div>
              {legalMode.impressum[legalLang] === 'editor' && (
                <RichTextEditor
                  value={readI18n((content as any).impressum, legalLang)}
                  onChange={(html) => setContent(prev => ({ ...prev, impressum: writeI18n((prev as any).impressum, legalLang, html) as any }))}
                />
              )}
              {legalMode.impressum[legalLang] === 'html' && (
                <Textarea rows={10} placeholder="HTML" value={readI18n((content as any).impressum, legalLang)} onChange={e => setContent(prev => ({ ...prev, impressum: writeI18n((prev as any).impressum, legalLang, e.target.value) as any }))} />
              )}
              {legalMode.impressum[legalLang] === 'preview' && (
                <div className="prose prose-invert max-w-none text-neutral-200 p-3 rounded-lg bg-neutral-900 border-[0.5px] border-neutral-700/40" dangerouslySetInnerHTML={{ __html: readI18n((content as any).impressum, legalLang) }} />
              )}
            </div>

            {/* Datenschutz */}
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-neutral-200 text-sm font-semibold">Datenschutz ({legalLang.toUpperCase()})</h4>
                <div className="inline-flex rounded-md overflow-hidden border border-neutral-700/40">
                  {(['editor','html','preview'] as const).map(m => (
                    <button key={m} onClick={()=> setLegalMode(prev=> ({ ...prev, privacy: { ...prev.privacy, [legalLang]: m } }))} className={`px-3 py-1 text-xs ${legalMode.privacy[legalLang]===m ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-400'}`}>{m}</button>
                  ))}
                </div>
              </div>
              {legalMode.privacy[legalLang] === 'editor' && (
                <RichTextEditor
                  value={readI18n((content as any).privacy, legalLang)}
                  onChange={(html) => setContent(prev => ({ ...prev, privacy: writeI18n((prev as any).privacy, legalLang, html) as any }))}
                />
              )}
              {legalMode.privacy[legalLang] === 'html' && (
                <Textarea rows={10} placeholder="HTML" value={readI18n((content as any).privacy, legalLang)} onChange={e => setContent(prev => ({ ...prev, privacy: writeI18n((prev as any).privacy, legalLang, e.target.value) as any }))} />
              )}
              {legalMode.privacy[legalLang] === 'preview' && (
                <div className="prose prose-invert max-w-none text-neutral-200 p-3 rounded-lg bg-neutral-900 border-[0.5px] border-neutral-700/40" dangerouslySetInnerHTML={{ __html: readI18n((content as any).privacy, legalLang) }} />
              )}
            </div>

            <div className="flex justify-end">
              <button disabled={saving} onClick={save} className={`px-4 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'} disabled:opacity-60`}>{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>
          </div>
        )}
      </section>

      {/* Landing Page */}
      <section
        style={sectionStyle('landingPage', 'content')}
      >
        <ToggleButton label="Landing Page" open={(open as any).landingPage === true} onClick={() => setOpen(prev => ({ ...prev, landingPage: !(prev as any).landingPage }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('landingPage', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('landingPage', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).landingPage && (
          <div className="mt-3 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lp-enabled"
                  checked={!!(content as any).landingPage?.enabled}
                  onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), enabled: e.target.checked } }))}
                />
                <label htmlFor="lp-enabled" className="text-neutral-200 text-sm">Aktiviert</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lp-fullscreen"
                  checked={!!content.fullscreenEnabled}
                  onChange={e => setContent(prev => ({ ...prev, fullscreenEnabled: e.target.checked }))}
                />
                <label htmlFor="lp-fullscreen" className="text-neutral-200 text-sm">Fullscreen-Modus erlauben</label>
              </div>
              <CopyLandingLink />
            </div>

            <SectionTitle title="Hero Bild" />
            <Input
              placeholder="Bild-URL"
              value={((content as any).landingPage?.heroUrl || '')}
              onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), heroUrl: e.target.value } }))}
            />

            <SectionTitle title="Willkommen Text" />
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <h4 className="text-neutral-200 text-sm font-semibold mb-2">Deutsch</h4>
              <Textarea
                rows={4}
                placeholder="Willkommen Text (DE)"
                value={((content as any).landingPage?.welcomeText?.de || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), welcomeText: { ...((prev as any).landingPage?.welcomeText || {}), de: e.target.value } } }))}
              />
            </div>
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <h4 className="text-neutral-200 text-sm font-semibold mb-2">English</h4>
              <Textarea
                rows={4}
                placeholder="Welcome text (EN)"
                value={((content as any).landingPage?.welcomeText?.en || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), welcomeText: { ...((prev as any).landingPage?.welcomeText || {}), en: e.target.value } } }))}
              />
            </div>

            <SectionTitle title="YouTube Video" />
            <Input
              placeholder="YouTube URL (https://youtu.be/... oder https://www.youtube.com/watch?v=...)"
              value={((content as any).landingPage?.youtubeUrl || '')}
              onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), youtubeUrl: e.target.value } }))}
            />

            <SectionTitle title="About Us" />
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <h4 className="text-neutral-200 text-sm font-semibold mb-2">Überschrift Deutsch</h4>
              <Input
                placeholder="Überschrift (DE)"
                value={((content as any).landingPage?.aboutTitle?.de || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), aboutTitle: { ...((prev as any).landingPage?.aboutTitle || {}), de: e.target.value } } }))}
              />
              <h4 className="text-neutral-200 text-sm font-semibold mb-2 mt-3">Überschrift English</h4>
              <Input
                placeholder="Heading (EN)"
                value={((content as any).landingPage?.aboutTitle?.en || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), aboutTitle: { ...((prev as any).landingPage?.aboutTitle || {}), en: e.target.value } } }))}
              />
              <h4 className="text-neutral-200 text-sm font-semibold mb-2 mt-3">Text Deutsch</h4>
              <Textarea
                rows={4}
                placeholder="Text (DE)"
                value={((content as any).landingPage?.aboutText?.de || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), aboutText: { ...((prev as any).landingPage?.aboutText || {}), de: e.target.value } } }))}
              />
              <h4 className="text-neutral-200 text-sm font-semibold mb-2 mt-3">Text English</h4>
              <Textarea
                rows={4}
                placeholder="Text (EN)"
                value={((content as any).landingPage?.aboutText?.en || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), aboutText: { ...((prev as any).landingPage?.aboutText || {}), en: e.target.value } } }))}
              />
            </div>

            <SectionTitle title="Call-to-Action Button" />
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lp-cta-visible"
                  checked={!!(content as any).landingPage?.ctaButton?.visible}
                  onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), ctaButton: { ...((prev as any).landingPage?.ctaButton || {}), visible: e.target.checked } } }))}
                />
                <label htmlFor="lp-cta-visible" className="text-neutral-200 text-sm">Sichtbar</label>
              </div>
              <Input
                placeholder="URL (z. B. https://artist-website.de)"
                value={((content as any).landingPage?.ctaButton?.url || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), ctaButton: { ...((prev as any).landingPage?.ctaButton || {}), url: e.target.value } } }))}
              />
              <Input
                placeholder="Button-Text Deutsch"
                value={((content as any).landingPage?.ctaButton?.label?.de || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), ctaButton: { ...((prev as any).landingPage?.ctaButton || {}), label: { ...((prev as any).landingPage?.ctaButton?.label || {}), de: e.target.value } } } }))}
              />
              <Input
                placeholder="Button-Text English"
                value={((content as any).landingPage?.ctaButton?.label?.en || '')}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), ctaButton: { ...((prev as any).landingPage?.ctaButton || {}), label: { ...((prev as any).landingPage?.ctaButton?.label || {}), en: e.target.value } } } }))}
              />
            </div>

            <SectionTitle title="Newsletter" />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lp-newsletter"
                checked={!!(content as any).landingPage?.newsletterVisible}
                onChange={e => setContent(prev => ({ ...prev, landingPage: { ...((prev as any).landingPage || {}), newsletterVisible: e.target.checked } }))}
              />
              <label htmlFor="lp-newsletter" className="text-neutral-200 text-sm">Newsletter anzeigen</label>
            </div>

            <div className="flex justify-end">
              <button disabled={saving} onClick={save} className={`px-4 py-2 rounded-lg border ${theme==='light' ? 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100' : 'border-neutral-700/40 text-neutral-200 hover:bg-neutral-700'} disabled:opacity-60`}>{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>

            {/* Live Preview */}
            <div className="mt-4">
              <SectionTitle title="Vorschau" subtitle="So sieht die Landing Page aus (Live-Update)" />
              <div className="rounded-xl border border-neutral-700/40 overflow-hidden">
                <LandingPage previewContent={content} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section style={sectionStyle('newsletter', 'content')}>
        <ToggleButton label="Newsletter" open={(open as any).newsletter === true} onClick={() => setOpen(prev => ({ ...prev, newsletter: !(prev as any).newsletter }))} />
        {adminEdit && (
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={()=>moveAdmin('newsletter', -1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↑ Karte</button>
            <button onClick={()=>moveAdmin('newsletter', 1)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">↓ Karte</button>
          </div>
        )}
        {(open as any).newsletter && (
          <div className="mt-3 space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              {(['subscribers','campaigns','editor'] as const).map(t => (
                <button key={t} onClick={() => setNewsletterTab(t)} className={`px-3 py-1.5 rounded border-[0.5px] text-xs ${newsletterTab===t ? 'bg-blue-900/40 border-blue-700/40 text-blue-200' : 'border-neutral-700/40 text-neutral-300 hover:bg-neutral-800'}`}>
                  {t==='subscribers' ? 'Abonnenten' : t==='campaigns' ? 'Kampagnen' : 'Editor'}
                </button>
              ))}
            </div>

            {newsletterTab === 'subscribers' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-neutral-300 text-sm font-semibold">Abonnenten</div>
                  <button onClick={async () => { setNewsletterLoading(true); setNewsletterError(null); try { const res = await newsletterSubscribersList(); setNewsletterSubscribers(res.subscribers || []); } catch(e) { setNewsletterError(e instanceof Error ? e.message : 'Fehler'); } setNewsletterLoading(false); }} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Aktualisieren</button>
                </div>
                {newsletterLoading && <div className="text-neutral-400 text-sm">Laden…</div>}
                {newsletterError && <div className="text-rose-400 text-sm">{newsletterError}</div>}
                {newsletterSubscribers.length === 0 && !newsletterLoading && <div className="text-[#909296] text-sm">Noch keine Abonnenten.</div>}
                {newsletterSubscribers.length > 0 && (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {newsletterSubscribers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-neutral-900/60 border border-neutral-700/40 text-sm">
                        <span className="text-neutral-200">{s.email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${s.status==='verified' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-yellow-900/30 text-yellow-300'}`}>{s.status==='verified' ? 'Bestätigt' : 'Ausstehend'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-neutral-400 text-xs mt-2">Verifiziert: {newsletterSubscribers.filter(s=>s.status==='verified').length} / Gesamt: {newsletterSubscribers.length}</div>
              </div>
            )}

            {newsletterTab === 'campaigns' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-neutral-300 text-sm font-semibold">Kampagnen</div>
                  <button onClick={async () => { setNewsletterLoading(true); setNewsletterError(null); try { const res = await newsletterCampaignsList(); setNewsletterCampaigns(res.campaigns || []); } catch(e) { setNewsletterError(e instanceof Error ? e.message : 'Fehler'); } setNewsletterLoading(false); }} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Aktualisieren</button>
                </div>
                {newsletterLoading && <div className="text-neutral-400 text-sm">Laden…</div>}
                {newsletterError && <div className="text-rose-400 text-sm">{newsletterError}</div>}
                <button onClick={() => { setActiveCampaign({ id: crypto.randomUUID(), subject_de: '', subject_en: '', html_de: '', html_en: '', created_at: new Date().toISOString(), sent_at: null, recipients_count: 0 }); setNewsletterTab('editor'); }} className="mb-2 px-3 py-1.5 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-800 text-xs">+ Neue Kampagne</button>
                {newsletterCampaigns.length === 0 && !newsletterLoading && <div className="text-[#909296] text-sm">Noch keine Kampagnen.</div>}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {newsletterCampaigns.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded bg-neutral-900/60 border border-neutral-700/40">
                      <div className="flex-1 min-w-0">
                        <div className="text-neutral-200 text-sm truncate">{c.subject_de || c.subject_en || '(kein Betreff)'}</div>
                        <div className="text-neutral-500 text-xs">{c.sent_at ? `Versendet: ${new Date(c.sent_at).toLocaleDateString('de-DE')} (${c.recipients_count || 0})` : 'Entwurf'}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button onClick={() => { setActiveCampaign(c); setNewsletterTab('editor'); }} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Bearbeiten</button>
                        {!c.sent_at && (
                          <button onClick={async () => { if (!window.confirm('Wirklich an alle verifizierten Abonnenten senden? (Sprache wird automatisch gewählt)')) return; setNewsletterSending(true); setNewsletterSendMsg(null); try { const res = await newsletterSend(c.id, 'auto'); setNewsletterSendMsg(`${res.recipients || 0} Empfänger gesendet`); const list = await newsletterCampaignsList(); setNewsletterCampaigns(list.campaigns || []); } catch(e) { setNewsletterSendMsg('Fehler beim Versand'); } setNewsletterSending(false); }} disabled={newsletterSending} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Senden</button>
                        )}
                        <button onClick={async () => { if (!window.confirm('Kampagne wirklich löschen?')) return; try { await newsletterCampaignDelete(c.id); const list = await newsletterCampaignsList(); setNewsletterCampaigns(list.campaigns || []); } catch(e) {} }} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Löschen</button>
                      </div>
                    </div>
                  ))}
                </div>
                {newsletterSendMsg && <div className="mt-2 text-emerald-400 text-sm">{newsletterSendMsg}</div>}
              </div>
            )}

            {newsletterTab === 'editor' && activeCampaign && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setNewsletterTab('campaigns')} className="text-xs text-neutral-400 hover:text-neutral-200 underline">← Zurück zu Kampagnen</button>
                  <div className="inline-flex rounded-md overflow-hidden border border-neutral-700/40">
                    {(['de','en'] as const).map(l => (
                      <button key={l} onClick={() => setNewsletterEditorLang(l)} className={`px-2 py-1 text-xs ${newsletterEditorLang===l ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-400'}`}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <Input placeholder={`Betreffzeile (${newsletterEditorLang.toUpperCase()})`} value={newsletterEditorLang==='de' ? (activeCampaign.subject_de||'') : (activeCampaign.subject_en||'')} onChange={e => setActiveCampaign(prev => prev ? { ...prev, [newsletterEditorLang==='de' ? 'subject_de' : 'subject_en']: e.target.value } : prev)} />
                <RichTextEditor
                  value={newsletterEditorLang==='de' ? (activeCampaign.html_de||'') : (activeCampaign.html_en||'')}
                  onChange={(html) => setActiveCampaign(prev => prev ? { ...prev, [newsletterEditorLang==='de' ? 'html_de' : 'html_en']: html } : prev)}
                  onPickImage={(insert) => { const url = window.prompt('Bild-URL'); if (url) insert(url); }}
                  galleryImages={allGalleryImages}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={async () => { try { await newsletterCampaignSave(activeCampaign); setNewsletterSendMsg('Gespeichert.'); const list = await newsletterCampaignsList(); setNewsletterCampaigns(list.campaigns || []); } catch(e) { setNewsletterSendMsg('Fehler beim Speichern.'); } }} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Speichern</button>
                  {!activeCampaign.sent_at && (
                    <button onClick={async () => { if (!window.confirm('Wirklich an alle verifizierten Abonnenten senden? (Sprache wird automatisch gewählt)')) return; setNewsletterSending(true); setNewsletterSendMsg(null); try { const res = await newsletterSend(activeCampaign.id, 'auto'); setNewsletterSendMsg(`${res.recipients || 0} Empfänger gesendet`); const list = await newsletterCampaignsList(); setNewsletterCampaigns(list.campaigns || []); } catch(e) { setNewsletterSendMsg('Fehler beim Versand'); } setNewsletterSending(false); }} disabled={newsletterSending} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{newsletterSending ? 'Sendet…' : 'Senden'}</button>
                  )}
                </div>
                {newsletterSendMsg && <div className="text-emerald-400 text-sm">{newsletterSendMsg}</div>}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bottom action bar: Admin‑Karten Edit (left) + global Speichern (right) */}
      <div className="mt-6 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700/40 bg-neutral-900/60 text-neutral-200 text-sm">
          <input type="checkbox" checked={adminEdit} onChange={e=>setAdminEdit(e.target.checked)} />
          Admin‑Karten: Edit
        </label>
        <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{saving ? 'Speichert…' : 'Speichern'}</button>
      </div>
    </div>
  );
};

export default AdminContentPanel;
