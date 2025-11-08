import React from 'react';
import { Github, Heart } from 'lucide-react';
import { contentGet, type SiteContent } from '../lib/api';

const Footer: React.FC = () => {
  const [theme, setTheme] = React.useState<'dark'|'light'>(() => {
    try {
      const htmlTheme = document.documentElement.getAttribute('data-theme');
      if (htmlTheme === 'light') return 'light';
      const t = window.localStorage.getItem('theme');
      return t === 'light' ? 'light' : 'dark';
    } catch { return 'dark'; }
  });
  const [lang, setLang] = React.useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return v === 'en' ? 'en' : 'de'; } catch { return 'de'; }
  });
  const [content, setContent] = React.useState<SiteContent>({});
  React.useEffect(() => {
    // React to html[data-theme] changes (same-tab immediate updates)
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      setTheme(isLight ? 'light' : 'dark');
    });
    try { observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch {}
    // Fallback: storage event (cross-tab)
    const onStorage = (e: StorageEvent) => { if (e.key === 'theme') setTheme(e.newValue === 'light' ? 'light' : 'dark'); };
    window.addEventListener('storage', onStorage);
    const onLang = (e: StorageEvent) => { if (e.key === 'lang') setLang(e.newValue === 'en' ? 'en' : 'de'); };
    window.addEventListener('storage', onLang);
    return () => { try { observer.disconnect(); } catch {}; window.removeEventListener('storage', onStorage); window.removeEventListener('storage', onLang); };
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await contentGet();
        setContent(res.content || {});
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    const reload = async () => {
      try { const res = await contentGet(); setContent(res.content || {}); } catch {}
    };
    window.addEventListener('content:updated', reload as any);
    return () => window.removeEventListener('content:updated', reload as any);
  }, []);

  const L = React.useCallback((v: any): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (lang === 'en' ? (v?.en || v?.de || '') : (v?.de || v?.en || '')) as string;
  }, [lang]);

  const wrapCls = theme==='light'
    ? 'relative bg-white/85 backdrop-blur-sm py-6 border-t border-neutral-200'
    : 'relative bg-neutral-900/85 backdrop-blur-sm py-6 border-t-[0.5px] border-neutral-800';
  const textMuted = theme==='light' ? 'text-neutral-600' : 'text-neutral-400';
  const textMutedHover = theme==='light' ? 'hover:text-neutral-800' : 'hover:text-neutral-200';

  return (
    <footer className={wrapCls}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className={`${textMuted} text-sm flex items-center`}>
            <span>Made with</span>
            <Heart size={16} className={`mx-1 ${textMuted}`} />
            <span>for Human Being Band by trinax</span>
          </div>
          <div className="flex items-center gap-4">
            {content.impressum && (
              <a
                href="/?view=impressum"
                className={`${textMuted} ${textMutedHover} text-sm transition-colors`}
                title={lang==='en'?'Imprint':'Impressum'}
              >{lang==='en'?'Imprint':'Impressum'}</a>
            )}
            {content.privacy && (
              <a
                href="/?view=datenschutz"
                className={`${textMuted} ${textMutedHover} text-sm transition-colors`}
                title={lang==='en'?'Privacy':'Datenschutz'}
              >{lang==='en'?'Privacy':'Datenschutz'}</a>
            )}
            <a 
              href="https://human-being-band.de" 
              className={`${textMuted} ${textMutedHover} transition-colors`}
              target="_blank"
              rel="noopener noreferrer"
              title="human-being-band.de"
            >
              <Github size={20} />
            </a>
            <span className={`${textMuted} text-sm`}>2025</span>
          </div>
        </div>
      </div>
      {/* Gradient hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.5px] bg-gradient-to-r from-[#77111c33] via-[#77111c] to-[#77111c33] opacity-60" />
      {/* no modal; dedicated pages via App routing */}
    </footer>
  );
};

export default Footer;