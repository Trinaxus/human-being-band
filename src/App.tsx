import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import OverviewPage from './components/OverviewPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import { me, logout, contentGet } from './lib/api';
import LegalImpressum from './components/LegalImpressum';
import LegalPrivacy from './components/LegalPrivacy';

function App() {
  const [view, setView] = useState<'home' | 'login' | 'overview' | 'admin' | 'reset' | 'impressum' | 'datenschutz'>('home');
  const [authRole, setAuthRole] = useState<'unauthenticated' | 'user' | 'admin'>('unauthenticated');

  useEffect(() => {
    let currentContent: any = null;
    const check = async () => {
      try {
        const res = await me() as any;
        if (res?.authenticated) {
          setAuthRole((res.role as 'admin' | 'user') || 'admin');
        } else {
          setAuthRole('unauthenticated');
        }
      } catch {
        setAuthRole('unauthenticated');
      }
    };
    check();
    // Load SiteContent to apply global background image (in its own fixed layer)
    const applyContent = async () => {
      try {
        const c = await contentGet();
        currentContent = c;
        const ensureMainOverlay = () => {
          const mainId = 'bg-main-overlay';
          let main = document.getElementById(mainId) as HTMLDivElement | null;
          if (!main) {
            main = document.createElement('div');
            main.id = mainId;
            main.style.position = 'fixed';
            main.style.inset = '0';
            main.style.pointerEvents = 'none';
            main.style.zIndex = '-2'; // below bg image (-1)
            document.body.prepend(main);
          }
          // Theme-aware color (match Admin card)
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          main.style.backgroundColor = isLight ? 'rgba(250,247,242,0.95)' : 'rgba(10,10,10,0.95)';
        };

        const bg = (c?.content?.backgroundUrl || '').trim();
        const pickFilter = () => {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          const base = (c?.content as any)?.backgroundFilter || {};
          const light = (c?.content as any)?.backgroundFilterLight || null;
          const dark  = (c?.content as any)?.backgroundFilterDark  || null;
          return isLight ? (light || base) : (dark || base);
        };
        const f = pickFilter();
        if (bg) {
          const filterStr = [
            `brightness(${(f.brightness ?? 100)}%)`,
            `contrast(${(f.contrast ?? 100)}%)`,
            `saturate(${(f.saturate ?? 100)}%)`,
            `grayscale(${(f.grayscale ?? 0)}%)`,
            `sepia(${(f.sepia ?? 0)}%)`,
            `blur(${(f.blur ?? 0)}px)`,
            `hue-rotate(${(f.hue ?? 0)}deg)`
          ].join(' ');
          // Manage background image layer
          const bgId = 'bg-image-layer';
          let bgLayer = document.getElementById(bgId) as HTMLDivElement | null;
          if (!bgLayer) {
            bgLayer = document.createElement('div');
            bgLayer.id = bgId;
            bgLayer.style.position = 'fixed';
            bgLayer.style.inset = '0';
            bgLayer.style.zIndex = '-1';
            bgLayer.style.pointerEvents = 'none';
            document.body.prepend(bgLayer);
          }
          // Remove any legacy overlay appended to body in older versions
          const legacyOverlay = document.getElementById('bg-tint-overlay');
          if (legacyOverlay && legacyOverlay.parentElement !== bgLayer) legacyOverlay.remove();
          bgLayer.style.backgroundImage = `url('${bg}')`;
          bgLayer.style.backgroundSize = 'cover';
          bgLayer.style.backgroundRepeat = 'no-repeat';
          try {
            const cposX = (c?.content as any)?.backgroundPosX;
            const cposY = (c?.content as any)?.backgroundPosY;
            bgLayer.style.backgroundPosition = `${(typeof cposX==='number'?cposX:50)}% ${(typeof cposY==='number'?cposY:50)}%`;
          } catch { bgLayer.style.backgroundPosition = 'center'; }
          (bgLayer.style as any).filter = filterStr;
          // Manage overlay tint element (as child of bg layer)
          const id = 'bg-tint-overlay';
          let overlay = (bgLayer && bgLayer.querySelector(`#${id}`)) as HTMLDivElement | null;
          const needsOverlay = !!f.tintColor && (f.tintOpacity ?? 0) > 0;
          if (needsOverlay) {
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.id = id;
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.pointerEvents = 'none';
              overlay.style.zIndex = '-1';
              bgLayer?.appendChild(overlay);
            }
            overlay.style.backgroundColor = String(f.tintColor);
            overlay.style.opacity = String(f.tintOpacity ?? 0);
          } else if (overlay) {
            overlay.remove();
          }
          ensureMainOverlay();
        } else {
          const bgLayer = document.getElementById('bg-image-layer');
          if (bgLayer) bgLayer.remove();
          // Still ensure main overlay exists (for solid background even without image)
          const mainId = 'bg-main-overlay';
          let main = document.getElementById(mainId) as HTMLDivElement | null;
          if (!main) {
            main = document.createElement('div');
            main.id = mainId;
            main.style.position = 'fixed';
            main.style.inset = '0';
            main.style.pointerEvents = 'none';
            main.style.zIndex = '-2';
            document.body.prepend(main);
          }
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          main.style.backgroundColor = isLight ? 'rgba(245,245,245,0.95)' : 'rgba(10,10,10,0.95)';
        }
      } catch {}
    };
    applyContent();
    const onContentUpdated = () => applyContent();
    // Keep main overlay in sync with theme changes (light/dark)
    const setMainOverlayColor = () => {
      const el = document.getElementById('bg-main-overlay') as HTMLDivElement | null;
      if (!el) return;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      el.style.backgroundColor = isLight ? 'rgba(250,247,242,0.95)' : 'rgba(10,10,10,0.95)';
    };
    const applyBgFiltersForTheme = () => {
      try {
        const c = currentContent;
        if (!c) return;
        const bg = (c?.content?.backgroundUrl || '').trim();
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const base = (c?.content as any)?.backgroundFilter || {};
        const light = (c?.content as any)?.backgroundFilterLight || null;
        const dark  = (c?.content as any)?.backgroundFilterDark  || null;
        const f = isLight ? (light || base) : (dark || base);
        const filterStr = [
          `brightness(${(f?.brightness ?? 100)}%)`,
          `contrast(${(f?.contrast ?? 100)}%)`,
          `saturate(${(f?.saturate ?? 100)}%)`,
          `grayscale(${(f?.grayscale ?? 0)}%)`,
          `sepia(${(f?.sepia ?? 0)}%)`,
          `blur(${(f?.blur ?? 0)}px)`,
          `hue-rotate(${(f?.hue ?? 0)}deg)`
        ].join(' ');
        const bgLayer = document.getElementById('bg-image-layer') as HTMLDivElement | null;
        if (bg && bgLayer) {
          (bgLayer.style as any).filter = filterStr;
          const id = 'bg-tint-overlay';
          let overlay = (bgLayer && bgLayer.querySelector(`#${id}`)) as HTMLDivElement | null;
          const needsOverlay = !!f?.tintColor && (f?.tintOpacity ?? 0) > 0;
          if (needsOverlay) {
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.id = id;
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.pointerEvents = 'none';
              overlay.style.zIndex = '-1';
              bgLayer?.appendChild(overlay);
            }
            overlay.style.backgroundColor = String(f?.tintColor);
            overlay.style.opacity = String(f?.tintOpacity ?? 0);
          } else if (overlay) {
            overlay.remove();
          }
        }
      } catch {}
    };
    const themeObserver = new MutationObserver(() => { setMainOverlayColor(); applyBgFiltersForTheme(); });
    try { themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch {}
    const onStorage = (e: StorageEvent) => { if (e.key === 'theme') { setMainOverlayColor(); applyBgFiltersForTheme(); } };
    window.addEventListener('storage', onStorage);
    window.addEventListener('content:updated', onContentUpdated as any);
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    // route by query param ?view=reset
    const applyViewFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view');
        if (v === 'reset') { setView('reset'); return; }
        if (v === 'impressum') {
          setView('impressum');
          try { window.history.replaceState({}, '', '/'); } catch {}
          return;
        }
        if (v === 'datenschutz' || v === 'privacy') {
          setView('datenschutz');
          try { window.history.replaceState({}, '', '/'); } catch {}
          return;
        }
        // hash-based routing: #reset?email=...&token=...
        const h = window.location.hash || '';
        if (h.startsWith('#reset')) setView('reset');
      } catch {}
    };
    applyViewFromUrl();
    window.addEventListener('popstate', applyViewFromUrl);
    window.addEventListener('hashchange', applyViewFromUrl);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('hashchange', applyViewFromUrl);
      window.removeEventListener('content:updated', onContentUpdated as any);
      try { themeObserver.disconnect(); } catch {}
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        authRole={authRole}
        onHomeClick={() => setView('home')}
        onLoginClick={() => setView('login')}
        onLogoutClick={async () => {
          try { await logout(); } catch {}
          setAuthRole('unauthenticated');
          setView('home');
        }}
        onAdminClick={() => setView('admin')}
        onOverviewClick={() => setView('overview')}
      />
      <main className="flex-1 flex items-start md:items-center justify-center px-0 sm:px-4 py-6 w-full">
        {view === 'home' && <HomePage />}
        {view === 'login' && (
          <LoginPage onLoggedIn={async () => {
            try {
              const res = await me() as any;
              if (res?.authenticated) setAuthRole((res.role as 'admin' | 'user') || 'admin');
            } catch {}
            setView('home');
          }} />
        )}
        {view === 'reset' && <ResetPasswordPage onDone={() => setView('login')} />}
        {view === 'overview' && <OverviewPage />}
        {view === 'impressum' && <LegalImpressum />}
        {view === 'datenschutz' && <LegalPrivacy />}
        {view === 'admin' && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}

export default App;