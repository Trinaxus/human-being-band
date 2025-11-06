import React from 'react';

const LegalImpressum: React.FC = () => {
  const [theme, setTheme] = React.useState<'dark'|'light'>(() => {
    try { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  React.useEffect(() => {
    const obs = new MutationObserver(() => setTheme(document.documentElement.getAttribute('data-theme')==='light'?'light':'dark'));
    try { obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch {}
    return () => { try { obs.disconnect(); } catch {} };
  }, []);
  const cardBase = 'rounded-xl border';
  const cardTone = theme === 'light' ? 'bg-white/85 border-neutral-200' : 'bg-neutral-900/70 border-neutral-700/20';
  const textHeading = theme === 'light' ? 'text-neutral-900' : 'text-neutral-100';
  const textBody = theme === 'light' ? 'text-neutral-800' : 'text-neutral-300';

  return (
    <div className="w-full max-w-[1100px] mx-auto px-3 sm:px-4">
      <div className={`${cardBase} ${cardTone} p-4 sm:p-6`}>
        <h1 className={`font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wider mb-3 ${textHeading}`}>Impressum</h1>
        <div className={`space-y-3 ${textBody} text-sm`}>
          <p>Angaben gemäß § 5 TMG. Platzhalterinhalte – werden später verfeinert.</p>
          <div>
            <div className="font-semibold">Verantwortlich</div>
            <div>Human Being Band<br/>Musterstraße 1<br/>12345 Musterstadt</div>
          </div>
          <div>
            <div className="font-semibold">Kontakt</div>
            <div>E‑Mail: info@human-being-band.de</div>
          </div>
          <div>
            <div className="font-semibold">Haftung für Inhalte</div>
            <div>Inhalte dienen als Platzhalter.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalImpressum;
