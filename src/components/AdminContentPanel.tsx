import React, { useEffect, useMemo, useState } from 'react';
import { contentGet, contentSave, commentsList, commentsApprove, commentsDelete, type SiteContent, type CommentItem } from '../lib/api';
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

  const [commentsPending, setCommentsPending] = useState<CommentItem[]>([]);
  const [commentsApproved, setCommentsApproved] = useState<CommentItem[]>([]);
  const [busyComment, setBusyComment] = useState<string | null>(null);

  const gallery = useMemo(() => content.gallery || [], [content.gallery]);

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


  const loadComments = async () => {
    try {
      const res = await commentsList();
      setCommentsPending(res.pending || []);
      setCommentsApproved(res.approved || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    load();
    loadComments();
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

  const approveComment = async (id: string) => {
    setBusyComment(id);
    try {
      await commentsApprove(id);
      await loadComments();
    } catch {}
    setBusyComment(null);
  };
  const deleteComment = async (id: string) => {
    setBusyComment(id);
    try {
      await commentsDelete(id);
      await loadComments();
    } catch {}
    setBusyComment(null);
  };

  const [open, setOpen] = useState({
    hero: false,
    contact: false,
    gallery: false,
    map: false,
    comments: false,
    about: false,
    socials: false,
  });

  // Refresh comments when the section is opened
  useEffect(() => {
    if (open.comments) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.comments]);

  if (loading) return <div className="text-neutral-400">Lade Inhalte…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>}
      {ok && <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-neutral-200 text-sm">{ok}</div>}

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

      {/* Hintergrund Orb */}
      <section>
        <ToggleButton label="Hintergrund Orb" open={(open as any).orb === true} onClick={() => setOpen(prev => ({ ...prev, orb: !(prev as any).orb }))} />
        {(open as any).orb && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
              <label className="block text-xs text-neutral-400 mb-1">Orb‑Bild‑URL</label>
              <Input placeholder="https://…/bild.png" value={content.orbUrl || ''} onChange={e => setContent({ ...content, orbUrl: e.target.value })} />
              <div className="mt-2 text-[12px] text-neutral-400">Dieses Bild rotiert langsam als Deko im Hintergrund. Transparentes PNG empfohlen.</div>
            </div>
            <div className="rounded-lg bg-neutral-900/60 border-[0.5px] border-neutral-700/30 p-3">
              <div className="text-neutral-300 text-sm mb-2">Vorschau</div>
              <div className="relative h-56 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700/50">
                <div
                  className="absolute inset-0 opacity-80"
                  style={{ backgroundImage: content.orbUrl ? `url('${content.orbUrl}')` : undefined, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
                />
                {!content.orbUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-[#909296] text-sm">Kein Bild</div>
                )}
              </div>
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

      {/* Galerie */}
      <section>
        <ToggleButton label="Galerie" open={open.gallery} onClick={() => setOpen(prev => ({ ...prev, gallery: !prev.gallery }))} />
        {open.gallery && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {gallery.map((url, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/60 border border-neutral-700">
                  <div className="w-16 h-12 rounded overflow-hidden bg-neutral-900 border border-neutral-700/50 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Bild ${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                  <Badge>Bild {idx+1}</Badge>
                  <span className="text-[13px] text-neutral-300 max-w-[260px] truncate">{url}</span>
                  <a href={url} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Öffnen</a>
                  <button onClick={() => removeGalleryUrl(idx)} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-700">Entfernen</button>
                </div>
              ))}
            </div>
            <div>
              <button onClick={addGalleryUrl} className="px-3 py-2 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Bild-URL hinzufügen</button>
            </div>
          </div>
        )}
      </section>

      {/* Bewertungen Moderation */}
      <section>
        <ToggleButton label="Bewertungen" open={open.comments} onClick={() => setOpen(prev => ({ ...prev, comments: !prev.comments }))} />
        {open.comments && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
            <h4 className="text-neutral-200 font-medium mb-2">Ausstehende Bewertungen</h4>
            <div className="flex justify-end mb-2">
              <button onClick={loadComments} className="px-2 py-1 rounded border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800 text-xs">Aktualisieren</button>
            </div>
            <div className="space-y-2">
              {commentsPending.length === 0 && <div className="text-[#909296] text-sm">Keine ausstehenden Kommentare.</div>}
              {commentsPending.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-neutral-100 text-sm">{c.author || 'Anonym'}</div>
                      {typeof c.rating === 'number' && (
                        <div className="text-[13px] text-[#FFD166]">{'★'.repeat(Math.max(1, Math.min(5, Math.round(c.rating))))}</div>
                      )}
                    </div>
                    <div className="text-neutral-300 text-sm whitespace-pre-line">{c.text}</div>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <button disabled={busyComment===c.id} onClick={() => approveComment(c.id)} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700">Freigeben</button>
                    <button disabled={busyComment===c.id} onClick={() => deleteComment(c.id)} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Löschen</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-800/60 border-[0.5px] border-neutral-700/30">
            <h4 className="text-neutral-200 font-medium mb-2">Freigegebene Bewertungen</h4>
            <div className="space-y-2">
              {commentsApproved.length === 0 && <div className="text-[#909296] text-sm">Keine freigegebenen Kommentare.</div>}
              {commentsApproved.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-neutral-100 text-sm">{c.author || 'Anonym'}</div>
                      {typeof c.rating === 'number' && (
                        <div className="text-[13px] text-[#FFD166]">{'★'.repeat(Math.max(1, Math.min(5, Math.round(c.rating))))}</div>
                      )}
                      <Badge>Freigegeben</Badge>
                    </div>
                    <div className="flex-shrink-0">
                      <button disabled={busyComment===c.id} onClick={() => deleteComment(c.id)} className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800">Löschen</button>
                    </div>
                  </div>
                  <div className="text-neutral-300 text-sm whitespace-pre-line mt-1">{c.text}</div>
                </div>
              ))}
            </div>
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
