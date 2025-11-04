import React from 'react';
import { Menu, X, Home as HomeIcon, LogIn, LogOut, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';

type HeaderProps = {
  authRole?: 'unauthenticated' | 'user' | 'admin';
  onHomeClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onAdminClick?: () => void;
  onOverviewClick?: () => void;
};

const Header: React.FC<HeaderProps> = ({ authRole = 'unauthenticated', onHomeClick, onLoginClick, onLogoutClick, onAdminClick, onOverviewClick }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [lang, setLang] = React.useState<'de'|'en'>(() => {
    try { const v = window.localStorage.getItem('lang'); return (v === 'en' ? 'en' : 'de'); } catch { return 'de'; }
  });
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    try {
      const t = window.localStorage.getItem('theme');
      return (t === 'light' || t === 'dark') ? t : 'dark';
    } catch { return 'dark'; }
  });

  // Persist language
  React.useEffect(() => {
    try { window.localStorage.setItem('lang', lang); } catch {}
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
  const handleHome = () => {
    if (onHomeClick) return onHomeClick();
    try { window.location.assign('/'); } catch {}
  };
  const handleLogin = () => {
    if (onLoginClick) return onLoginClick();
    try {
      const el = document.getElementById('login-form');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  };
  const handleLogout = () => {
    if (onLogoutClick) return onLogoutClick();
    try {
      window.localStorage?.clear?.();
      window.sessionStorage?.clear?.();
    } catch {}
    try { window.location.replace('/'); } catch {}
  };

  return (
    <header className="relative z-40 bg-neutral-900/85 border-b-[0.5px] border-neutral-800 backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile: compact top bar */}
        <div className="flex items-center justify-between sm:hidden">
          <span className="w-9 h-9" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#F97316] to-[#B45309] text-transparent bg-clip-text tracking-tight">
            <span className="inline-flex items-center gap-2">
              
              <span>HUMAN BEING BAND</span>
            </span>
          </h1>
          <button
            onClick={() => setMobileOpen(true)}
            onTouchStart={() => setMobileOpen(true)}
            aria-label="Menü öffnen"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-700/50"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: time bar removed */}

        {/* Desktop: full header */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Logo + label */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F97316] to-[#B45309] text-transparent bg-clip-text tracking-tight">
            <span className="inline-flex items-center gap-3">
             
              <span>HUMAN BEING BAND</span>
            </span>
          </h1>

          {/* Center nav */}
          <nav className="flex items-center gap-4">
            {[
              { id: 'news', label: 'News' },
              { id: 'booking', label: 'Booking' },
              { id: 'media', label: 'Media' },
              { id: 'about', label: 'About' },
            ].map(link => (
              <button
                key={link.id}
                onClick={() => {
                  try { document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
                }}
                className="px-3 py-1.5 text-sm rounded-md text-neutral-300 hover:text-white hover:bg-neutral-700/40"
              >{link.label}</button>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Home button */}
            <button
              onClick={handleHome}
              className="px-4 py-2 text-sm rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/40 hover:text-white transition-colors"
              title="Home"
            >
              <span className="inline-flex items-center gap-2">
                <HomeIcon className="w-4 h-4 text-[#F97316]" />
                <span>Home</span>
              </span>
            </button>
            {/* Settings gear dropdown */}
            <div id="header-settings" className="relative">
              <button onClick={() => setSettingsOpen(v=>!v)} className="px-3 py-2 text-sm rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/40 hover:text-white transition-colors" title="Einstellungen" aria-haspopup>
                <SettingsIcon className="w-4 h-4" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl p-1 z-50">
                  {/* Theme toggle */}
                  <button onClick={() => { setTheme(prev => prev==='light'?'dark':'light'); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700">
                    <span className="inline-flex items-center gap-2">{theme==='light'? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>} {theme==='light' ? 'Dunkel' : 'Hell'}
                    </span>
                  </button>
                  {authRole === 'admin' && (
                    <button onClick={() => { onAdminClick?.(); setSettingsOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700">Admin</button>
                  )}
                  {authRole === 'unauthenticated' ? (
                    <button onClick={() => { handleLogin(); setSettingsOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700"><span className="inline-flex items-center gap-2"><LogIn className="w-4 h-4"/> Anmelden</span></button>
                  ) : (
                    <button onClick={() => { handleLogout(); setSettingsOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700"><span className="inline-flex items-center gap-2"><LogOut className="w-4 h-4"/> Abmelden</span></button>
                  )}
                  <div className="h-px my-1 bg-neutral-700" />
                  <div className="flex items-center gap-2 px-3 pb-2">
                    <button onClick={() => setLang('de')} className={`px-2 py-1 rounded border ${lang==='de'?'border-neutral-300 text-neutral-100':'border-neutral-700 text-neutral-300'} bg-neutral-800 hover:bg-neutral-700`}>DE</button>
                    <button onClick={() => setLang('en')} className={`px-2 py-1 rounded border ${lang==='en'?'border-neutral-300 text-neutral-100':'border-neutral-700 text-neutral-300'} bg-neutral-800 hover:bg-neutral-700`}>EN</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-0 left-0 right-0 bg-neutral-800 border-b border-neutral-700 rounded-b-xl p-4 pt-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-neutral-200">Menü</h2>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Menü schließen"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile buttons */}
            <div className="mt-2 grid gap-2">
              <button onClick={handleHome} className="w-full px-3 py-2 rounded-lg bg-neutral-700/40 border border-neutral-600/50 text-neutral-200 text-left">
                <span className="inline-flex items-center gap-2"><HomeIcon className="w-4 h-4 text-[#4ECBD9]" /> Home</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'news', label: 'News' },
                  { id: 'booking', label: 'Booking' },
                  { id: 'media', label: 'Media' },
                  { id: 'about', label: 'About' },
                ].map(link => (
                  <button key={link.id} onClick={() => { try { document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {} setMobileOpen(false); }} className="w-full px-3 py-2 rounded-lg bg-neutral-700/30 border border-neutral-600/40 text-neutral-200 text-left">{link.label}</button>
                ))}
              </div>
              <div className="rounded-lg bg-neutral-800/60 border border-neutral-700 p-2">
                <div className="grid gap-1">
                  {/* Theme toggle */}
                  <button onClick={() => { setTheme(prev => prev==='light'?'dark':'light'); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700">
                    <span className="inline-flex items-center gap-2">{theme==='light'? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>} {theme==='light' ? 'Dunkel' : 'Hell'}</span>
                  </button>
                  {authRole === 'admin' && (
                    <button onClick={() => { onAdminClick?.(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700">Admin</button>
                  )}
                  {authRole === 'unauthenticated' ? (
                    <button onClick={() => { handleLogin(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700"><span className="inline-flex items-center gap-2"><LogIn className="w-4 h-4"/> Anmelden</span></button>
                  ) : (
                    <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-neutral-200 hover:bg-neutral-700"><span className="inline-flex items-center gap-2"><LogOut className="w-4 h-4"/> Abmelden</span></button>
                  )}
                  <div className="h-px my-1 bg-neutral-700" />
                  <div className="flex items-center gap-2 px-1 pb-1">
                    <button onClick={() => setLang('de')} className={`px-2 py-1 rounded border ${lang==='de'?'border-neutral-300 text-neutral-100':'border-neutral-700 text-neutral-300'} bg-neutral-800 hover:bg-neutral-700 w-full`}>DE</button>
                    <button onClick={() => setLang('en')} className={`px-2 py-1 rounded border ${lang==='en'?'border-neutral-300 text-neutral-100':'border-neutral-700 text-neutral-300'} bg-neutral-800 hover:bg-neutral-700 w-full`}>EN</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Gradient hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.5px] bg-gradient-to-r from-[#F97316] via-[#F59E0B] to-[#B45309] opacity-60" />
    </header>
  );
};

export default Header;