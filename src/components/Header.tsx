import React from 'react';
import { Menu, X, Home as HomeIcon, LogIn, LogOut, TicketCheck } from 'lucide-react';

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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Mobile: compact top bar */}
        <div className="flex items-center justify-between sm:hidden">
          <span className="w-9 h-9" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#4ECBD9] to-[#F471B5] text-transparent bg-clip-text tracking-tight">
            <span className="inline-flex items-center gap-2">
              <TicketCheck className="w-5 h-5 text-[#4ECBD9]" />
              <span>Booking.tonband</span>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#4ECBD9] to-[#F471B5] text-transparent bg-clip-text tracking-tight">
            <span className="inline-flex items-center gap-3">
              <TicketCheck className="w-7 h-7 text-[#4ECBD9]" />
              <span>Booking.tonband</span>
            </span>
          </h1>

          {/* Center area removed (clock) */}

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Home button (replaces Host/Remote segmented) */}
            <button
              onClick={handleHome}
              className="px-4 py-2 text-sm rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/40 hover:text-white transition-colors"
              title="Home"
            >
              <span className="inline-flex items-center gap-2">
                <HomeIcon className="w-4 h-4 text-[#4ECBD9]" />
                <span>Home</span>
              </span>
            </button>

            {/* Übersicht button (for authenticated users) */}
            {(authRole === 'user' || authRole === 'admin') && (
              <button
                onClick={() => onOverviewClick?.()}
                className="px-4 py-2 text-sm rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/40 hover:text-white transition-colors"
                title="Übersicht"
              >
                Übersicht
              </button>
            )}

            {/* Admin button (only for admins) */}
            {authRole === 'admin' && (
              <button
                onClick={() => onAdminClick?.()}
                className="px-4 py-2 text-sm rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/40 hover:text-white transition-colors"
                title="Admin"
              >
                Admin
              </button>
            )}

            {/* Auth button */}
            {authRole === 'unauthenticated' ? (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-400 hover:bg-neutral-600 hover:text-white active:bg-neutral-500 transition-all"
                title="Anmelden"
              >
                <LogIn className="h-4 w-4" />
                <span className="text-sm font-medium">Anmelden</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border-[0.5px] border-neutral-600/50 bg-neutral-700/50 text-neutral-400 hover:bg-neutral-600 hover:text-white active:bg-neutral-500 transition-all"
                title="Abmelden"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Abmelden</span>
              </button>
            )}
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
              <button
                onClick={handleHome}
                className="w-full px-3 py-2 rounded-lg bg-neutral-700/40 border border-neutral-600/50 text-neutral-200 text-left"
              >
                <span className="inline-flex items-center gap-2"><HomeIcon className="w-4 h-4 text-[#4ECBD9]" /> Home</span>
              </button>
              {(authRole === 'user' || authRole === 'admin') && (
                <button
                  onClick={() => onOverviewClick?.()}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-700/40 border border-neutral-600/50 text-neutral-200 text-left"
                >
                  Übersicht
                </button>
              )}
              {authRole === 'admin' && (
                <button
                  onClick={() => onAdminClick?.()}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-700/40 border border-neutral-600/50 text-neutral-200 text-left"
                >
                  Admin
                </button>
              )}
              {authRole === 'unauthenticated' ? (
                <button
                  onClick={handleLogin}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-700/40 border border-neutral-600/50 text-neutral-200 text-left"
                >
                  <span className="inline-flex items-center gap-2"><LogIn className="w-4 h-4" /> Anmelden</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-700/40 border border-neutral-600/50 text-neutral-200 text-left"
                >
                  <span className="inline-flex items-center gap-2"><LogOut className="w-4 h-4" /> Abmelden</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Gradient hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.5px] bg-gradient-to-r from-[#4ECBD9] via-[#F471B5] to-[#4ECBD9] opacity-60" />
    </header>
  );
};

export default Header;