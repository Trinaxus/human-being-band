import React, { useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { contentGet, newsletterSubscribe, type SiteContent } from '../lib/api';

const LandingPage: React.FC<{ previewContent?: SiteContent }> = ({ previewContent }) => {
  const [content, setContent] = React.useState<SiteContent>(previewContent || {});
  const [lang, setLang] = React.useState<'de' | 'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return (v === 'en' ? 'en' : 'de'); } catch { return 'de'; }
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLang, setNewsletterLang] = useState<'de'|'en'>(lang);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  React.useEffect(() => {
    if (previewContent) {
      setContent(previewContent);
      return;
    }
    const load = async () => {
      try {
        const res = await contentGet();
        if (res?.content) setContent(res.content);
      } catch {}
    };
    load();
    const onLang = () => {
      try { const v = window.localStorage.getItem('lang'); setLang(v === 'en' ? 'en' : 'de'); } catch {}
    };
    window.addEventListener('langchange', onLang);
    window.addEventListener('storage', onLang);
    return () => {
      window.removeEventListener('langchange', onLang);
      window.removeEventListener('storage', onLang);
    };
  }, [previewContent]);

  const lp = content.landingPage || {};
  const heroUrl = lp.heroUrl || content.heroUrl || '';
  const heroHeight = content.heroHeight ?? 400;

  const t = (val: string | { de?: string; en?: string } | undefined) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return lang === 'en' ? (val.en || val.de || '') : (val.de || val.en || '');
  };

  const ytId = (() => {
    const url = lp.youtubeUrl || '';
    if (!url) return null;
    try {
      const u = new URL(url, window.location.origin);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || '';
    } catch {}
    return null;
  })();

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* Hero */}
      {heroUrl && (
        <>
          {/* Mobile: natürliche Größe, keine fixe Höhe → kein leerer Bereich hinter transparentem PNG */}
          <div className="relative overflow-hidden w-full sm:hidden">
            <img
              src={heroUrl}
              alt="Hero"
              className="w-full h-auto"
              style={{
                objectPosition: `${content.heroFocusX ?? 50}% ${content.heroFocusY ?? 50}%`,
                transform: `scale(${(content.heroZoom ?? 100) / 100})`,
                transformOrigin: 'center',
              }}
            />
          </div>
          {/* Desktop: fixe Höhe mit object-cover wie gehabt */}
          <div className="relative overflow-hidden w-full hidden sm:block" style={{ height: `${heroHeight}px` }}>
            {content.fullscreenEnabled && (
              <button
                onClick={() => {
                  if (isFullscreen) {
                    document.exitFullscreen?.().catch(() => {});
                  } else {
                    document.documentElement.requestFullscreen?.().catch(() => {});
                  }
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            )}
            <img
              src={heroUrl}
              alt="Hero"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${content.heroFocusX ?? 50}% ${content.heroFocusY ?? 50}%`,
                transform: `scale(${(content.heroZoom ?? 100) / 100})`,
                transformOrigin: 'center',
              }}
            />
          </div>
        </>
      )}

      {/* Welcome */}
      {lp.welcomeText && (
        <section className="px-4 sm:px-6 py-12 text-center">
          <h2 className="font-display uppercase text-neutral-100 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wider mb-4">
            {lang === 'de' ? 'Willkommen' : 'Welcome'}
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base max-w-2xl mx-auto whitespace-pre-line">
            {t(lp.welcomeText)}
          </p>
        </section>
      )}

      {/* YouTube */}
      {ytId && (
        <section className="px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden border border-neutral-700/40 shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title="YouTube"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* About Us */}
      {(lp.aboutTitle || lp.aboutText) && (
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            {lp.aboutTitle && (
              <h2 className="font-display uppercase text-neutral-100 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wider mb-4">
                {t(lp.aboutTitle)}
              </h2>
            )}
            {lp.aboutText && (
              <p className="text-neutral-300 text-sm sm:text-base whitespace-pre-line">
                {t(lp.aboutText)}
              </p>
            )}
          </div>
        </section>
      )}

      {/* CTA Button */}
      {lp.ctaButton?.visible && lp.ctaButton?.url && (
        <section className="px-4 sm:px-6 py-12 text-center">
          <a
            href={lp.ctaButton.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-[#8C1423] text-white font-display uppercase tracking-wider text-sm hover:bg-[#a0182a] transition-colors"
          >
            {t(lp.ctaButton.label) || (lang === 'de' ? 'Mehr erfahren' : 'Learn more')}
          </a>
        </section>
      )}

      {/* Newsletter */}
      {lp.newsletterVisible && (
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-xl mx-auto">
            <h2 className="font-display uppercase text-neutral-100 text-2xl sm:text-3xl font-extrabold tracking-wider text-center mb-2">
              {lang === 'de' ? 'Newsletter' : 'Newsletter'}
            </h2>
            <p className="text-neutral-300 text-sm text-center mb-6">
              {lang === 'de' ? 'Bleib auf dem Laufenden – abonniere unseren Newsletter.' : 'Stay up to date – subscribe to our newsletter.'}
            </p>
            {newsletterMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${newsletterMsg.includes('fehl') || newsletterMsg.includes('error') ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                {newsletterMsg}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newsletterEmail.trim()) return;
                setNewsletterBusy(true);
                setNewsletterMsg(null);
                try {
                  const res = await newsletterSubscribe(newsletterEmail.trim(), newsletterLang);
                  setNewsletterMsg(res?.message || (lang === 'de' ? 'Vielen Dank fürs Abonnieren!' : 'Thank you for subscribing!'));
                  setNewsletterEmail('');
                } catch (e) {
                  setNewsletterMsg(e instanceof Error ? e.message : (lang === 'de' ? 'Fehler beim Abonnieren.' : 'Subscription failed.'));
                } finally {
                  setNewsletterBusy(false);
                }
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={lang === 'de' ? 'Deine E-Mail-Adresse' : 'Your email address'}
                required
                disabled={newsletterBusy}
                className="flex-1 px-4 py-2.5 bg-neutral-800/60 border border-neutral-700/40 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#8C1423]/40 focus:border-[#8C1423]/60 transition-colors"
              />
              <select
                value={newsletterLang}
                onChange={(e) => setNewsletterLang(e.target.value as 'de' | 'en')}
                disabled={newsletterBusy}
                className="px-3 py-2.5 bg-neutral-800/60 border border-neutral-700/40 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C1423]/40"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
              <button
                type="submit"
                disabled={newsletterBusy}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#8C1423] hover:bg-[#a0182a] transition-colors disabled:opacity-50"
              >
                {newsletterBusy ? '…' : (lang === 'de' ? 'Abonnieren' : 'Subscribe')}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPage;
