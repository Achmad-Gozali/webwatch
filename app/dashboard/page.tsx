'use client';

import React, { useState } from 'react';
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
  const filters = [
    { label: 'Semua', value: 'all' },
    { label: 'Aktif', value: 'online' },
    { label: 'Tidak Aktif', value: 'offline' },
  ];

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('status'); else params.set('status', value);
    router.push(`/dashboard?${params.toString()}`);
  };

  const isActive = (value: string) => currentStatus === value;

  return (
    <div className="sm:hidden w-full overflow-x-auto scrollbar-none px-4 pb-2">
      <div className="flex items-center gap-2 w-max">
        {filters.map((f) => (
          <button key={f.value} onClick={() => handleFilter(f.value)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              isActive(f.value)
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      <Sidebar
        className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        onClose={() => setSidebarOpen(false)}
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Suspense fallback={null}><FilterBar /></Suspense>

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <ResponseTimeChart />
              <UptimeChart />
              <div className="md:col-span-2 lg:col-span-1">
                <AiInsights />
              </div>
            </div>
            <WebsiteList />
          </motion.div>
        </div>
      </main>
    </div>
  );
}