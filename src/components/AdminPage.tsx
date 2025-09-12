import React, { useEffect, useState } from 'react';
import { usersList, usersSetRole, type UserPublic } from '../lib/api';
import AdminContentPanel from './AdminContentPanel';
import AdminTicketsPanel from './AdminTicketsPanel';
import AdminScanPanel from './AdminScanPanel';
import TwoFASetupCard from './TwoFASetupCard';
import { useAuth } from '../hooks/useAuth';

const AdminPage: React.FC = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'content' | 'tickets' | 'scan'>('users');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersList();
      setUsers(res.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  const toggleRole = async (u: UserPublic) => {
    const next = u.role === 'admin' ? 'user' : 'admin';
    setBusyId(u.id);
    setError(null);
    try {
      await usersSetRole(u.id, next);
      setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, role: next } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren der Rolle');
    } finally {
      setBusyId(null);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <section className="bg-neutral-800/50 backdrop-blur-sm border-[0.1px] border-[#F471B5] rounded-xl p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#F471B5] mb-3">Kein Zugriff</h2>
          <p className="text-neutral-300">Dieser Bereich ist nur für Administratoren.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 self-start mt-2 md:mt-3">
      <div className="bg-neutral-900 rounded-xl border-[0.5px] border-neutral-700/20">
        {/* Header row with tabs */}
        <div className="border-b-[0.5px] border-neutral-700/20">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex-1 -mx-2 px-2 touch-manipulation no-scrollbar overflow-x-auto">
              <nav className="flex items-center justify-start min-w-max space-x-8">
                <button
                  onClick={() => setTab('users')}
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors touch-manipulation ${tab === 'users' ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  User-Verwaltung
                </button>
                <button
                  onClick={() => setTab('content')}
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors touch-manipulation ${tab === 'content' ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Content
                </button>
                <button
                  onClick={() => setTab('tickets')}
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors touch-manipulation ${tab === 'tickets' ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Tickets
                </button>
                <button
                  onClick={() => setTab('scan')}
                  className={`text-sm sm:text-base font-black uppercase tracking-wide transition-colors touch-manipulation ${tab === 'scan' ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Scan Ticket
                </button>
              </nav>
            </div>
            <div className="ml-6 flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-3 h-9 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-300 hover:bg-neutral-800/60"
              >
                Aktualisieren
              </button>
            </div>
          </div>
        </div>

        {/* Content area below tabs */}
        <div className="p-4 sm:p-6 space-y-6">
          {tab === 'content' ? (
            <AdminContentPanel />
          ) : tab === 'tickets' ? (
            <AdminTicketsPanel />
          ) : tab === 'scan' ? (
            <AdminScanPanel />
          ) : (
            <>
              {/* 2FA Setup */}
              <TwoFASetupCard />

              {error && (
                <div className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-[#F471B5] text-sm">{error}</div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-100">Benutzer</h3>
              </div>

              {loading ? (
                <div className="text-neutral-400">Lade Benutzer…</div>
              ) : users.length === 0 ? (
                <div className="text-neutral-400">Keine Benutzer vorhanden.</div>
              ) : (
                <div className="space-y-3">
                  {users.map(u => (
                    <div
                      key={u.id}
                      className="group rounded-xl bg-neutral-800/60 border-[0.5px] border-neutral-700/30 px-4 py-3 flex items-center justify-between hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center text-neutral-200 text-sm font-semibold">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-neutral-100 font-medium truncate">{u.name || '—'}</div>
                          <div className="text-[13px] text-[#909296] truncate">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.role === 'admin' ? 'bg-neutral-700 text-neutral-100 border border-neutral-600' : 'bg-neutral-700 text-[#909296] border border-neutral-600'}`}>{u.role}</span>
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={busyId === u.id}
                          className="px-3 py-1.5 rounded-lg border-[0.5px] border-neutral-700/40 text-neutral-200 hover:bg-neutral-700"
                        >
                          {u.role === 'admin' ? 'Herabstufen' : 'Hochstufen'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
