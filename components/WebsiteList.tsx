// PATH: components/WebsiteList.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, RefreshCw, Clock, ShieldCheck, ShieldX, Shield, ArrowUpRight, CheckCircle, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUptimeColor, getUptimeBg } from '@/lib/uptime';

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
  checkedAt: string;
}

const STORAGE_KEY = 'cloudwatch_websites';

function WebsiteListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get('status') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [websites, setWebsites] = useState<Website[]>([]);
  const [statuses, setStatuses] = useState<Record<string, WebsiteStatus>>({});
  const [uptimes, setUptimes] = useState<Record<string, number>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setWebsites(JSON.parse(saved));
  }, []);

  // Fix: load uptime akurat dari monitor_logs
  const loadUptimes = useCallback(async (sites: Website[]) => {
    if (sites.length === 0) return;
    const ids = sites.map((w) => w.id).join(',');
    try {
      const res = await fetch(`/api/uptime?websiteIds=${ids}&days=30`);
      const data = await res.json();
      if (data.uptimes) setUptimes(data.uptimes);
    } catch {
      console.error('Gagal load uptime');
    }
  }, []);

  useEffect(() => {
    if (websites.length > 0) loadUptimes(websites);
  }, [websites, loadUptimes]);

  const checkWebsite = useCallback(async (website: Website) => {
    setChecking((prev) => ({ ...prev, [website.id]: true }));
    setStatuses((prev) => ({
      ...prev,
      [website.id]: { ...prev[website.id], status: 'Checking...', responseTime: 0, isSSL: website.url.startsWith('https://'), sslValid: false, checkedAt: new Date().toISOString() },
    }));
    try {
      const res = await fetch(`/api/check-website?url=${encodeURIComponent(website.url)}`);
      const data = await res.json();
      setStatuses((prev) => ({ ...prev, [website.id]: data }));

      // Refresh uptime setelah cek
      const uptimeRes = await fetch(`/api/uptime?websiteIds=${website.id}&days=30`);
      const uptimeData = await uptimeRes.json();
      if (uptimeData.uptimes) setUptimes((prev) => ({ ...prev, ...uptimeData.uptimes }));
    } catch {
      setStatuses((prev) => ({ ...prev, [website.id]: { status: 'Offline', responseTime: 0, isSSL: website.url.startsWith('https://'), sslValid: false, checkedAt: new Date().toISOString() } }));
    } finally {
      setChecking((prev) => ({ ...prev, [website.id]: false }));
    }
  }, []);

  useEffect(() => {
    if (websites.length > 0) websites.forEach((w) => checkWebsite(w));
  }, [websites.length]); // eslint-disable-line

  const checkAll = () => {
    websites.forEach((w) => checkWebsite(w));
    loadUptimes(websites);
  };

  const onlineCount = Object.values(statuses).filter((s) => s.status === 'Online').length;
  const offlineCount = Object.values(statuses).filter((s) => s.status === 'Offline').length;
  const checkedCount = Object.keys(statuses).length;
  const degradedCount = Object.values(statuses).filter((s) => s.status === 'Degraded').length;

  const filteredWebsites = websites.filter((w) => {
    const s = statuses[w.id];
    const matchesStatus = (() => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'online') return s?.status === 'Online';
      if (filterStatus === 'offline') return s?.status === 'Offline' || s?.status === 'Degraded';
      return true;
    })();
    const matchesSearch = searchQuery === ''
      ? true
      : w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const isAllOfflineEmpty = filterStatus === 'offline' && (offlineCount + degradedCount) === 0 && checkedCount > 0;
  const isStillChecking = filterStatus === 'offline' && checkedCount === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-white">
          Websites
          {searchQuery && (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              hasil untuk "<span className="text-emerald-400">{searchQuery}</span>"
            </span>
          )}
        </h2>
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

      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        <div className="col-span-4">Website</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Response</div>
        <div className="col-span-3">Uptime 30d</div>
        <div className="col-span-1">SSL</div>
      </div>

      <AnimatePresence mode="wait">
        {isAllOfflineEmpty && !searchQuery ? (
          <motion.div key="all-good" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-white font-bold text-lg">All Systems Operational</p>
            <p className="text-zinc-400 text-sm mt-1">Semua website online dan berjalan normal.</p>
            <p className="text-zinc-600 text-xs mt-3 font-mono">Last checked: {new Date().toLocaleTimeString('id-ID')}</p>
          </motion.div>

        ) : isStillChecking && !searchQuery ? (
          <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mb-3" />
            <p className="text-zinc-500 text-sm">Sedang mengecek status website...</p>
          </motion.div>

        ) : filteredWebsites.length > 0 ? (
          <motion.div key={`list-${filterStatus}-${searchQuery}`} className="grid grid-cols-1 gap-4">
            {filteredWebsites.map((website, index) => (
              <WebsiteRow
                key={website.id}
                website={website}
                status={statuses[website.id]}
                uptime={uptimes[website.id] ?? null}
                isChecking={checking[website.id]}
                index={index}
                searchQuery={searchQuery}
                onCheck={() => checkWebsite(website)}
                onClick={() => router.push('/websites')}
              />
            ))}
            {filterStatus === 'online' && offlineCount === 0 && checkedCount > 0 && !searchQuery && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 py-3 text-xs text-emerald-500/70 font-mono border border-emerald-500/10 rounded-2xl bg-emerald-500/5">
                <CheckCircle className="w-3.5 h-3.5" />
                {onlineCount} website online — tidak ada insiden terdeteksi
              </motion.div>
            )}
          </motion.div>

        ) : searchQuery ? (
          <motion.div key="empty-search" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
            <Globe className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-medium">Tidak ada hasil untuk "<span className="text-emerald-400">{searchQuery}</span>"</p>
            <button onClick={() => router.push('/')} className="mt-4 text-xs text-zinc-500 hover:text-white font-bold uppercase tracking-widest">
              Reset Search
            </button>
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

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-emerald-500/30 text-emerald-300 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function WebsiteRow({ website, status: s, uptime, isChecking, index, searchQuery, onClick }: {
  website: Website; status?: WebsiteStatus; uptime: number | null; isChecking?: boolean; index: number;
  searchQuery?: string; onCheck: () => void; onClick: () => void;
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
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              <HighlightText text={website.name} query={searchQuery ?? ''} />
            </h4>
            <p className="text-xs text-zinc-500 font-mono truncate">
              <HighlightText text={website.url} query={searchQuery ?? ''} />
            </p>
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
        {/* Fix: uptime akurat dari monitor_logs */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${uptime !== null ? getUptimeBg(uptime) : 'bg-zinc-600'}`}
                style={{ width: `${uptime ?? 0}%` }}
              />
            </div>
            <span className={`text-xs font-mono w-14 text-right ${uptime !== null ? getUptimeColor(uptime) : 'text-zinc-500'}`}>
              {uptime !== null ? `${uptime}%` : '—'}
            </span>
          </div>
        </div>
        <div className="lg:col-span-1 flex justify-end">
          {!s ? <Shield className="w-4 h-4 text-zinc-600" /> : s.isSSL && s.sslValid ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldX className="w-4 h-4 text-rose-500" />}
        </div>
      </div>
    </motion.div>
  );
}

export default function WebsiteList() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    }>
      <WebsiteListContent />
    </Suspense>
  );
}