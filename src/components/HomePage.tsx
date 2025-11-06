 
import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../lib/api';
import { Globe, Instagram, Facebook, Youtube, Twitter, Linkedin, Music2, MessageCircle } from 'lucide-react';
import { contentGet, ordersCreate, bookingRequest, type SiteContent, type OrderItem } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { authenticated, name: authName, email: authEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [lastOrder, setLastOrder] = useState<OrderItem | null>(null);
  // Global confirmation after ticket booking
  const [orderOk, setOrderOk] = useState<string | null>(null);

  // Tickets modal state
  const [ticketOpen, setTicketOpen] = useState(false);
  const [lang, setLang] = useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return v === 'en' ? 'en' : 'de'; } catch { return 'de'; }
  });
  useEffect(() => {
    const onLang = (e: Event) => {
      try {
        const v = (e as CustomEvent).detail as any;
        if (v === 'de' || v === 'en') { setLang(v); return; }
        const ls = window.localStorage.getItem('lang');
        setLang(ls === 'en' ? 'en' : 'de');
      } catch {
        const ls = window.localStorage.getItem('lang');
        setLang(ls === 'en' ? 'en' : 'de');
      }
    };
    window.addEventListener('lang:changed', onLang as any);
    return () => window.removeEventListener('lang:changed', onLang as any);
  }, []);
  const theme = useMemo<'dark'|'light'>(() => {
    try { const t = window.localStorage.getItem('theme'); return (t === 'light' ? 'light' : 'dark'); } catch { return 'dark'; }
  }, []);
  const cardBase = 'rounded-xl border';
  const cardTone = theme === 'light' ? 'bg-white/85 border-neutral-200' : 'bg-neutral-900/70 border-neutral-700/20';
  const cardToneAlt = theme === 'light' ? 'bg-white/85 border-neutral-200' : 'bg-neutral-900/70 border-neutral-700/20';
  const [ticketSel, setTicketSel] = useState<{ id: string; title: string; url: string; image?: string } | null>(null);
  const [ticketStep, setTicketStep] = useState<1 | 2 | 3>(1);
  const [ticketDate, setTicketDate] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'online' | 'onsite'>('onsite');

  // Helper: pick language-specific value (supports string or {de,en})
  const L = (v: any): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (lang === 'en' ? (v?.en || v?.de || '') : (v?.de || v?.en || '')) as string;
  };

  // Instagram thumbnails (server-side preview fetch)
  const [instaThumbs, setInstaThumbs] = useState<Record<string, string | null>>({});
  // Open state of gallery folders on Home
  const [openGals, setOpenGals] = useState<Record<string, boolean>>({});
  // Open state for Spotify embed expansion on Home
  const [openSpotify, setOpenSpotify] = useState<Record<string, boolean>>({});

  // Lightbox state
  type LBItem = { type: 'image'|'video'|'youtube'|'instagram'; url: string; title?: string };
  const [lbOpen, setLbOpen] = useState(false);
  const [lbList, setLbList] = useState<LBItem[]>([]);
  const [lbIndex, setLbIndex] = useState(0);
  const openLightbox = (items: LBItem[], start: number) => {
    setLbList(items);
    setLbIndex(Math.max(0, Math.min(start, items.length - 1)));
    setLbOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Booking form component
  const BookingForm: React.FC<{ note?: string; phone?: string }> = ({ note, phone }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [okMsg, setOkMsg] = useState<string|null>(null);
    const [errMsg, setErrMsg] = useState<string|null>(null);

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setOkMsg(null); setErrMsg(null);
      if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setErrMsg(lang==='en' ? 'Please enter name and a valid email.' : 'Bitte Name und eine gültige E‑Mail angeben.');
        return;
      }
      setBusy(true);
      try {
        await bookingRequest({ name, email, message });
        setOkMsg(lang==='en' ? 'Vielen Dank! Wir melden uns.' : 'Vielen Dank! Wir melden uns.');
        setName(''); setEmail(''); setMessage('');
      } catch (e) {
        setErrMsg(e instanceof Error ? e.message : (lang==='en'?'Submission failed':'Absenden fehlgeschlagen'));
      } finally { setBusy(false); }
    };

    return (
      <form onSubmit={onSubmit} className={`${cardBase} ${cardTone} p-4 space-y-3 max-w-[1200px] mx-auto`}>
        {okMsg && <div className="p-2 rounded bg-emerald-600/15 border border-emerald-500/30 text-emerald-200 text-sm">{okMsg}</div>}
        {errMsg && <div className="p-2 rounded bg-rose-600/15 border border-rose-500/30 text-rose-200 text-sm">{errMsg}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100" placeholder={lang==='en'?'Name*':'Name*'} value={name} onChange={e=>setName(e.target.value)} />
          <input className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100" placeholder={lang==='en'?'Email*':'E‑Mail*'} value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100" rows={4} placeholder={lang==='en'?'Message':'Nachricht'} value={message} onChange={e=>setMessage(e.target.value)} />
        {note && <div className="text-xs text-neutral-400">{note}</div>}
        {phone && <div className="text-xs text-neutral-400">{lang==='en'?'Phone':'Telefon'}: <span className="text-neutral-300">{phone}</span></div>}
        <div className="flex justify-end">
          <button disabled={busy} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700 disabled:opacity-60">{busy ? (lang==='en'?'Sending…':'Senden…') : (lang==='en'?'Send request':'Anfrage senden')}</button>
        </div>
      </form>
    );
  };
  const closeLightbox = () => { setLbOpen(false); setLbList([]); setLbIndex(0); document.body.style.overflow = ''; };
  const nextLb = () => setLbIndex(i => (i + 1) % (lbList.length || 1));
  const prevLb = () => setLbIndex(i => (i - 1 + (lbList.length || 1)) % (lbList.length || 1));
  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLb();
      if (e.key === 'ArrowLeft') prevLb();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbOpen, lbList.length]);
  const openTicket = (t: { id: string; title: string; url: string }) => {
    if (!authenticated) {
      setOrderOk('Bitte zuerst einloggen, um Tickets zu buchen.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTicketSel(t as any);
    setTicketOpen(true);
    setTicketStep(1);
    setTicketDate(null);
    setBuyerName(authName ?? '');
    setBuyerEmail(authEmail ?? '');
    // Enforce ticket-defined payment: online if URL exists, else onsite
    setPaymentChoice(((t as any)?.paymentType as 'online' | 'onsite' | undefined) || (t.url ? 'online' : 'onsite'));
  };
  const days = useMemo(() => {
    // Saturdays only for the next ~90 days
    const out: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (d.getDay() !== 6) continue; // 6 = Saturday
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const value = `${yyyy}-${mm}-${dd}`;
      const label = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
      out.push({ label, value });
    }
    return out;
  }, []);
  const goCheckout = async () => {
    if (!ticketSel || !ticketDate) return;
    const hasUrl = typeof ticketSel.url === 'string' && ticketSel.url.trim().length > 0;
    if (paymentChoice === 'online') {
      if (!hasUrl) {
        setOrderOk('Für Online-Buchung fehlt eine externe URL. Bitte "Vor Ort" wählen.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const url = new URL(ticketSel.url, window.location.origin);
      const href = (ticketSel.url.startsWith('http') ? ticketSel.url : url.href);
      const final = href + (href.includes('?') ? `&date=${ticketDate}` : `?date=${ticketDate}`);
      try {
        const res = await ordersCreate({ ticket_id: ticketSel.id, title: ticketSel.title, date: ticketDate, payment: 'external', href: final, name: buyerName || authName || undefined, email: buyerEmail || authEmail || undefined });
        setLastOrder(res.order as any);
      } catch {}
      // Open external checkout in new tab, then confirm on Home
      window.open(final, '_blank', 'noopener');
      setTicketOpen(false);
      setTicketSel(null);
      setOrderOk(`Buchung erfasst: "${ticketSel.title}" am ${ticketDate}. Du wurdest zum Anbieter weitergeleitet.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // On-site payment: create order and show confirmation (step 3)
    try {
      const res = await ordersCreate({ ticket_id: ticketSel.id, title: ticketSel.title, date: ticketDate, payment: 'onsite', name: buyerName || authName || undefined, email: buyerEmail || authEmail || undefined });
      setLastOrder(res.order as any);
      setTicketStep(3);
    } catch (e) {
      // fallback: still show a minimal confirmation
      setTicketStep(3);
    }
  };

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // Fetch Instagram thumbnails when galleries change
  useEffect(() => {
    const urls = new Set<string>();
    (content.galleries || []).forEach(g => (g.items||[]).forEach(it => { if (it.type === 'instagram' && it.url) urls.add(it.url); }));
    const missing = Array.from(urls).filter(u => instaThumbs[u] === undefined);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries: Array<[string, string | null]> = [];
      await Promise.all(missing.map(async (u) => {
        try {
          const q = new URLSearchParams({ url: u }).toString();
          const resp = await fetch(`${API_BASE}/link_preview.php?${q}`, { credentials: 'include' });
          const data = await resp.json().catch(() => ({}));
          const thumb = data?.thumbnail || null;
          entries.push([u, typeof thumb === 'string' ? thumb : null]);
        } catch {
          entries.push([u, null]);
        }
      }));
      if (!cancelled && entries.length) {
        setInstaThumbs(prev => {
          const next = { ...prev } as Record<string, string | null>;
          entries.forEach(([u, t]) => { next[u] = t; });
          return next;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [content.galleries]);

  // (Overview of own orders moved out of Home page by request)

  const mapSrc = useMemo(() => {
    if (content.map?.embedUrl) return content.map.embedUrl;
    if (content.mapAddress && content.mapAddress.trim()) {
      return `https://www.google.com/maps?q=${encodeURIComponent(content.mapAddress)}&output=embed`;
    }
    return '';
  }, [content.map, content.mapAddress]);

  // Active tickets only for Home display
  const ticketsActive = useMemo(() => {
    const list = Array.isArray(content.tickets) ? content.tickets : [];
    return list.filter(t => t && (t.active !== false));
  }, [content.tickets]);

  const SocialIcon: React.FC<{ type?: string; className?: string }> = ({ type, className }) => {
    const cls = className || 'h-10 w-10 text-neutral-100';
    switch (type) {
      case 'instagram': return <Instagram className={cls} />;
      case 'facebook': return <Facebook className={cls} />;
      case 'youtube': return <Youtube className={cls} />;
      case 'twitter': return <Twitter className={cls} />;
      case 'linkedin': return <Linkedin className={cls} />;
      case 'whatsapp': return <MessageCircle className={cls} />;
      case 'spotify':
      case 'soundcloud':
      case 'bandcamp': return <Music2 className={cls} />;
      default: return <Globe className={cls} />;
    }
  };

  
  const allowedSections = ['news','events','booking','media','about','social','contact'] as const;
  const defaultOrder = ['news','events','booking','media','about','social','contact'] as const;
  const sectionsOrderRaw = (Array.isArray((content as any).sectionsOrder) && (content as any).sectionsOrder.length ? (content as any).sectionsOrder as string[] : [...defaultOrder]);
  const sectionsOrder = (() => {
    const filtered = (sectionsOrderRaw||[]).filter(k => (allowedSections as readonly string[]).includes(k));
    for (const k of allowedSections) if (!filtered.includes(k)) filtered.push(k);
    return filtered;
  })();

  const renderSection = (key: string) => {
    switch (key) {
      case 'news':
        return (
          <React.Fragment key="news">
            <div id="news" className="scroll-mt-[68px] sm:scroll-mt-[96px]" />
            {(content.heroTitle || content.heroText || content.heroUrl) && (
              <div className="relative">
                <div className="relative overflow-hidden">
                  <div className="w-full" style={{ height: `${content.heroHeight ?? 300}px` }}>
                    {content.heroUrl ? (
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
                          <h2 className="font-display uppercase text-white drop-shadow tracking-wider text-2xl sm:text-3xl md:text-4xl font-extrabold">
                            {content.heroTitle}
                          </h2>
                        )}
                        {content.heroText && (
                          <p className="font-display mt-2 uppercase text-neutral-200 drop-shadow tracking-wider whitespace-pre-line text-xs sm:text-sm">
                            {content.heroText}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {content.newsEnabled && Array.isArray(content.news) && content.news.some(p => p.published !== false && (p.title || p.html)) && (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-center">
                  <h3 className="font-display text-neutral-100 text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-center">{lang==='en' ? 'News' : 'News'}</h3>
                </div>
                <div className="space-y-4">
                  {content.news.filter(p => p.published !== false).sort((a,b)=> (b.date||'').localeCompare(a.date||'')).map(p => (
                    <article key={p.id} className={`p-3 ${cardBase} ${cardTone}`}>
                      {(p.title) && <h3 className="text-neutral-100 text-lg font-semibold mb-1">{L(p.title as any)}</h3>}
                      {p.date && <div className="text-neutral-400 text-xs mb-2">{new Date(p.date).toLocaleDateString('de-DE')}</div>}
                      <div className="prose prose-invert max-w-none text-neutral-200" dangerouslySetInnerHTML={{ __html: L(p.html as any) }} />
                    </article>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      case 'booking': {
        const cfg = content.booking || {};
        if (!cfg.enabled) return null;
        return (
          <div id="booking" className="relative scroll-mt-[68px] sm:scroll-mt-[96px]" key="booking">
            <div className="p-2 sm:p-3">
              <div className="mb-3 flex items-center justify-center">
                <h3 className="font-display text-neutral-100 text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-center">{L(cfg.headline as any) || (lang==='en'?'Booking':'Booking')}</h3>
              </div>
              <BookingForm note={L(cfg.note as any)} phone={cfg.phone} />
            </div>
          </div>
        );
      }
      case 'about':
        return (content.about?.title || content.about?.text || (content.about?.members||[]).length>0) ? (
          <div id="about" className="relative scroll-mt-[68px] sm:scroll-mt-[96px]" key="about">
            <div className="p-2 sm:p-3">
              <div className="mb-2 flex items-center justify-center">
                <h3 className="font-display text-neutral-100 text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-center">{L(content.about?.title as any) || (lang==='en' ? 'About' : 'Über uns')}</h3>
              </div>
              <div className={`${cardBase} ${cardTone} p-3`}>
                {content.about?.text && (
                  <div
                    className="prose prose-invert max-w-none text-neutral-300 text-sm text-left"
                    dangerouslySetInnerHTML={{ __html: L(content.about?.text as any) }}
                  />
                )}
              </div>
              {(content.about?.members||[]).length>0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(content.about?.members||[]).slice().sort((a,b)=> (a.order??0)-(b.order??0)).map((m, idx) => (
                    <div key={m.id||idx} className={`${cardBase} ${cardTone} p-3`}>
                      <div className="flex flex-col items-start text-left gap-2">
                        {m.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.image} alt={m.name||'Profil'} className="self-center w-28 h-28 rounded-full object-cover border border-neutral-700/30" />
                        ) : (
                          <div className="self-center w-28 h-28 rounded-full bg-neutral-800/40 border border-neutral-700/30" />
                        )}
                        <div className="text-neutral-100 font-medium">{m.name||''}</div>
                        {m.role && <div className="text-neutral-400 text-sm">{m.role}</div>}
                        {m.bio && <div className="text-neutral-300 text-xs whitespace-pre-line">{L(m.bio as any)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null;
      case 'contact':
        return (content.contact?.email || content.contact?.phone || content.contact?.address) ? (
          <div className="relative" key="contact">
            <div className="p-2 sm:p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {content.contact?.email && (
                  <div className={`p-3 ${cardBase} ${cardToneAlt} text-neutral-200 text-sm`}>{content.contact.email}</div>
                )}
                {content.contact?.phone && (
                  <div className={`p-3 ${cardBase} ${cardToneAlt} text-neutral-200 text-sm`}>{content.contact.phone}</div>
                )}
                {content.contact?.address && (
                  <div className={`p-3 ${cardBase} ${cardToneAlt} text-neutral-200 text-sm`}>{content.contact.address}</div>
                )}
              </div>
            </div>
          </div>
        ) : null;
      case 'social':
        return (Array.isArray(content.socials) && content.socials.length > 0) ? (
          <div className="relative" key="social">
            <div className="p-2 sm:p-3">
              <div className="mb-3 flex items-center justify-center">
                <h3 className="font-display text-neutral-100 text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-center">{lang==='en' ? 'Social' : 'Social'}</h3>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {content.socials.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.type || 'link'}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#77111c] border-[0.5px] border-[#77111c]/60 hover:bg-[#8b1522] transition-all duration-200 shadow-[0_0_0_0_rgba(139,21,34,0)] hover:shadow-[0_0_24px_8px_rgba(139,21,34,0.7)]"
                    title={s.type || s.url}
                  >
                    <SocialIcon type={s.type} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null;
      case 'media':
        return (() => {
          const byYear = new Map<number, { name: string; items: any[] }[]>();
          (content.galleries || [])
            .filter(g => (g as any).status !== 'internal' && (g as any).status !== 'locked')
            .forEach(g => {
              const arr = byYear.get(g.year) || [];
              arr.push({ name: g.name, items: g.items || [] });
              byYear.set(g.year, arr);
            });
          const years = Array.from(byYear.keys()).sort((a,b)=> b-a);
          const getYTThumb = (u: string): string | null => {
            try {
              const url = new URL(u, window.location.origin);
              let id = '';
              if (url.hostname.includes('youtu.be')) id = url.pathname.replace('/', '');
              if (url.hostname.includes('youtube.com')) id = url.searchParams.get('v') || '';
              return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
            } catch { return null; }
          };
          const GalleryTile: React.FC<{ y: number; g: { name: string; items: any[] } }> = ({ y, g }) => {
            const key = `${y}:${g.name}`;
            let preview: { kind: 'image'|'youtube'|'instagram'|'video'|null; url: string|null } = { kind: null, url: null };
            for (const it of (g.items||[])) {
              if (it.type==='image') { preview = { kind:'image', url: it.url }; break; }
              if (it.type==='youtube') { preview = { kind:'youtube', url: getYTThumb(it.url) || it.url }; break; }
              if (it.type==='instagram') { preview = { kind:'instagram', url: instaThumbs[it.url] || null }; break; }
              if (it.type==='video') { preview = { kind:'video', url: null }; }
            }
            return (
              <div className={`${cardBase} ${cardTone}`}>
                <button onClick={() => setOpenGals(prev => ({ ...prev, [key]: !prev[key] }))} className="w-full text-left">
                  <div className="w-full h-44 sm:h-52 overflow-hidden">
                    {preview.kind==='image' && preview.url && (<img src={preview.url} alt={g.name} className="preview-img w-full h-full object-cover" />)}
                    {preview.kind==='youtube' && preview.url && (<img src={preview.url} alt={g.name} className="preview-img w-full h-full object-cover" />)}
                    {preview.kind==='instagram' && preview.url && (<img src={preview.url} alt={g.name} className="preview-img w-full h-full object-cover" />)}
                    {(!preview.url) && (<div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">Keine Vorschau</div>)}
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <div className="text-neutral-100 font-medium truncate mr-2">{g.name}</div>
                    <div className="text-neutral-400 text-sm">{(g.items||[]).length}</div>
                  </div>
                </button>
              </div>
            );
          };
          const SpotifyEmbed: React.FC<{ item: any; open: boolean; onToggle: () => void }> = ({ item, open, onToggle }) => {
            const parseSpotify = (url: string) => {
              try {
                const u = new URL(url);
                if (!u.hostname.includes('spotify.com')) return null as any;
                let parts = u.pathname.split('/').filter(Boolean);
                if (parts[0] && parts[0].startsWith('intl-')) parts = parts.slice(1);
                if (parts[0] === 'embed') parts = parts.slice(1);
                const type = parts[0];
                const id = parts[1];
                if (!type || !id) return null as any;
                return { type, id } as { type: string; id: string };
              } catch { return null as any; }
            };
            const p = parseSpotify(item.url || '') || { type: 'track' } as any;
            const src = (() => {
              const parsed = parseSpotify(item.url || '');
              return parsed ? `https://open.spotify.com/embed/${parsed.type}/${parsed.id}` : '';
            })();
            const largeTypes = ['track','album','playlist'];
            const height = largeTypes.includes(p.type) ? 352 : 152;
            return (
              <div className={`${open ? 'col-span-2 sm:col-span-3 md:col-span-4' : ''} ${cardBase} ${cardTone} overflow-hidden`}>
                <button onClick={onToggle} className="w-full text-left">
                  <div className="p-3">
                    {item.title && <div className="text-neutral-200 text-sm font-medium mb-2">{item.title}</div>}
                    {open ? (
                      <div className="flex items-center gap-3">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverUrl} alt={item.title || 'Cover'} className="w-12 h-12 rounded-md object-cover border border-neutral-700/40" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-neutral-800/40 border border-neutral-700/40" />
                        )}
                        <div className="text-neutral-300 text-xs">{lang==='en'?'Hide player':'Player ausblenden'}</div>
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-neutral-700/30 bg-neutral-800/40 flex items-center justify-center">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverUrl} alt={item.title || 'Cover'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-neutral-400 text-sm">Cover hinzufügen</div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
                {open && (
                  <div className="px-3 pb-3">
                    {src ? (
                      <iframe
                        title={item.title || 'Spotify'}
                        src={src}
                        width="100%"
                        height={height}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-6 text-neutral-400 text-sm">Spotify‑Link ungültig</div>
                    )}
                  </div>
                )}
              </div>
            );
          };
          const mediaEmbedsRaw = (content.mediaEmbeds || [])
            .filter(me => me.type === 'spotify' && me.enabled)
            .map(me => me);
          const parseSpotifyUrl = (url: string) => {
            try {
              const u = new URL(url);
              if (!u.hostname.includes('spotify.com')) return null as any;
              let parts = u.pathname.split('/').filter(Boolean);
              if (parts[0] && parts[0].startsWith('intl-')) parts = parts.slice(1);
              if (parts[0] === 'embed') parts = parts.slice(1);
              const type = parts[0];
              const id = parts[1];
              if (!type || !id) return null as any;
              return { type, id } as { type: string; id: string };
            } catch { return null as any; }
          };
          const kindOf = (m: any): 'single'|'album'|'other' => {
            const t = (m.title || '').toString().trim().toUpperCase();
            if (t.includes('SINGLE')) return 'single';
            if (t.includes('ALBUM')) return 'album';
            const p = parseSpotifyUrl(m.url || '');
            if (p?.type === 'track') return 'single';
            if (p?.type === 'album') return 'album';
            return 'other';
          };
          const singles = mediaEmbedsRaw.filter(m => kindOf(m) === 'single');
          const albums  = mediaEmbedsRaw.filter(m => kindOf(m) === 'album');
          const others  = mediaEmbedsRaw.filter(m => kindOf(m) === 'other');
          return (
            <div id="media" className="relative scroll-mt-[68px] sm:scroll-mt-[96px]" key="media">
              <div className="p-2 sm:p-3 space-y-6">
                {(singles.length>0 || albums.length>0 || others.length>0) && (
                  <div className="mb-6">
                    <h3 className="font-display text-neutral-100 text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-center">{lang==='en' ? 'Music' : 'Musik'}</h3>
                    {albums.length>0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-neutral-300 text-sm font-medium">{lang==='en'?'Albums':'Alben'}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {albums.map((me, idx) => (
                            <SpotifyEmbed
                              key={me.id || `album-${idx}`}
                              item={me}
                              open={!!openSpotify[me.id]}
                              onToggle={() => setOpenSpotify(prev => ({ ...prev, [me.id]: !prev[me.id] }))}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {singles.length>0 && (
                      <div className="mt-6 space-y-2">
                        <div className="text-neutral-300 text-sm font-medium">{lang==='en'?'Singles':'Singles'}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {singles.map((me, idx) => (
                            <SpotifyEmbed
                              key={me.id || `single-${idx}`}
                              item={me}
                              open={!!openSpotify[me.id]}
                              onToggle={() => setOpenSpotify(prev => ({ ...prev, [me.id]: !prev[me.id] }))}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {others.length>0 && (
                      <div className="mt-6 space-y-2">
                        <div className="text-neutral-300 text-sm font-medium">{lang==='en'?'Other':'Weitere'}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {others.map((me, idx) => (
                            <SpotifyEmbed
                              key={me.id || `other-${idx}`}
                              item={me}
                              open={!!openSpotify[me.id]}
                              onToggle={() => setOpenSpotify(prev => ({ ...prev, [me.id]: !prev[me.id] }))}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Galerie Heading */}
                {years.length>0 && (
                  <div className="mb-2">
                    <h3 className="font-display text-neutral-100 text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-center">{lang==='en' ? 'Gallery' : 'Galerie'}</h3>
                  </div>
                )}
                {years.map(y => (
                  <div key={y} className="space-y-3">
                    {/* Jahrentitel entfernt */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {(byYear.get(y) || []).sort((a,b)=> a.name.localeCompare(b.name)).map(g => {
                        const key = `${y}:${g.name}`;
                        return (
                          <React.Fragment key={g.name}>
                            <GalleryTile y={y} g={g} />
                            {openGals[key] && (
                              <div className="col-span-2 sm:col-span-3 md:col-span-4">
                                <div className={`${cardBase} ${cardTone} p-3`}>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {(g.items||[]).map((it, idx) => (
                                      <button key={idx} className={`rounded-lg overflow-hidden ${theme==='light' ? 'bg-white border-[#E7DED0]' : 'bg-neutral-900 border border-neutral-700/20'} text-left group`} onClick={() => openLightbox((g.items||[]) as LBItem[], idx)}>
                                        {it.type==='image' ? (
                                          <img src={it.url} alt={it.title||'Bild'} className="w-full h-64 sm:h-72 md:h-80 object-cover group-hover:opacity-95 transition" />
                                        ) : it.type==='video' ? (
                                          <div className="relative">
                                            <video src={it.url} className="w-full h-64 sm:h-72 md:h-80 object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-neutral-200">Öffnen</div>
                                          </div>
                                        ) : it.type==='youtube' ? (
                                          (() => {
                                            let id = '';
                                            try {
                                              const u = new URL(it.url, window.location.origin);
                                              if (u.hostname.includes('youtu.be')) id = u.pathname.replace('/', '');
                                              if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || '';
                                            } catch {}
                                            const thumb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
                                            return thumb ? (
                                              <img src={thumb} alt={it.title||'YouTube'} className="w-full h-64 sm:h-72 md:h-80 object-cover" />
                                            ) : (
                                              <div className="w-full h-64 sm:h-72 md:h-80 flex items-center justify-center text-neutral-300">YouTube öffnen</div>
                                            );
                                          })()
                                        ) : (
                                          <div className="w-full h-64 sm:h-72 md:h-80 flex items-center justify-center text-neutral-300">Instagram öffnen</div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })();
      case 'map':
        return mapSrc ? (
          <div className="relative" key="map">
            {/* Full-bleed wrapper to span viewport width */}
            <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
              <iframe
                title="Karte"
                src={mapSrc}
                className="w-screen h-72 md:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ filter: 'grayscale(100%) brightness(0.6) contrast(1.05)' }}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/20" />
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };


  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 self-start mt-2 md:mt-3">
      <section className="relative p-3 sm:p-5 space-y-8">
        {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>}
        {loading && <div className="text-neutral-400">Lade…</div>}
        {orderOk && (
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-emerald-500/40 text-emerald-300 text-sm">
            {orderOk}
          </div>
        )}

        {!loading && (
          <>
            {sectionsOrder.map(renderSection)}
          </>
        )}
      </section>

      {/* Lightbox overlay */}
      {lbOpen && lbList[lbIndex] && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={closeLightbox}>
          <div className="absolute inset-0" />
          <div className="relative max-w-6xl w-full" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-10 right-0 flex items-center gap-3">
              <button onClick={closeLightbox} className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">Schließen</button>
            </div>
            <div className="relative w-full flex items-center justify-center">
              {lbList[lbIndex].type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lbList[lbIndex].url} alt={lbList[lbIndex].title || 'Bild'} className="max-h-[80vh] w-auto h-auto object-contain" />
              )}
              {lbList[lbIndex].type === 'video' && (
                <video src={lbList[lbIndex].url} controls autoPlay className="max-h-[80vh] w-auto h-auto object-contain" />
              )}
              {lbList[lbIndex].type === 'youtube' && (() => {
                let id = '';
                try {
                  const u = new URL(lbList[lbIndex].url, window.location.origin);
                  if (u.hostname.includes('youtu.be')) id = u.pathname.replace('/', '');
                  if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || '';
                } catch {}
                const src = id ? `https://www.youtube.com/embed/${id}` : lbList[lbIndex].url;
                return <iframe className="w-full aspect-video max-h-[80vh]" src={src} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />;
              })()}
              {lbList[lbIndex].type === 'instagram' && (
                <a href={lbList[lbIndex].url} target="_blank" rel="noreferrer" className="text-neutral-200 underline">Instagram öffnen</a>
              )}
            </div>
            {lbList.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                  <button onClick={prevLb} className="pointer-events-auto ml-2 px-3 py-2 rounded bg-neutral-800/70 text-neutral-200 border border-neutral-700">‹</button>
                  <button onClick={nextLb} className="pointer-events-auto mr-2 px-3 py-2 rounded bg-neutral-800/70 text-neutral-200 border border-neutral-700">›</button>
                </div>
                {/* Timeline thumbnails */}
                <div className="mt-4 px-1">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                    {lbList.map((it, i) => {
                      let thumb: string | null = null;
                      if (it.type === 'image') thumb = it.url;
                      if (it.type === 'youtube') {
                        try {
                          const u = new URL(it.url, window.location.origin);
                          let id = '';
                          if (u.hostname.includes('youtu.be')) id = u.pathname.replace('/', '');
                          if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || '';
                          thumb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
                        } catch {}
                      }
                      if (it.type === 'instagram') {
                        thumb = instaThumbs[it.url] || null;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setLbIndex(i)}
                          className={`relative h-16 rounded-md overflow-hidden border ${i===lbIndex? 'border-neutral-100' : 'border-neutral-700'} bg-neutral-800/40 flex items-center`}
                          style={{ padding: 0, flex: '0 0 calc(100%/15)', maxWidth: 'calc(100%/15)' }}
                        >
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={it.title || 'thumb'} loading="lazy" className="h-full w-auto object-contain" />
                          ) : (
                            <div className="h-16 px-3 flex items-center justify-center text-[11px] text-neutral-300">{it.type}</div>
                          )}
                          {i===lbIndex && <div className="absolute inset-0 ring-2 ring-neutral-100 pointer-events-none" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ticket Buchung Modal (2 Schritte) */}
      {ticketOpen && ticketSel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTicketOpen(false)} />
          <div className="relative w-full max-w-xl rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 text-lg font-semibold">Service buchen</h3>
              <button onClick={() => setTicketOpen(false)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">✕</button>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className={"w-7 h-7 rounded-full flex items-center justify-center "+(ticketStep===1?"bg-neutral-200 text-neutral-900":"bg-neutral-700 text-neutral-200")}>1</div>
              <div className="w-12 h-[2px] bg-neutral-700" />
              <div className={"w-7 h-7 rounded-full flex items-center justify-center "+(ticketStep===2?"bg-neutral-200 text-neutral-900":"bg-neutral-700 text-neutral-200")}>2</div>
              <div className="w-12 h-[2px] bg-neutral-700" />
              <div className={"w-7 h-7 rounded-full flex items-center justify-center "+(ticketStep===3?"bg-neutral-200 text-neutral-900":"bg-neutral-700 text-neutral-200")}>3</div>
            </div>
            {ticketStep === 1 && (
              <div className="space-y-3">
                <div className="uppercase text-sm text-neutral-300">Service auswählen</div>
                <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ticketSel?.image || 'https://via.placeholder.com/100'} alt={ticketSel?.title || 'Ticket'} className="w-12 h-12 rounded-full object-cover border border-neutral-700" />
                  <div className="text-neutral-100 font-medium">{ticketSel?.title || ''}</div>
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-200 text-sm">
                    Zahlung: {paymentChoice === 'online' ? 'Online' : 'Vor Ort'}
                  </span>
                </div>
                <button onClick={() => setTicketStep(2)} className="w-full px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-900 bg-neutral-200 hover:bg-white">Weiter zum Termin</button>
              </div>
            )}
            {ticketStep === 2 && (
              <div className="space-y-3">
                <div className="uppercase text-sm text-neutral-300">Datum wählen <span className="text-neutral-500">(nur Samstage verfügbar)</span></div>
                <div className="grid grid-cols-3 gap-2 max-h-[46vh] overflow-auto no-scrollbar">
                  {days.map(d => (
                    <button key={d.value} onClick={() => setTicketDate(d.value)} className={"px-2 py-2 rounded-lg border-[0.5px] text-sm "+(ticketDate===d.value?"bg-neutral-700 text-neutral-100 border-neutral-600":"bg-neutral-800/60 text-neutral-100 border-neutral-700/30 hover:bg-neutral-800") }>
                      <div>{d.label}</div>
                      <div className="text-[11px] text-neutral-400">{d.value}</div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Dein Name" className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none" />
                  <input value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="Deine E-Mail" type="email" className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none" />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button onClick={() => setTicketStep(1)} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Zurück</button>
                  <button onClick={goCheckout} disabled={!ticketDate || !buyerName.trim() || !/^\S+@\S+\.\S+$/.test(buyerEmail.trim())} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-900 bg-neutral-200 hover:bg-white disabled:opacity-50">{paymentChoice==='online' ? 'Weiter zu Kontaktdaten' : 'Buchung bestätigen'}</button>
                </div>
              </div>
            )}
            {ticketStep === 3 && (
              <div className="space-y-3">
                <div className="uppercase text-sm text-neutral-300">Bestätigung</div>
                <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 space-y-3">
                  {lastOrder && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-neutral-900 border border-neutral-700/40 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${lastOrder.ticket_code || ''}|${lastOrder.qr_token || ''}`)}`} alt="Ticket QR" className="w-28 h-28 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-neutral-100 font-medium">{lastOrder.title}</div>
                        <div className="text-neutral-300 text-sm">Datum: {lastOrder.date}</div>
                        {lastOrder.ticket_code && (
                          <div className="mt-1 text-sm">
                            <span className="text-neutral-400">Ticket‑Nr.:</span>
                            <span className="ml-2 px-2 py-0.5 rounded-md border bg-neutral-900 text-neutral-100 border-neutral-700/40">{lastOrder.ticket_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button onClick={() => { if (lastOrder) { const msg = `Buchung erfasst: "${lastOrder.title}" am ${lastOrder.date}. ${paymentChoice==='onsite' ? 'Bitte vor Ort bezahlen.' : ''}`; setOrderOk(msg.trim()); } else { setOrderOk('Buchung erfasst.'); } setTicketSel(null); setTicketOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-900 bg-neutral-200 hover:bg-white">Zur Startseite</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
