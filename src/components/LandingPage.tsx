import React from 'react';
import { contentGet, type SiteContent } from '../lib/api';

const LandingPage: React.FC<{ previewContent?: SiteContent }> = ({ previewContent }) => {
  const [content, setContent] = React.useState<SiteContent>(previewContent || {});
  const [lang, setLang] = React.useState<'de' | 'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return (v === 'en' ? 'en' : 'de'); } catch { return 'de'; }
  });

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
        <div className="relative overflow-hidden w-full bg-neutral-900" style={{ height: `${heroHeight}px` }}>
          <img
            src={heroUrl}
            alt="Hero"
            className="w-full h-full object-contain sm:object-cover"
            style={{
              objectPosition: `${content.heroFocusX ?? 50}% ${content.heroFocusY ?? 50}%`,
              transform: `scale(${(content.heroZoom ?? 100) / 100})`,
              transformOrigin: 'center',
            }}
          />
        </div>
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
    </div>
  );
};

export default LandingPage;
