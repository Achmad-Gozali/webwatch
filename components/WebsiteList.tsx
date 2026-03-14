// PATH: components/WebsiteList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, RefreshCw, Clock, ShieldCheck, ShieldX, Shield, ArrowUpRight, CheckCircle, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Website {
  id: string;
  name: string;
  url: string;
}

interface WebsiteStatus {
  status: 'Online' | 'Offline' | 'Degraded' | 'Checking...';
  responseTime: number;
  isSSL: boolean;
  sslValid: boolean;
  uptime: number;
  checkedAt: string;
}

const STORAGE_KEY = 'cloudwatch_websites';

export default function WebsiteList() {
  const router = useRouter();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [statuses, setStatuses] = useState<Record<string, WebsiteStatus>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState('all');

  // Read filter from URL directly — reactive to URL changes
  useEffect(() => {
    const readFilter = () => {
      const params = new URLSearchParams(window.location.search);
      setFilterStatus(params.get('status') ?? 'all');
    };
    readFilter();
    window.addEventListener('popstate', readFilter);
    // Poll URL every 300ms to catch router.push changes
    const interval = setInterval(readFilter, 300);
    return () => {
      window.removeEventListener('popstate', readFilter);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setWebsites(JSON.parse(saved));
  }, []);

  const checkWebsite = useCallback(async (website: Website) => {
    setChecking((prev) => ({ ...prev, [website.id]: true }));
    setStatuses((prev) => ({
      ...prev,
      [website.id]: { ...prev[website.id], status: 'Checking...', responseTime: 0, isSSL: website.url.startsWith('https://'), sslValid: false, uptime: prev[website.id]?.uptime ?? 99.9, checkedAt: new Date().toISOString() },
    }));
    try {
      const res = await fetch(`/api/check-website?url=${encodeURIComponent(website.url)}`);
      const data = await res.json();
      setStatuses((prev) => ({ ...prev, [website.id]: { ...data, uptime: prev[website.id]?.uptime ?? (data.status === 'Online' ? 99.9 : 85.0) } }));
    } catch {
      setStatuses((prev) => ({ ...prev, [website.id]: { status: 'Offline', responseTime: 0, isSSL: website.url.startsWith('https://'), sslValid: false, uptime: prev[website.id]?.uptime ?? 0, checkedAt: new Date().toISOString() } }));
    } finally {
      setChecking((prev) => ({ ...prev, [website.id]: false }));
    }
  }, []);

  useEffect(() => {
    if (websites.length > 0) websites.forEach((w) => checkWebsite(w));
  }, [websites.length]); // eslint-disable-line

  const checkAll = () => websites.forEach((w) => checkWebsite(w));
  const onlineCount = Object.values(statuses).filter((s) => s.status === 'Online').length;
  const offlineCount = Object.values(statuses).filter((s) => s.status === 'Offline').length;
  const checkedCount = Object.keys(statuses).length;

  const uncheckedCount = websites.filter((w) => !statuses[w.id] || statuses[w.id].status === 'Checking...').length;
  const degradedCount = Object.values(statuses).filter((s) => s.status === 'Degraded').length;

  const filteredWebsites = websites.filter((w) => {
    if (filterStatus === 'all') return true;
    const s = statuses[w.id];
    if (filterStatus === 'online') return s?.status === 'Online';
    if (filterStatus === 'offline') return s?.status === 'Offline' || s?.status === 'Degraded';
    return true;
  });

  const isAllOfflineEmpty = filterStatus === 'offline' && (offlineCount + degradedCount) === 0 && checkedCount > 0;
  const isStillChecking = filterStatus === 'offline' && checkedCount === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-white">Websites</h2>
        <div className="flex items-center gap-4">
          <button onClick={checkAll} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-500 font-mono">{onlineCount}/{websites.length} Online</span>
          <button onClick={() => router.push('/websites')} className="text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
            Lihat Semua <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        <div className="col-span-4">Website</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Response</div>
        <div className="col-span-3">Uptime</div>
        <div className="col-span-1">SSL</div>
      </div>

      <AnimatePresence mode="wait">
        {/* Offline filter — semua aman */}
        {isAllOfflineEmpty ? (
          <motion.div key="all-good" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-white font-bold text-lg">All Systems Operational</p>
            <p className="text-zinc-400 text-sm mt-1">Semua website online dan berjalan normal.</p>
            <p className="text-zinc-600 text-xs mt-3 font-mono">Last checked: {new Date().toLocaleTimeString('id-ID')}</p>
          </motion.div>

        ) : isStillChecking ? (
          <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mb-3" />
            <p className="text-zinc-500 text-sm">Sedang mengecek status website...</p>
          </motion.div>

        ) : filteredWebsites.length > 0 ? (
          <motion.div key={`list-${filterStatus}`} className="grid grid-cols-1 gap-4">
            {filteredWebsites.map((website, index) => (
              <WebsiteRow
                key={website.id}
                website={website}
                status={statuses[website.id]}
                isChecking={checking[website.id]}
                index={index}
                onCheck={() => checkWebsite(website)}
                onClick={() => router.push('/websites')}
              />
            ))}
            {/* Footer info for Online filter */}
            {filterStatus === 'online' && offlineCount === 0 && checkedCount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 py-3 text-xs text-emerald-500/70 font-mono border border-emerald-500/10 rounded-2xl bg-emerald-500/5">
                <CheckCircle className="w-3.5 h-3.5" />
                {onlineCount} website online — tidak ada insiden terdeteksi
              </motion.div>
            )}
          </motion.div>

        ) : filterStatus !== 'all' ? (
          <motion.div key="empty-filter" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
            <WifiOff className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-medium">Tidak ada website dengan status ini</p>
          </motion.div>

        ) : (
          <motion.div key="empty" className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
            <Globe className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">Belum ada website</p>
            <button onClick={() => router.push('/websites')} className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest">
              + Tambah Website
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WebsiteRow({ website, status: s, isChecking, index, onClick }: {
  website: Website; status?: WebsiteStatus; isChecking?: boolean; index: number;
  onCheck: () => void; onClick: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2 }}
      onClick={onClick} className={`group cursor-pointer bg-zinc-900/40 border border-white/5 rounded-2xl p-4 lg:px-6 transition-all duration-300 ${
        s?.status === 'Online' ? 'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
        s?.status === 'Offline' ? 'hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'hover:border-white/10'
      }`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s?.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' : s?.status === 'Offline' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-400'}`}>
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{website.name}</h4>
            <p className="text-xs text-zinc-500 font-mono truncate">{website.url}</p>
          </div>
        </div>
        <div className="lg:col-span-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${s?.status === 'Online' ? 'bg-emerald-500 animate-pulse' : s?.status === 'Offline' ? 'bg-rose-500' : s?.status === 'Degraded' ? 'bg-amber-500' : 'bg-zinc-500'}`} />
          <span className={`text-xs font-medium ${s?.status === 'Online' ? 'text-emerald-400' : s?.status === 'Offline' ? 'text-rose-400' : s?.status === 'Degraded' ? 'text-amber-400' : 'text-zinc-400'}`}>
            {isChecking ? 'Checking...' : (s?.status ?? '—')}
          </span>
        </div>
        <div className="lg:col-span-2 flex items-center gap-2 text-zinc-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{isChecking ? '...' : s ? `${s.responseTime}ms` : '—'}</span>
        </div>
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${s?.uptime ?? 0}%` }} />
            </div>
            <span className="text-xs font-mono text-white w-12 text-right">{s ? `${s.uptime.toFixed(1)}%` : '—'}</span>
          </div>
        </div>
        <div className="lg:col-span-1 flex justify-end">
          {!s ? <Shield className="w-4 h-4 text-zinc-600" /> : s.isSSL && s.sslValid ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldX className="w-4 h-4 text-rose-500" />}
        </div>
      </div>
    </motion.div>
  );
}