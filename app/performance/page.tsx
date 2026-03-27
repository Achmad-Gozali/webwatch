'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Zap, RefreshCw, Globe, AlertCircle, CheckCircle, XCircle, Monitor, Smartphone } from 'lucide-react';

interface Website { id: string; name: string; url: string; }
interface LighthouseScore { performance: number; accessibility: number; seo: number; bestPractices: number; }
interface WebsitePerf extends Website { scores: LighthouseScore | null; loading: boolean; error: boolean; checkedAt: string | null; }

const getScoreColor = (score: number) => score >= 90 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
const getScoreBg = (score: number) => score >= 90 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
const getScoreLabel = (score: number) => score >= 90 ? 'Good' : score >= 50 ? 'Needs Work' : 'Poor';
const getScoreIcon = (score: number) => {
  if (score >= 90) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (score >= 50) return <AlertCircle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-rose-400" />;
};

const metrics = [
  { key: 'performance' as const, label: 'Performance' },
  { key: 'accessibility' as const, label: 'Accessibility' },
  { key: 'seo' as const, label: 'SEO' },
  { key: 'bestPractices' as const, label: 'Best Practices' },
];

export default function PerformancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState<WebsitePerf[]>([]);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const checkPerformance = useCallback(async (website: WebsitePerf, deviceType: 'desktop' | 'mobile') => {
    setWebsites((prev) => prev.map((w) => w.id === website.id ? { ...w, loading: true, error: false } : w));
    try {
      const res = await fetch(`/api/pagespeed?url=${encodeURIComponent(website.url)}&strategy=${deviceType}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWebsites((prev) => prev.map((w) =>
        w.id === website.id ? { ...w, scores: data.scores, loading: false, error: false, checkedAt: new Date().toISOString() } : w
      ));
    } catch {
      setWebsites((prev) => prev.map((w) =>
        w.id === website.id ? { ...w, loading: false, error: true, checkedAt: new Date().toISOString() } : w
      ));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAndAnalyze = async () => {
      setLoadingWebsites(true);
      const { data, error } = await supabase.from('websites').select('*').order('created_at', { ascending: true });
      if (cancelled) return;

      // Fix: pisahkan antara "error" vs "data kosong"
      if (error) {
        // Supabase error → fallback ke localStorage
        const saved = localStorage.getItem('cloudwatch_websites');
        if (saved) {
          const parsed: Website[] = JSON.parse(saved);
          const sites: WebsitePerf[] = parsed.map((w) => ({ ...w, scores: null, loading: true, error: false, checkedAt: null }));
          setWebsites(sites);
          setLoadingWebsites(false);
          for (const site of sites) {
            if (cancelled) break;
            await checkPerformance(site, 'desktop');
            await new Promise((r) => setTimeout(r, 1000));
          }
        } else {
          setLoadingWebsites(false);
        }
      } else {
        // Supabase OK (meski data kosong) → pakai data Supabase
        const sites: WebsitePerf[] = (data ?? []).map((w: Website) => ({ ...w, scores: null, loading: true, error: false, checkedAt: null }));
        setWebsites(sites);
        setLoadingWebsites(false);
        for (const site of sites) {
          if (cancelled) break;
          await checkPerformance(site, 'desktop');
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    };
    loadAndAnalyze();
    return () => { cancelled = true; };
  }, [checkPerformance]);

  const checkAll = useCallback(() => {
    setWebsites((prev) => prev.map((w) => ({ ...w, scores: null, error: false })));
    websites.forEach((w, i) => setTimeout(() => checkPerformance(w, device), i * 1500));
  }, [websites, device, checkPerformance]);

  const handleDeviceSwitch = useCallback((newDevice: 'desktop' | 'mobile') => {
    setDevice(newDevice);
    setWebsites((prev) => prev.map((w) => ({ ...w, scores: null, error: false, checkedAt: null })));
    websites.forEach((w, i) => setTimeout(() => checkPerformance(w, newDevice), i * 1500));
  }, [websites, checkPerformance]);

  const avgScores = websites.length > 0 && websites.some((w) => w.scores)
    ? metrics.map((m) => {
        const valid = websites.filter((w) => w.scores);
        return { ...m, avg: Math.round(valid.reduce((acc, w) => acc + (w.scores?.[m.key] ?? 0), 0) / valid.length) };
      })
    : null;

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-emerald-500" />
                Website Performance
              </h1>
              <p className="text-zinc-500 text-xs lg:text-sm mt-0.5">Lighthouse score — auto analyze saat halaman dibuka</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-900 border border-white/5 rounded-xl p-1">
                <button onClick={() => handleDeviceSwitch('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${device === 'desktop' ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'}`}>
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button onClick={() => handleDeviceSwitch('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${device === 'mobile' ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'}`}>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
              <button onClick={checkAll}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Analyze All</span>
              </button>
            </div>
          </div>

          {avgScores && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {avgScores.map((m) => (
                <motion.div key={m.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] lg:text-xs text-zinc-500 uppercase font-bold mb-2">{m.label}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <p className={`text-2xl lg:text-3xl font-bold ${getScoreColor(m.avg)}`}>{m.avg}</p>
                    <p className="text-xs text-zinc-500 mb-0.5">/100</p>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.avg}%` }} transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${getScoreBg(m.avg)}`} />
                  </div>
                  <p className={`text-[10px] font-bold mt-1.5 ${getScoreColor(m.avg)}`}>{getScoreLabel(m.avg)}</p>
                </motion.div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {loadingWebsites ? (
              [1, 2].map((i) => <div key={i} className="h-40 bg-zinc-900/50 border border-white/5 rounded-3xl animate-pulse" />)
            ) : websites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                <Globe className="w-8 h-8 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Belum ada website</p>
                <a href="/websites" className="mt-3 text-xs text-emerald-500 font-bold uppercase tracking-widest">+ Tambah Website</a>
              </div>
            ) : websites.map((website, index) => (
              <motion.div key={website.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm lg:text-lg font-bold text-white truncate">{website.name}</h3>
                      <p className="text-xs text-zinc-500 font-mono truncate">{website.url}</p>
                    </div>
                  </div>
                  <button onClick={() => checkPerformance(website, device)} disabled={website.loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50 shrink-0 ml-2">
                    <RefreshCw className={`w-3.5 h-3.5 ${website.loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{website.loading ? 'Analyzing...' : 'Analyze'}</span>
                  </button>
                </div>

                {website.loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-zinc-800/50 rounded-2xl animate-pulse" />)}
                  </div>
                ) : website.error ? (
                  <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-400">Gagal menganalisis</p>
                      <p className="text-xs text-zinc-500">Coba klik Analyze lagi.</p>
                    </div>
                  </div>
                ) : website.scores ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {metrics.map((m) => {
                      const score = website.scores![m.key];
                      return (
                        <div key={m.key} className="bg-zinc-800/40 rounded-2xl p-3 lg:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{m.label}</p>
                            {getScoreIcon(score)}
                          </div>
                          <p className={`text-2xl font-bold mb-2 ${getScoreColor(score)}`}>{score}</p>
                          <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${getScoreBg(score)}`} />
                          </div>
                          <p className={`text-[10px] font-bold mt-1 ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 border border-dashed border-white/5 rounded-2xl">
                    <p className="text-zinc-600 text-sm">Memuat analisis...</p>
                  </div>
                )}

                {website.checkedAt && !website.loading && (
                  <p className="text-[10px] text-zinc-600 mt-3 font-mono">
                    {new Date(website.checkedAt).toLocaleString('id-ID')} · {device}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}