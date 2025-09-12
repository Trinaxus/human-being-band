import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import OverviewPage from './components/OverviewPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import { me, logout, contentGet } from './lib/api';

function App() {
  const [view, setView] = useState<'home' | 'login' | 'overview' | 'admin' | 'reset'>('home');
  const [authRole, setAuthRole] = useState<'unauthenticated' | 'user' | 'admin'>('unauthenticated');

  useEffect(() => {
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
    // Load SiteContent for global CSS variables (orb)
    const applyContent = async () => {
      try {
        const c = await contentGet();
        const url = (c?.content?.orbUrl || '').trim();
        if (url) {
          document.documentElement.style.setProperty('--orb-url', `url('${url}')`);
        } else {
          document.documentElement.style.removeProperty('--orb-url');
        }
      } catch {}
    };
    applyContent();
    const onContentUpdated = () => applyContent();
    window.addEventListener('content:updated', onContentUpdated as any);
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    // route by query param ?view=reset
    const applyViewFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view');
        if (v === 'reset') { setView('reset'); return; }
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
        {view === 'admin' && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}

export default App;