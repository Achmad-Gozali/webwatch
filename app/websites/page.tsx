'use client';

// PATH: app/websites/page.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { getUptimeColor, getUptimeBg, getUptimeLabel, calculateUptimeBatch } from '@/lib/uptime';
import { useAuth } from '@/hooks/use-auth';
import {
  Globe, Plus, Trash2, RefreshCw, Shield, ShieldCheck, ShieldX,
  Clock, Activity, X, CheckCircle, XCircle, AlertCircle, Lock,
} from 'lucide-react';

interface Website { id: string; name: string; url: string; created_at?: string; }
interface WebsiteStatus {
  url: string; status: 'Online' | 'Offline' | 'Degraded' | 'Checking...';
  statusCode: number | null; responseTime: number;
  isSSL: boolean; sslValid: boolean; sslExpiry: string | null; checkedAt: string;
}

function getStatusLabel(s?: string) {
  if (!s || s === 'Checking...') return 'Memeriksa...';
  if (s === 'Online') return 'Aktif';
  if (s === 'Degraded') return 'Terganggu';
  if (s === 'Offline') return 'Tidak Aktif';
  return '—';
}

const STORAGE_KEY = 'cloudwatch_websites';

export default function WebsitesPage() {
  const { isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [statuses, setStatuses] = useState<Record<string, WebsiteStatus>>({});
  const [uptimes, setUptimes] = useState<Record<string, number>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const loadUptimes = useCallback(async (sites: Website[]) => {
    if (sites.length === 0) return;
    const result = await calculateUptimeBatch(sites.map((w) => w.id), 30);
    setUptimes(result);
  }, []);

  useEffect(() => {
    const loadWebsites = async () => {
      setLoadingWebsites(true);
      const { data, error } = await supabase.from('websites').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setWebsites(data); loadUptimes(data);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const localSites = JSON.parse(saved);
          setWebsites(localSites); loadUptimes(localSites);
          for (const site of localSites)
            await supabase.from('websites').upsert({ name: site.name, url: site.url }, { onConflict: 'url' });
        }
      }
      setLoadingWebsites(false);
    };
    loadWebsites();
  }, [loadUptimes]);

  useEffect(() => {
    if (websites.length === 0) return;
    const channel = supabase.channel('websites-page-monitor-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monitor_logs' }, () => loadUptimes(websites))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [websites, loadUptimes]);

  useEffect(() => {
    if (websites.length === 0) return;
    const merged = websites.map((w) => ({
      ...w,
      status: statuses[w.id]?.status?.toLowerCase() ?? undefined,
      responseTime: statuses[w.id]?.responseTime ?? undefined,
      uptime: uptimes[w.id] ?? undefined,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }, [statuses, uptimes, websites]);

  const checkWebsite = useCallback(async (website: Website) => {
    setChecking((prev) => ({ ...prev, [website.id]: true }));
    setStatuses((prev) => ({
      ...prev, [website.id]: { ...prev[website.id], status: 'Checking...', url: website.url, statusCode: null, responseTime: 0, isSSL: website.url.startsWith('https://'), sslValid: false, sslExpiry: null, checkedAt: new Date().toISOString() },
    }));
    try {
      const res = await fetch(`/api/check-website?url=${encodeURIComponent(website.url)}`);
      const data = await res.json();
      setStatuses((prev) => ({ ...prev, [website.id]: data }));
      await supabase.from('monitor_logs').insert({ website_id: website.id, status: data.status.toLowerCase(), response_time: data.responseTime });
    } catch {
      setStatuses((prev) => ({ ...prev, [website.id]: { url: website.url, status: 'Offline', statusCode: null, responseTime: 0, isSSL: website.url.startsWith('https://'), sslValid: false, sslExpiry: null, checkedAt: new Date().toISOString() } }));
    } finally {
      setChecking((prev) => ({ ...prev, [website.id]: false }));
    }
  }, []);

  const hasWebsites = websites.length > 0;
  useEffect(() => {
    if (hasWebsites) websites.forEach((w) => checkWebsite(w));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWebsites]);

  const checkAll = () => websites.forEach((w) => checkWebsite(w));

  const addWebsite = async () => {
    if (!isAdmin) return;
    if (!newName.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    const { data, error } = await supabase.from('websites').insert({ name: newName.trim(), url }).select().single();
    if (error) { alert('Gagal menambahkan: ' + error.message); return; }
    setWebsites((prev) => [...prev, data]);
    setNewName(''); setNewUrl(''); setIsAddOpen(false);
    setTimeout(() => checkWebsite(data), 100);
  };

  const removeWebsite = async (id: string) => {
    if (!isAdmin) return;
    await supabase.from('monitor_logs').delete().eq('website_id', id);
    await supabase.from('incidents').delete().eq('website_id', id);
    await supabase.from('websites').delete().eq('id', id);
    setWebsites((prev) => prev.filter((w) => w.id !== id));
    setStatuses((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setUptimes((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const getStatusColor = (s?: string) => !s || s === 'Checking...' ? 'text-zinc-400' : s === 'Online' ? 'text-emerald-400' : s === 'Degraded' ? 'text-amber-400' : 'text-rose-400';
  const getStatusBg = (s?: string) => !s || s === 'Checking...' ? 'bg-zinc-500' : s === 'Online' ? 'bg-emerald-500' : s === 'Degraded' ? 'bg-amber-500' : 'bg-rose-500';
  const getStatusIcon = (s?: string) => {
    if (!s || s === 'Checking...') return <Activity className="w-4 h-4 animate-pulse" />;
    if (s === 'Online') return <CheckCircle className="w-4 h-4" />;
    if (s === 'Degraded') return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const onlineCount = Object.values(statuses).filter((s) => s.status === 'Online').length;
  const offlineCount = Object.values(statuses).filter((s) => s.status === 'Offline').length;
  const avgUptime = Object.values(uptimes).length > 0
    ? parseFloat((Object.values(uptimes).reduce((a, b) => a + b, 0) / Object.values(uptimes).length).toFixed(1)) : null;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar
        className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        onClose={() => setSidebarOpen(false)}
      />
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-emerald-500" />
                Website
              </h1>
              <p className="text-zinc-500 text-xs lg:text-sm mt-0.5">Pantau status, uptime, dan performa</p>
            </div>
            <div className="flex gap-2">
              <button onClick={checkAll} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-xl transition-all text-sm">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Perbarui</span>
              </button>
              {/* Tombol Tambah hanya muncul kalau admin */}
              {isAdmin && (
                <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Website</span>
                  <span className="sm:hidden">Tambah</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: websites.length, color: 'text-white', sub: 'website' },
              { label: 'Aktif', value: onlineCount, color: 'text-emerald-400', sub: 'berjalan normal' },
              { label: 'Tidak Aktif', value: offlineCount, color: 'text-rose-400', sub: 'tidak tersedia' },
              { label: 'Rata-rata Uptime', value: avgUptime !== null ? `${avgUptime}%` : '—', color: avgUptime !== null ? getUptimeColor(avgUptime) : 'text-blue-400', sub: '30 hari' },
            ].map((card) => (
              <div key={card.label} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {loadingWebsites ? (
              [1, 2, 3].map((i) => <div key={i} className="h-24 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse" />)
            ) : websites.map((website, index) => {
              const s = statuses[website.id];
              const isChecking = checking[website.id];
              const uptime = uptimes[website.id] ?? null;

              return (
                <motion.div key={website.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s?.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' : s?.status === 'Offline' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{website.name}</h4>
                      <a href={website.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-zinc-500 font-mono hover:text-emerald-400 transition-colors truncate block"
                        onClick={(e) => e.stopPropagation()}>
                        {website.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => checkWebsite(website)} disabled={isChecking}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                      </button>
                      {/* Tombol hapus hanya muncul kalau admin */}
                      {isAdmin ? (
                        <button onClick={() => removeWebsite(website.id)}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="p-2 text-zinc-700 cursor-not-allowed" title="Login sebagai admin untuk menghapus">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusBg(s?.status)} ${s?.status === 'Online' ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-bold flex items-center gap-1 ${getStatusColor(s?.status)}`}>
                        {getStatusIcon(s?.status)}
                        {getStatusLabel(isChecking ? 'Checking...' : s?.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-mono">{isChecking ? '...' : s ? `${s.responseTime}ms` : '—'}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-[100px]">
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${uptime !== null ? getUptimeBg(uptime) : 'bg-zinc-600'}`}
                          style={{ width: `${uptime ?? 0}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${uptime !== null ? getUptimeColor(uptime) : 'text-zinc-500'}`}>
                        {uptime !== null ? `${uptime}%` : '—'}
                      </span>
                      {uptime !== null && (
                        <span className={`text-[10px] font-bold ${getUptimeColor(uptime)}`}>{getUptimeLabel(uptime)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!s ? <Shield className="w-3.5 h-3.5 text-zinc-600" />
                        : s.isSSL && s.sslValid ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        : <ShieldX className="w-3.5 h-3.5 text-rose-500" />}
                      <span className="text-[10px] text-zinc-500">{!s ? '—' : s.isSSL ? (s.sslValid ? 'SSL Aman' : 'SSL Error') : 'Tanpa SSL'}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {!loadingWebsites && websites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                <Globe className="w-8 h-8 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Belum ada website yang dipantau</p>
                {isAdmin && (
                  <button onClick={() => setIsAddOpen(true)} className="mt-3 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest">
                    + Tambah Website
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Add Website — hanya untuk admin */}
      <AnimatePresence>
        {isAddOpen && isAdmin && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-[60] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Tambah Website</h3>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nama Website</label>
                  <input type="text" placeholder="Contoh: Portofolio Saya" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all" autoFocus />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL Website</label>
                  <input type="text" placeholder="https://websitesaya.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWebsite()}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                </div>
                <button onClick={addWebsite} disabled={!newName.trim() || !newUrl.trim()}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all">
                  Tambah & Pantau
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}