import React from 'react';
import { contentGet, type SiteContent } from '../lib/api';

const LegalImpressum: React.FC = () => {
  const [theme, setTheme] = React.useState<'dark'|'light'>(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  React.useEffect(() => {
    const obs = new MutationObserver(() => setTheme(document.documentElement.getAttribute('data-theme')==='light'?'light':'dark'));
    try { obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch {}
    return () => { try { obs.disconnect(); } catch {} };
  }, []);
  const [lang, setLang] = React.useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return v === 'en' ? 'en' : 'de'; } catch { return 'de'; }
  });
  const [content, setContent] = React.useState<SiteContent>({});
  React.useEffect(() => {
    (async () => { try { const res = await contentGet(); setContent(res.content || {}); } catch {} })();
  }, []);
  const L = React.useCallback((v: any): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (lang === 'en' ? (v?.en || v?.de || '') : (v?.de || v?.en || '')) as string;
  }, [lang]);

  const cardBase = 'rounded-xl border';
  const cardTone = theme === 'light' ? 'bg-white/85 border-neutral-200' : 'bg-neutral-900/70 border-neutral-700/20';
  const textHeading = theme === 'light' ? 'text-neutral-900' : 'text-neutral-100';
  const textBody = theme === 'light' ? 'text-neutral-800' : 'text-neutral-300';

  return (
    <div className="w-full max-w-[1100px] mx-auto px-3 sm:px-4">
      <div className={`${cardBase} ${cardTone} p-4 sm:p-6`}>
        <h1 className={`font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wider mb-3 ${textHeading}`}>Impressum</h1>
        <div className={`space-y-3 ${textBody} text-sm`}>
          <div className="prose max-w-none">
            <div className={theme==='light' ? 'prose-neutral' : 'prose-invert'} dangerouslySetInnerHTML={{ __html: L((content as any).impressum) }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalImpressum;
