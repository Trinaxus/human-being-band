import React from 'react';
import { Menu, X, LogIn, LogOut, Settings, Sun, Moon, Shield } from 'lucide-react';

type HeaderProps = {
  authRole?: 'unauthenticated' | 'user' | 'admin';
  onHomeClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onAdminClick?: () => void;
  onOverviewClick?: () => void;
  landingMode?: boolean; // true = centered logo, no nav links
};

const navLinks = [
  { id: 'news', label: 'News' },
  { id: 'about', label: 'About' },
  { id: 'music', label: 'Music', href: 'https://youtube.com' },
  { id: 'media', label: 'Media' },
  { id: 'booking', label: 'Booking' },
];

const Header: React.FC<HeaderProps> = ({ authRole = 'unauthenticated', onHomeClick, onLoginClick, onLogoutClick, onAdminClick, landingMode }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [lang, setLangState] = React.useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return (v === 'en' ? 'en' : 'de'); } catch { return 'de'; }
  });
  const setLang = (code: 'de'|'en') => {
    setLangState(code);
    try { window.localStorage.setItem('lang', code); } catch {}
    try { window.dispatchEvent(new Event('langchange')); } catch {}
  };
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    try {
      const t = window.localStorage.getItem('theme');
      return (t === 'light' || t === 'dark') ? t : 'dark';
    } catch { return 'dark'; }
  });
  const [fontSize, setFontSize] = React.useState<'normal' | 'lg' | 'xl' | 'xxl'>(() => {
    try {
      const f = window.localStorage.getItem('fontSize');
      // Default to 'lg' (Large) if no preference saved
      return (f === 'lg' || f === 'xl' || f === 'xxl') ? f : (f === 'normal' ? 'normal' : 'lg');
    } catch {
      return 'lg';
    }
  });
  const [headerLogo, setHeaderLogo] = React.useState<{
    dark?: string; light?: string;
    height?: number; mobileHeight?: number;
    headerDesktopPadding?: number; headerMobilePadding?: number;
    hoverScale?: number; hoverBrightness?: number; hoverOpacity?: number;
  }>({});
  const [logoHover, setLogoHover] = React.useState(false);

  // Load custom header logo from server content
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
        const res = await fetch(`${base}/content.php`, { credentials: 'include' });
        const data = await res.json();
        if (!cancelled && data?.ok && data.content?.headerLogo) {
          setHeaderLogo(data.content.headerLogo);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist language
  React.useEffect(() => {
    try { window.localStorage.setItem('lang', lang); } catch {}
    try { window.dispatchEvent(new CustomEvent('lang:changed', { detail: lang })); } catch {}
  }, [lang]);

  // Apply theme to <html>
  React.useEffect(() => {
    try {
      const el = document.documentElement;
      if (theme === 'light') {
        el.setAttribute('data-theme', 'light');
      } else {
        el.removeAttribute('data-theme');
      }
      window.localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  // Apply font size to <html>
  React.useEffect(() => {
    try {
      const el = document.documentElement;
      if (fontSize === 'normal') {
        el.removeAttribute('data-font-size');
      } else {
        el.setAttribute('data-font-size', fontSize);
      }
      window.localStorage.setItem('fontSize', fontSize);
    } catch {}
  }, [fontSize]);

  // Close settings on outside click
  React.useEffect(() => {
    if (!settingsOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.('#header-settings')) setSettingsOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [settingsOpen]);

  // Clean up URL from cache-busting param after reloads
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('logged_out')) {
        url.searchParams.delete('logged_out');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  // No authentication or host/remote state in the minimal skeleton.

  // Default button behaviors if no handlers are provided
  const isLight = theme === 'light';
  const handleHome = () => {
    try { onHomeClick?.(); } catch {}
    try { setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };
  const handleLogin = () => {
    if (onLoginClick) return onLoginClick();
    try { document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
  };
  const handleLogout = () => {
    if (onLogoutClick) return onLogoutClick();
    try { window.localStorage?.clear?.(); window.sessionStorage?.clear?.(); } catch {}
    try { window.location.replace('/'); } catch {}
  };

  const linkClass = (active = false) =>
    `px-3 py-1.5 text-base md:text-lg rounded-md uppercase font-display tracking-wider transition-colors ${
      isLight
        ? active ? 'text-neutral-900 bg-neutral-200/60' : 'text-neutral-900 hover:bg-neutral-200/60'
        : active ? 'text-white bg-neutral-700/40' : 'text-white hover:bg-neutral-700/40'
    }`;

  const logoSrc = isLight
    ? (headerLogo.light || headerLogo.dark || '')
    : (headerLogo.dark || headerLogo.light || '');

  return (
    <>
      <header className="hb-no-scale fixed inset-x-0 top-0 z-40 bg-neutral-900/85 border-b-[0.5px] border-neutral-800 backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between sm:hidden" style={{ paddingTop: `${headerLogo.headerMobilePadding ?? 6}px`, paddingBottom: `${headerLogo.headerMobilePadding ?? 6}px` }}>
            <span className="w-9 h-9" />
            <button onClick={handleHome} className="inline-flex items-center" title="Home" onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)}>
              {logoSrc && <img
                src={logoSrc}
                alt="Human Being Band"
                className="w-auto block transition-all duration-300"
                style={{
                  height: headerLogo.mobileHeight ?? 36,
                  transform: logoHover ? `scale(${headerLogo.hoverScale ?? 1})` : 'scale(1)',
                  filter: logoHover ? `brightness(${headerLogo.hoverBrightness ?? 100}%)` : 'brightness(100%)',
                  opacity: logoHover ? (headerLogo.hoverOpacity ?? 1) : 1,
                }}
              />}
              <span className="sr-only">HUMAN BEING BAND</span>
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={lang==='de'?'Menü öffnen':'Open menu'}
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-neutral-700/60 text-neutral-300 hover:bg-neutral-800/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop header */}
          <div className={`hidden sm:flex items-center justify-between relative`} style={{ paddingTop: `${headerLogo.headerDesktopPadding ?? 10}px`, paddingBottom: `${headerLogo.headerDesktopPadding ?? 10}px` }}>
            {!landingMode ? (
              <button onClick={handleHome} className="inline-flex items-center" title="Home" onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)}>
                {logoSrc && <img
                  src={logoSrc}
                  alt="Human Being Band"
                  className="w-auto block transition-all duration-300"
                  style={{
                    height: headerLogo.height ?? 48,
                    transform: logoHover ? `scale(${headerLogo.hoverScale ?? 1})` : 'scale(1)',
                    filter: logoHover ? `brightness(${headerLogo.hoverBrightness ?? 100}%)` : 'brightness(100%)',
                    opacity: logoHover ? (headerLogo.hoverOpacity ?? 1) : 1,
                  }}
                />}
                <span className="sr-only">HUMAN BEING BAND</span>
              </button>
            ) : (
              <div className="w-9" />
            )}

            {/* Centered logo in landingMode */}
            {landingMode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button onClick={handleHome} className="inline-flex items-center pointer-events-auto" title="Home" onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)}>
                  {logoSrc && <img
                    src={logoSrc}
                    alt="Human Being Band"
                    className="w-auto block transition-all duration-300"
                    style={{
                      height: headerLogo.height ?? 48,
                      transform: logoHover ? `scale(${headerLogo.hoverScale ?? 1})` : 'scale(1)',
                      filter: logoHover ? `brightness(${headerLogo.hoverBrightness ?? 100}%)` : 'brightness(100%)',
                      opacity: logoHover ? (headerLogo.hoverOpacity ?? 1) : 1,
                    }}
                  />}
                  <span className="sr-only">HUMAN BEING BAND</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {!landingMode && (
                <nav className="flex items-center gap-1">
                {navLinks.map(link =>
                  link.href ? (
                    <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className={linkClass()}>
                      {link.label}
                    </a>
                  ) : (
                    <button key={link.id} onClick={() => { try { document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {} }} className={linkClass()}>
                      {link.label}
                    </button>
                  )
                )}
              </nav>
              )}

              {/* Settings dropdown */}
              <div id="header-settings" className="relative ml-2">
                <button
                  onClick={() => setSettingsOpen(v => !v)}
                  className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border-[0.5px] transition-all ${
                    isLight
                      ? 'border-neutral-300 bg-white/80 text-neutral-700 hover:bg-neutral-100'
                      : 'border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60'
                  } ${settingsOpen ? (isLight ? 'bg-neutral-100 ring-2 ring-neutral-300' : 'bg-neutral-700/60 ring-2 ring-neutral-600') : ''}`}
                  title={lang==='de'?'Einstellungen':'Settings'}
                  aria-haspopup
                >
                  <Settings className="w-[18px] h-[18px]" />
                </button>

                {settingsOpen && (
                  <div className={`absolute right-0 mt-3 w-64 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-md ${
                    isLight
                      ? 'border-neutral-200/80 bg-white/95'
                      : 'border-neutral-700/80 bg-neutral-800/95'
                  }`}>
                    {/* Appearance section */}
                    <div className="px-2 pt-1 pb-2">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2 px-1">{lang==='de'?'Erscheinungsbild':'Appearance'}</div>
                      <button
                        onClick={() => setTheme(isLight ? 'dark' : 'light')}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'
                        }`}
                      >
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-700/50 text-amber-400'}`}>
                          {isLight ? <Moon className="w-[18px] h-[18px]"/> : <Sun className="w-[18px] h-[18px]"/>}
                        </span>
                        <span className="flex-1 text-left">{isLight ? (lang==='de'?'Dunkelmodus':'Dark mode') : (lang==='de'?'Hellmodus':'Light mode')}</span>
                      </button>
                    </div>

                    {!landingMode && (
                    <>
                    <div className={`mx-2 h-px ${isLight ? 'bg-neutral-200' : 'bg-neutral-700/60'}`} />

                    {/* Font size section */}
                    <div className="px-2 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2 px-1">{lang==='de'?'Schriftgröße':'Font size'}</div>
                      <div className="flex gap-1.5">
                        {(['normal','lg','xl','xxl'] as const).map((s, i) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFontSize(s)}
                            className={`flex flex-1 flex-col items-center justify-center rounded-xl py-2 transition-all ${
                              fontSize === s
                                ? (isLight ? 'bg-neutral-100 text-neutral-900 border border-neutral-400 shadow-md' : 'bg-white text-neutral-900 shadow-md')
                                : (isLight ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700')
                            }`}
                            title={s === 'normal' ? (lang==='de'?'Standard':'Normal') : s === 'lg' ? (lang==='de'?'Groß':'Large') : s === 'xl' ? (lang==='de'?'Sehr groß':'Extra large') : (lang==='de'?'Maximal':'Maximum')}
                          >
                            <span className={s==='normal'?'text-xs':s==='lg'?'text-sm':s==='xl'?'text-base':'text-lg font-medium'}>A</span>
                            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide opacity-60">{['S','M','L','XL'][i]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    </>
                    )}

                    <div className={`mx-2 h-px ${isLight ? 'bg-neutral-200' : 'bg-neutral-700/60'}`} />

                    {/* Language */}
                    <div className="px-2 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2 px-1">{lang==='de'?'Sprache':'Language'}</div>
                      <div className="flex gap-1.5">
                        {(['de','en'] as const).map((code) => (
                          <button
                            key={code}
                            onClick={() => setLang(code)}
                            className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                              lang === code
                                ? (isLight ? 'bg-white text-neutral-900 border border-neutral-400 shadow-sm' : 'bg-white text-neutral-900 shadow-sm')
                                : (isLight ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700')
                            }`}
                          >
                            {code === 'de' ? 'Deutsch' : 'English'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!landingMode && (
                    <>
                    <div className={`mx-2 h-px ${isLight ? 'bg-neutral-200' : 'bg-neutral-700/60'}`} />

                    {/* Auth */}
                    <div className="px-2 pt-2 pb-1">
                      {authRole === 'admin' ? (
                        <div className="grid gap-1">
                          <button onClick={() => { onAdminClick?.(); setSettingsOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-emerald-600' : 'bg-neutral-700/50 text-emerald-400'}`}><Shield className="w-[18px] h-[18px]"/></span>
                            <span className="flex-1 text-left">Admin</span>
                          </button>
                          <button onClick={() => { handleLogout(); setSettingsOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-rose-500' : 'bg-neutral-700/50 text-rose-400'}`}><LogOut className="w-[18px] h-[18px]"/></span>
                            <span className="flex-1 text-left">{lang==='de'?'Abmelden':'Log out'}</span>
                          </button>
                        </div>
                      ) : authRole === 'unauthenticated' ? (
                        <button onClick={() => { handleLogin(); setSettingsOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-sky-500' : 'bg-neutral-700/50 text-sky-400'}`}><LogIn className="w-[18px] h-[18px]"/></span>
                          <span className="flex-1 text-left">{lang==='de'?'Anmelden':'Log in'}</span>
                        </button>
                      ) : (
                        <button onClick={() => { handleLogout(); setSettingsOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-rose-500' : 'bg-neutral-700/50 text-rose-400'}`}><LogOut className="w-[18px] h-[18px]"/></span>
                          <span className="flex-1 text-left">{lang==='de'?'Abmelden':'Log out'}</span>
                        </button>
                      )}
                    </div>
                    </>
                    )}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className={`absolute top-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-b-3xl p-5 pt-4 shadow-2xl border-b ${
              isLight ? 'bg-white/95 border-neutral-200' : 'bg-neutral-900/95 border-neutral-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-sm font-semibold uppercase tracking-widest ${isLight ? 'text-neutral-500' : 'text-neutral-500'}`}>{landingMode ? (lang==='de'?'Einstellungen':'Settings') : (lang==='de'?'Menü':'Menu')}</h2>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label={lang==='de'?'Schließen':'Close'}
                className={`w-9 h-9 inline-flex items-center justify-center rounded-xl transition-colors ${
                  isLight ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            {!landingMode && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {navLinks.map(link =>
                link.href ? (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-xl text-left uppercase font-display tracking-wider text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                        : 'bg-neutral-800/60 text-white border border-neutral-700/50'
                    }`}
                  >{link.label}</a>
                ) : (
                  <button
                    key={link.id}
                    onClick={() => { try { document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {} setMobileOpen(false); }}
                    className={`px-4 py-3 rounded-xl text-left uppercase font-display tracking-wider text-sm font-medium transition-colors ${
                      isLight
                        ? 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                        : 'bg-neutral-800/60 text-white border border-neutral-700/50'
                    }`}
                  >{link.label}</button>
                )
              )}
            </div>
            )}

            {/* Settings sections */}
            <div className={`rounded-2xl border p-3 space-y-4 ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-800/40 border-neutral-700/50'}`}>
              {/* Theme */}
              <button
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'
                }`}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-700/60 text-amber-400'}`}>
                  {isLight ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
                </span>
                <span className="flex-1 text-left">{isLight ? (lang==='de'?'Dunkelmodus':'Dark mode') : (lang==='de'?'Hellmodus':'Light mode')}</span>
              </button>

              {!landingMode && (
              <>
              <div className={`mx-3 h-px ${isLight ? 'bg-neutral-200' : 'bg-neutral-700/60'}`} />

              {/* Font size */}
              <div className="px-1">
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 px-1 ${isLight ? 'text-neutral-500' : 'text-neutral-500'}`}>{lang==='de'?'Schriftgröße':'Font size'}</div>
                <div className="flex gap-2">
                  {(['normal','lg','xl','xxl'] as const).map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFontSize(s)}
                      className={`flex flex-1 flex-col items-center justify-center rounded-xl py-3 transition-all ${
                        fontSize === s
                          ? (isLight ? 'bg-neutral-100 text-neutral-900 border border-neutral-400 shadow-md' : 'bg-white text-neutral-900 shadow-md')
                          : (isLight ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-800 text-neutral-400')
                      }`}
                    >
                      <span className={s==='normal'?'text-sm':s==='lg'?'text-base':s==='xl'?'text-lg':'text-xl font-medium'}>A</span>
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-60">{['S','M','L','XL'][i]}</span>
                    </button>
                  ))}
                </div>
              </div>
              </>
              )}

              <div className={`mx-3 h-px ${isLight ? 'bg-neutral-200' : 'bg-neutral-700/60'}`} />

              {/* Language */}
              <div className="px-1">
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 px-1 ${isLight ? 'text-neutral-500' : 'text-neutral-500'}`}>{lang==='de'?'Sprache':'Language'}</div>
                <div className="flex gap-2">
                  {(['de','en'] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        lang === code
                          ? (isLight ? 'bg-white text-neutral-900 border border-neutral-400' : 'bg-white text-neutral-900')
                          : (isLight ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-800 text-neutral-400')
                      }`}
                    >
                      {code === 'de' ? 'Deutsch' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              {!landingMode && (
              <>
              <div className={`mx-3 h-px ${isLight ? 'bg-neutral-200' : 'bg-neutral-700/60'}`} />

              {/* Auth */}
              <div className="px-1 pb-1">
                {authRole === 'admin' ? (
                  <div className="grid gap-2">
                    <button onClick={() => { onAdminClick?.(); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-200 text-emerald-600' : 'bg-neutral-700/60 text-emerald-400'}`}><Shield className="w-5 h-5"/></span>
                      <span className="flex-1 text-left">Admin</span>
                    </button>
                    <button onClick={() => { handleLogout(); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-200 text-rose-500' : 'bg-neutral-700/60 text-rose-400'}`}><LogOut className="w-5 h-5"/></span>
                      <span className="flex-1 text-left">{lang==='de'?'Abmelden':'Log out'}</span>
                    </button>
                  </div>
                ) : authRole === 'unauthenticated' ? (
                  <button onClick={() => { handleLogin(); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-200 text-sky-500' : 'bg-neutral-700/60 text-sky-400'}`}><LogIn className="w-5 h-5"/></span>
                    <span className="flex-1 text-left">{lang==='de'?'Anmelden':'Log in'}</span>
                  </button>
                ) : (
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isLight ? 'text-neutral-800 hover:bg-neutral-100' : 'text-neutral-200 hover:bg-neutral-700/40'}`}>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-200 text-rose-500' : 'bg-neutral-700/60 text-rose-400'}`}><LogOut className="w-5 h-5"/></span>
                    <span className="flex-1 text-left">{lang==='de'?'Abmelden':'Log out'}</span>
                  </button>
                )}
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Gradient hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.5px] bg-gradient-to-r from-[#77111c33] via-[#77111c] to-[#77111c33] opacity-60" />
    </header>
    {/* Spacer to offset fixed header height */}
    <div aria-hidden className="h-[68px] sm:h-[96px]" />
    </>
  );
};

export default Header;