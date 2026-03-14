// PATH: app/websites/page.tsx — Halaman Website Monitoring
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import {
  Globe, Plus, Trash2, RefreshCw, Shield, ShieldCheck, ShieldX,
  Clock, Activity, X, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';

interface Website {
  id: string;
  name: string;
  url: string;
  created_at?: string;
}

interface WebsiteStatus {
  url: string;
  status: 'Online' | 'Offline' | 'Degraded' | 'Checking...';
  statusCode: number | null;
  responseTime: number;
  isSSL: boolean;
  sslValid: boolean;
  sslExpiry: string | null;
  checkedAt: string;
  uptime: number;
}

const STORAGE_KEY = 'cloudwatch_websites';

export default function WebsitesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [statuses, setStatuses] = useState<Record<string, WebsiteStatus>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  useEffect(() => {
    const loadWebsites = async () => {
      setLoadingWebsites(true);
      const { data, error } = await supabase.from('websites').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setWebsites(data);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const localSites = JSON.parse(saved);
          setWebsites(localSites);
          for (const site of localSites) {
            await supabase.from('websites').upsert({ name: site.name, url: site.url }, { onConflict: 'url' });
          }
        }
      }
      setLoadingWebsites(false);
    };
    loadWebsites();
  }, []);

  useEffect(() => {
    if (websites.length === 0) return;
    const merged = websites.map((w) => {
      const s = statuses[w.id];
      return {
        ...w,
        status: s?.status?.toLowerCase() ?? undefined,
        responseTime: s?.responseTime ?? undefined,
        uptime: s?.uptime ?? undefined,
        isSSL: s?.isSSL ?? undefined,
        sslValid: s?.sslValid ?? undefined,
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }, [statuses, websites]);

  const checkWebsite = useCallback(async (website: Website) => {
    setChecking((prev) => ({ ...prev, [website.id]: true }));
    setStatuses((prev) => ({
      ...prev,
      [website.id]: {
        ...prev[website.id],
        status: 'Checking...',
        url: website.url,
        statusCode: null,
        responseTime: 0,
        isSSL: website.url.startsWith('https://'),
        sslValid: false,
        sslExpiry: null,
        checkedAt: new Date().toISOString(),
        uptime: prev[website.id]?.uptime ?? 99.9,
      },
    }));

    try {
      const res = await fetch(`/api/check-website?url=${encodeURIComponent(website.url)}`);
      const data = await res.json();
      const result = {
        ...data,
        uptime: statuses[website.id]?.uptime ?? (data.status === 'Online' ? 99.9 : 85.0),
      };
      setStatuses((prev) => ({ ...prev, [website.id]: result }));

      await supabase.from('monitor_logs').insert({
        website_id: website.id,
        status: data.status.toLowerCase(),
        response_time: data.responseTime,
      });
    } catch {
      setStatuses((prev) => ({
        ...prev,
        [website.id]: {
          url: website.url,
          status: 'Offline',
          statusCode: null,
          responseTime: 0,
          isSSL: website.url.startsWith('https://'),
          sslValid: false,
          sslExpiry: null,
          checkedAt: new Date().toISOString(),
          uptime: prev[website.id]?.uptime ?? 0,
        },
      }));
    } finally {
      setChecking((prev) => ({ ...prev, [website.id]: false }));
    }
  }, [statuses]);

  useEffect(() => {
    if (websites.length > 0) websites.forEach((w) => checkWebsite(w));
  }, [websites.length]); // eslint-disable-line

  const checkAll = () => websites.forEach((w) => checkWebsite(w));

  const addWebsite = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

    const { data, error } = await supabase
      .from('websites')
      .insert({ name: newName.trim(), url })
      .select()
      .single();

    if (error) {
      alert('Gagal menambahkan website: ' + error.message);
      return;
    }

    setWebsites((prev) => [...prev, data]);
    setNewName('');
    setNewUrl('');
    setIsAddOpen(false);
    setTimeout(() => checkWebsite(data), 100);
  };

  const removeWebsite = async (id: string) => {
    await supabase.from('websites').delete().eq('id', id);
    setWebsites((prev) => prev.filter((w) => w.id !== id));
    setStatuses((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const getStatusColor = (status?: string) => {
    if (!status || status === 'Checking...') return 'text-zinc-400';
    if (status === 'Online') return 'text-emerald-400';
    if (status === 'Degraded') return 'text-amber-400';
    return 'text-rose-400';
  };

  const getStatusBg = (status?: string) => {
    if (!status || status === 'Checking...') return 'bg-zinc-500';
    if (status === 'Online') return 'bg-emerald-500';
    if (status === 'Degraded') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusIcon = (status?: string) => {
    if (!status || status === 'Checking...') return <Activity className="w-4 h-4 animate-pulse" />;
    if (status === 'Online') return <CheckCircle className="w-4 h-4" />;
    if (status === 'Degraded') return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const onlineCount = Object.values(statuses).filter((s) => s.status === 'Online').length;
  const offlineCount = Object.values(statuses).filter((s) => s.status === 'Offline').length;
  const avgResponseTime =
    Object.values(statuses).length > 0
      ? Math.round(Object.values(statuses).reduce((acc, s) => acc + (s.responseTime || 0), 0) / Object.values(statuses).length)
      : 0;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Globe className="w-7 h-7 text-emerald-500" />
                Website Monitoring
              </h1>
              <p className="text-zinc-500 text-sm">Monitor status, uptime, dan performa website lo</p>
            </div>
            <div className="flex gap-3">
              <button onClick={checkAll} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-xl transition-all">
                <RefreshCw className="w-4 h-4" />Refresh All
              </button>
              <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                <Plus className="w-4 h-4" />Add Website
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: websites.length, color: 'text-white', sub: 'websites' },
              { label: 'Online', value: onlineCount, color: 'text-emerald-400', sub: 'aktif sekarang' },
              { label: 'Offline', value: offlineCount, color: 'text-rose-400', sub: 'tidak tersedia' },
              { label: 'Avg Response', value: `${avgResponseTime}ms`, color: 'text-blue-400', sub: 'rata-rata' },
            ].map((card) => (
              <div key={card.label} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {loadingWebsites ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse" />
              ))
            ) : websites.map((website, index) => {
              const s = statuses[website.id];
              const isChecking = checking[website.id];
              return (
                <motion.div key={website.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 lg:p-6 hover:border-white/10 transition-all">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-3 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s?.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' : s?.status === 'Offline' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{website.name}</h4>
                        <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 font-mono hover:text-emerald-400 transition-colors truncate block" onClick={(e) => e.stopPropagation()}>
                          {website.url}
                        </a>
                      </div>
                    </div>
                    <div className="lg:col-span-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusBg(s?.status)} ${s?.status === 'Online' ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${getStatusColor(s?.status)}`}>
                        {getStatusIcon(s?.status)}
                        {isChecking ? 'Checking...' : (s?.status ?? '—')}
                      </span>
                    </div>
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">{isChecking ? '...' : s ? `${s.responseTime}ms` : '—'}</span>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Uptime</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${s?.uptime ?? 0}%` }} />
                        </div>
                        <span className="text-xs font-mono text-white">{s ? `${s.uptime.toFixed(1)}%` : '—'}</span>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        {!s ? <Shield className="w-4 h-4 text-zinc-600" /> : s.isSSL && s.sslValid ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldX className="w-4 h-4 text-rose-500" />}
                        <div>
                          <p className="text-xs font-bold text-white">{!s ? '—' : s.isSSL ? (s.sslValid ? 'SSL Valid' : 'SSL Error') : 'No SSL'}</p>
                          {s?.sslExpiry && <p className="text-[10px] text-zinc-500">Exp: {new Date(s.sslExpiry).toLocaleDateString('id-ID')}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-1 flex items-center justify-end gap-2">
                      <button onClick={() => checkWebsite(website)} disabled={isChecking} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => removeWebsite(website.id)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {s?.checkedAt && <p className="text-[10px] text-zinc-600 mt-3 font-mono">Last checked: {new Date(s.checkedAt).toLocaleString('id-ID')}</p>}
                </motion.div>
              );
            })}
            {!loadingWebsites && websites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                <Globe className="w-10 h-10 text-zinc-700 mb-4" />
                <p className="text-zinc-500 font-medium">Belum ada website yang dimonitor</p>
                <button onClick={() => setIsAddOpen(true)} className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest">+ Tambah Website</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-[60] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Tambah Website</h3>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nama Website</label>
                  <input type="text" placeholder="Contoh: My Portfolio" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all" autoFocus />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL Website</label>
                  <input type="text" placeholder="Contoh: https://mywebsite.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addWebsite()}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                </div>
                <button onClick={addWebsite} disabled={!newName.trim() || !newUrl.trim()}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                  Tambah & Monitor
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}