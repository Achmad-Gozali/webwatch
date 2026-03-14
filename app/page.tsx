// PATH: app/page.tsx — Dashboard (Halaman Utama)
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ResponseTimeChart from '@/components/Charts/ResponseTimeChart';
import UptimeChart from '@/components/Charts/UptimeChart';
import AiInsights from '@/components/AiInsights';
import WebsiteList from '@/components/WebsiteList';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') ?? 'all';
  const filters = ['All', 'Online', 'Offline'];

  const handleFilter = (f: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = f.toLowerCase();
    if (val === 'all') params.delete('status'); else params.set('status', val);
    router.push(`/?${params.toString()}`);
  };

  const isActive = (f: string) => f === 'All' ? currentStatus === 'all' : currentStatus === f.toLowerCase();

  return (
    <div className="sm:hidden w-full overflow-x-auto scrollbar-none px-4 pb-2">
      <div className="flex items-center gap-2 w-max">
        {filters.map((f) => (
          <button key={f} onClick={() => handleFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              isActive(f)
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
            }`}>
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      <Sidebar
        className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Suspense fallback={null}><FilterBar /></Suspense>

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {loading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[240px] bg-zinc-900/50 border border-white/5 rounded-3xl animate-pulse" />
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Charts & AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ResponseTimeChart />
                <UptimeChart />
                <AiInsights />
              </div>

              {/* Website List */}
              <WebsiteList />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}