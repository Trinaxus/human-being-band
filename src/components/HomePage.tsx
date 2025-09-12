import React, { useEffect, useState, useMemo } from 'react';
import { Globe, Instagram, Facebook, Youtube, Twitter, Linkedin, Music2, MessageCircle } from 'lucide-react';
import { contentGet, commentsPublicApproved, commentSubmit, ordersCreate, type SiteContent, type CommentItem, type OrderItem } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { authenticated, name: authName, email: authEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [commentsApproved, setCommentsApproved] = useState<CommentItem[]>([]);
  const [sortBy, setSortBy] = useState<'highest' | 'newest'>('highest');
  const [lastOrder, setLastOrder] = useState<OrderItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formText, setFormText] = useState('');
  const [formOk, setFormOk] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  // Global confirmation after ticket booking
  const [orderOk, setOrderOk] = useState<string | null>(null);

  // Tickets modal state
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSel, setTicketSel] = useState<{ id: string; title: string; url: string; image?: string } | null>(null);
  const [ticketStep, setTicketStep] = useState<1 | 2 | 3>(1);
  const [ticketDate, setTicketDate] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'online' | 'onsite'>('onsite');
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
        // load comments (approved only, public)
        try {
          const cm = await commentsPublicApproved();
          setCommentsApproved(cm.approved || []);
        } catch {}
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  // Prepare reviews data (prefer content.reviews with ratings)
  const reviews = useMemo(() => {
    const r = Array.isArray(content.reviews) ? content.reviews : [];
    return r.filter(x => !!x && typeof x.text === 'string');
  }, [content.reviews]);

  const ratingStats = useMemo(() => {
    const rated = reviews.filter(r => typeof r.rating === 'number');
    const count = rated.length;
    const avg = count ? rated.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
    const buckets = [0,0,0,0,0]; // index 0 => 1 star ... index 4 => 5 stars
    rated.forEach(r => {
      const v = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
      buckets[v-1] += 1;
    });
    return { count, avg, buckets };
  }, [reviews]);

  const SocialIcon: React.FC<{ type?: string; className?: string }> = ({ type, className }) => {
    const cls = className || 'h-5 w-5 text-neutral-100';
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

  const formatRelative = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const diffMs = Date.now() - d.getTime();
      const days = Math.floor(diffMs / (1000*60*60*24));
      if (days < 1) return 'Vor wenigen Stunden';
      const months = Math.floor(days / 30);
      if (months < 1) return `Vor ${days} Tagen`;
      const years = Math.floor(months / 12);
      if (years >= 1) return `Vor ${years} Jahren`;
      return `Vor ${months} Monaten`;
    } catch {
      return '';
    }
  };

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'highest') {
      return list.sort((a,b) => (b.rating || 0) - (a.rating || 0));
    }
    // newest
    return list.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [reviews, sortBy]);

  const submitReview = async () => {
    setFormBusy(true);
    setFormOk(null);
    setFormError(null);
    try {
      if (!formText.trim()) throw new Error('Bitte einen Text eingeben.');
      await commentSubmit(formName.trim() || undefined, formText.trim(), formRating);
      setFormOk('Danke! Ihre Bewertung wurde eingereicht und wartet auf Freigabe.');
      setFormText('');
      setFormName('');
      setFormRating(5);
      setShowForm(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Senden fehlgeschlagen');
    } finally {
      setFormBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-0 sm:px-6 self-start mt-2 md:mt-3">
      <section className="relative bg-neutral-900/80 rounded-xl border-[0.5px] border-neutral-700/20 p-4 sm:p-6 space-y-6">
        {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>}
        {loading && <div className="text-neutral-400">Lade…</div>}
        {orderOk && (
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-emerald-500/40 text-emerald-300 text-sm">
            {orderOk}
          </div>
        )}

        {!loading && (
          <>
            {/* Hero (Bild mit Overlay-Text) */}
            {(content.heroTitle || content.heroText || content.heroUrl) && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="relative rounded-none sm:rounded-xl overflow-hidden bg-neutral-800/60 border-t border-b sm:border border-neutral-700">
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
            )}

            {/* Begrüßung + Meine Bestellungen wurde in die Übersicht ausgelagert */}

            {/* Tickets (unter dem Hero) */}
            {ticketsActive.length > 0 && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="rounded-none sm:rounded-xl bg-neutral-900/80 border-t border-b sm:border sm:rounded-xl border-neutral-700/30 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-neutral-100 text-lg font-semibold uppercase tracking-wide">Tickets</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ticketsActive.map((t) => (
                      <div key={t.id} className="p-4 rounded-none sm:rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.image || 'https://via.placeholder.com/100'}
                          alt={t.title}
                          className="w-14 h-14 rounded-full object-cover border border-neutral-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-neutral-100 font-medium truncate">{t.title}</div>
                          {t.description && (
                            <div className="text-neutral-400 text-xs truncate mt-0.5">{t.description}</div>
                          )}
                        </div>
                        <button onClick={() => openTicket(t as any)} disabled={!authenticated} className={`px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 ${authenticated? 'text-neutral-100 hover:bg-neutral-800' : 'text-neutral-500 opacity-60 cursor-not-allowed'}`}>{authenticated ? 'Buchen' : 'Login nötig'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Über uns */}
            {(content.about?.title || content.about?.text) && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="p-4 sm:p-6 rounded-none sm:rounded-xl bg-neutral-900/80 border-t border-b sm:border sm:rounded-xl border-neutral-700/30">
                  {content.about?.title && <h3 className="text-neutral-100 font-semibold text-lg mb-1">{content.about.title}</h3>}
                  {content.about?.text && <p className="text-neutral-300 text-sm whitespace-pre-line">{content.about.text}</p>}
                </div>
              </div>
            )}

            {/* Kontakt */}
            {(content.contact?.email || content.contact?.phone || content.contact?.address) && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="p-4 sm:p-6 rounded-none sm:rounded-xl bg-neutral-900/80 border-t border-b sm:border sm:rounded-xl border-neutral-700/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {content.contact?.email && (
                      <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 text-neutral-200 text-sm">{content.contact.email}</div>
                    )}
                    {content.contact?.phone && (
                      <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 text-neutral-200 text-sm">{content.contact.phone}</div>
                    )}
                    {content.contact?.address && (
                      <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30 text-neutral-200 text-sm">{content.contact.address}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Social (über Galerie) */}
            {Array.isArray(content.socials) && content.socials.length > 0 && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="p-4 sm:p-6 rounded-none sm:rounded-xl bg-neutral-900/80 border-t border-b sm:border sm:rounded-xl border-neutral-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-neutral-100 text-lg font-semibold uppercase tracking-wide">Social</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {content.socials.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={s.type || 'link'}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 hover:bg-neutral-800"
                        title={s.type || s.url}
                      >
                        <SocialIcon type={s.type} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Galerie */}
            {Array.isArray(content.gallery) && content.gallery.length > 0 && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="p-4 sm:p-6 rounded-none sm:rounded-xl bg-neutral-900/80 border-t border-b sm:border sm:rounded-xl border-neutral-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-neutral-100 text-lg font-semibold uppercase tracking-wide">Galerie</h3>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 snap-x snap-mandatory items-start">
                      {content.gallery.map((url, idx) => (
                        <div key={idx} className="shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 snap-start">
                          <div className="w-full rounded-lg overflow-hidden bg-neutral-800/60 border border-neutral-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Bild ${idx+1}`} className="w-full h-auto object-contain" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bewertungen/Kommentare (oberhalb der Karte) */}
            <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
              <div className="rounded-none sm:rounded-xl bg-neutral-900 border-t border-b sm:border sm:rounded-xl border-neutral-700/30 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-neutral-100 text-lg font-semibold uppercase tracking-wide">Bewertungen</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-sm">Sort by:</span>
                    <select
                      className="px-2 py-1 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 text-sm"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                    >
                      <option value="highest">Highest rated</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Histogramm links */}
                  <div className="lg:col-span-6 space-y-2">
                    {[5,4,3,2,1].map((star) => {
                      const idx = star - 1;
                      const total = ratingStats.count || (reviews.length ? 1 : commentsApproved.length || 1);
                      const val = ratingStats.count ? (ratingStats.buckets[idx] || 0) : (star === 5 ? (commentsApproved.length || reviews.length) : 0);
                      const pct = Math.round((val/total)*100);
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <div className="text-white text-sm">{'★'.repeat(star)}<span className="text-neutral-600">{'★'.repeat(5-star)}</span></div>
                          <div className="flex-1 h-2 bg-neutral-800 rounded">
                            <div className="h-2 bg-neutral-200 rounded" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="w-6 text-right text-neutral-300 text-sm">{val}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Zusammenfassung rechts */}
                  <div className="lg:col-span-6">
                    <div className="relative h-full p-5 rounded-2xl bg-neutral-800/40 border-[0.5px] border-neutral-700/30 flex flex-col items-center justify-center overflow-hidden">
                      {/* Summary block (avg/stars/count) */}
                      <div className="relative flex flex-col items-center gap-1 py-2 px-20 sm:px-24">
                        <div className="relative z-10 text-3xl font-semibold text-neutral-100">{(ratingStats.count ? ratingStats.avg : 5).toFixed(1)}</div>
                        <div className="relative z-10 text-white leading-none">{'★'.repeat(5)}</div>
                        <div className="relative z-10 text-neutral-300 text-sm">{ratingStats.count || commentsApproved.length} Bewertungen</div>
                      </div>

                      <button onClick={() => setShowForm(v => !v)} className="mt-4 px-4 py-2 rounded-xl border-[0.5px] border-neutral-600 text-neutral-100 hover:bg-neutral-800">Schreiben Sie eine Bewertung</button>
                    </div>
                  </div>
                </div>

                {showForm && (
                  <div className="rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/30 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Ihr Name (optional)"
                        className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                      />
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <span className="text-neutral-300 text-sm">Bewertung:</span>
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setFormRating(n)}
                            className={(n <= formRating ? 'text-[#FFD166]' : 'text-neutral-600')+ ' text-lg'}
                          >★</button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={formText}
                      onChange={e => setFormText(e.target.value)}
                      rows={4}
                      placeholder="Ihre Erfahrung…"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Abbrechen</button>
                      <button disabled={formBusy} onClick={submitReview} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-100 hover:bg-neutral-800 disabled:opacity-60">Absenden</button>
                    </div>
                    {formOk && <div className="text-[13px] text-[#4ECBD9]">{formOk}</div>}
                    {formError && <div className="text-[13px] text-[#F471B5]">{formError}</div>}
                  </div>
                )}

                {/* Liste */}
                {(reviews.length > 0 || commentsApproved.length > 0) && (
                  <div className="space-y-3">
                    {(reviews.length > 0 ? sortedReviews : commentsApproved).map((r: any) => (
                      <div key={r.id} className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
                        <div className="flex items-center justify-between">
                          <div className="text-neutral-100 text-sm font-medium">{r.author || 'Anonym'}</div>
                          <div className="text-neutral-400 text-xs">{formatRelative(r.created_at)}</div>
                        </div>
                        {typeof r.rating === 'number' && (
                          <div className="text-[13px] text-white mt-0.5">{'★'.repeat(Math.max(1, Math.min(5, Math.round(r.rating))))}</div>
                        )}
                        <div className="text-neutral-300 text-sm whitespace-pre-line mt-1">{r.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Karte (ganz unten, full-bleed) */}
            {mapSrc && (
              <div className="relative left-1/2 w-screen -translate-x-1/2 sm:static sm:w-auto sm:translate-x-0">
                <div className="relative overflow-hidden">
                  <iframe
                    title="Karte"
                    src={mapSrc}
                    className="w-screen sm:w-full h-72 md:h-96"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    style={{ filter: 'grayscale(100%) brightness(0.6) contrast(1.05)' }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/20" />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Ticket Buchung Modal (2 Schritte) */}
      {ticketOpen && ticketSel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTicketOpen(false)} />
          <div className="relative w-full max-w-xl rounded-xl bg-neutral-900 border-[0.5px] border-neutral-700/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-100 text-lg font-semibold">Service buchen</h3>
              <button onClick={() => setTicketOpen(false)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">✕</button>
            </div>

            {/* Stepper */}
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
                  <img
                    src={ticketSel.image || 'https://via.placeholder.com/100'}
                    alt={ticketSel.title}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                  />
                  <div className="text-neutral-100 font-medium">{ticketSel.title}</div>
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
                  <input
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="Dein Name"
                    className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                  />
                  <input
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                    placeholder="Deine E-Mail"
                    type="email"
                    className="px-3 py-2 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/40 text-neutral-100 placeholder-[#909296] focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button onClick={() => setTicketStep(1)} className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Zurück</button>
                  <button
                    onClick={goCheckout}
                    disabled={!ticketDate || !buyerName.trim() || !/^\S+@\S+\.\S+$/.test(buyerEmail.trim())}
                    className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-900 bg-neutral-200 hover:bg-white disabled:opacity-50"
                  >{paymentChoice==='online' ? 'Weiter zu Kontaktdaten' : 'Buchung bestätigen'}</button>
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
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${lastOrder.ticket_code || ''}|${lastOrder.qr_token || ''}`)}`}
                          alt="Ticket QR"
                          className="w-28 h-28 object-contain"
                        />
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
                  {/* existing confirmation content could follow here */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (lastOrder) {
                          const msg = `Buchung erfasst: "${lastOrder.title}" am ${lastOrder.date}. ${paymentChoice==='onsite' ? 'Bitte vor Ort bezahlen.' : ''}`;
                          setOrderOk(msg.trim());
                        } else {
                          setOrderOk('Buchung erfasst.');
                        }
                        setTicketSel(null);
                        setTicketOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-900 bg-neutral-200 hover:bg-white"
                    >Zur Startseite</button>
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
