import React from 'react';
import AdminContentPanel from './AdminContentPanel';
import { useAuth } from '../hooks/useAuth';

const AdminPage: React.FC = () => {
  const { role } = useAuth();

  if (role !== 'admin') {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <section className="bg-neutral-800/50 backdrop-blur-sm border-[0.1px] border-[#B45309] rounded-xl p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#F97316] mb-3">Kein Zugriff</h2>
          <p className="text-neutral-300">Dieser Bereich ist nur für Administratoren.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full">
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 self-start mt-2 md:mt-3">
        <div className="w-full bg-neutral-900 rounded-xl border-[0.5px] border-neutral-700/20">
          <div className="p-4 sm:p-6">
            <AdminContentPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
