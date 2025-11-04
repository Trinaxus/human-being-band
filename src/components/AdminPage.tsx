import React from 'react';
import AdminContentPanel from './AdminContentPanel';
import AdminEventsPanel from './AdminEventsPanel';
import AdminSchedulerPanel from './AdminSchedulerPanel';
import { useAuth } from '../hooks/useAuth';

const AdminPage: React.FC = () => {
  const { authenticated } = useAuth();
  const [tab, setTab] = React.useState<'content'|'events'|'scheduler'>('content');
  return (
    <div className="relative flex-1 w-full">
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 self-start mt-2 md:mt-3">
        {authenticated ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              {([
                { key: 'content', label: 'Content' },
                { key: 'events', label: 'Events' },
                { key: 'scheduler', label: 'Scheduler' },
              ] as const).map(t => (
                <button key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${tab===t.key? 'border-neutral-600 bg-neutral-800 text-neutral-100' : 'border-neutral-700/40 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800'}`}
                >{t.label}</button>
              ))}
            </div>
            <div className="w-full bg-neutral-900/70 rounded-xl border-[0.5px] border-neutral-700/20">
              <div className="p-4 sm:p-6">
                {tab==='content' && <AdminContentPanel />}
                {tab==='events' && <AdminEventsPanel />}
                {tab==='scheduler' && <AdminSchedulerPanel />}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full max-w-[1200px] mx-auto px-0">
            <section className="bg-neutral-800/50 backdrop-blur-sm border-[0.1px] border-[#B45309] rounded-xl p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#F97316] mb-3">Kein Zugriff</h2>
              <p className="text-neutral-300">Dieser Bereich ist nur für Administratoren.</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
