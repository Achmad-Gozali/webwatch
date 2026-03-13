// PATH: app/performance/page.tsx — Halaman Website Performance
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion } from 'motion/react';
import {
  Zap,
  RefreshCw,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle,
  Monitor,
  Smartphone,
} from 'lucide-react';

interface Website {
  id: string;
  name: string;
  url: string;
}

interface LighthouseScore {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
}

interface WebsitePerf extends Website {
  scores: LighthouseScore | null;
  loading: boolean;
  error: boolean;
  checkedAt: string | null;
}

const STORAGE_KEY = 'cloudwatch_websites';

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
};

const getScoreBg = (score: number) => {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
};

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

export default function CloudServicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState<WebsitePerf[]>([]);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Website[] = JSON.parse(saved);
      setWebsites(
        parsed.map((w) => ({
          ...w,
          scores: null,
          loading: false,
          error: false,
          checkedAt: null,
        }))
      );
    }
  }, []);

  const checkPerformance = useCallback(
    async (website: WebsitePerf, deviceType: 'desktop' | 'mobile') => {
      setWebsites((prev) =>
        prev.map((w) => (w.id === website.id ? { ...w, loading: true, error: false } : w))
      );

      try {
        // Fix: panggil internal API route, bukan langsung ke Google (hindari CORS)
        const res = await fetch(
          `/api/pagespeed?url=${encodeURIComponent(website.url)}&strategy=${deviceType}`
        );
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setWebsites((prev) =>
          prev.map((w) =>
            w.id === website.id
              ? { ...w, scores: data.scores, loading: false, error: false, checkedAt: new Date().toISOString() }
              : w
          )
        );
      } catch {
        setWebsites((prev) =>
          prev.map((w) =>
            w.id === website.id
              ? { ...w, loading: false, error: true, checkedAt: new Date().toISOString() }
              : w
          )
        );
      }
    },
    []
  );

  const checkAll = () => websites.forEach((w) => checkPerformance(w, device));

  const handleDeviceSwitch = (newDevice: 'desktop' | 'mobile') => {
    setDevice(newDevice);
    setWebsites((prev) =>
      prev.map((w) => ({ ...w, scores: null, error: false, checkedAt: null }))
    );
  };

  const avgScores =
    websites.length > 0 && websites.some((w) => w.scores)
      ? metrics.map((m) => {
          const valid = websites.filter((w) => w.scores);
          const avg =
            valid.reduce((acc, w) => acc + (w.scores?.[m.key] ?? 0), 0) / valid.length;
          return { ...m, avg: Math.round(avg) };
        })
      : null;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar
        className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Zap className="w-7 h-7 text-emerald-500" />
                Website Performance
              </h1>
              <p className="text-zinc-500 text-sm">
                Lighthouse score — Performance, Accessibility, SEO, Best Practices
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-zinc-900 border border-white/5 rounded-xl p-1">
                <button
                  onClick={() => handleDeviceSwitch('desktop')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    device === 'desktop' ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </button>
                <button
                  onClick={() => handleDeviceSwitch('mobile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    device === 'mobile' ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </button>
              </div>
              <button
                onClick={checkAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Analyze All
              </button>
            </div>
          </div>

          {/* Average Score Cards */}
          {avgScores && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {avgScores.map((m) => (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5"
                >
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-2">{m.label}</p>
                  <div className="flex items-end gap-2 mb-3">
                    <p className={`text-3xl font-bold ${getScoreColor(m.avg)}`}>{m.avg}</p>
                    <p className="text-xs text-zinc-500 mb-1">/ 100</p>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.avg}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${getScoreBg(m.avg)}`}
                    />
                  </div>
                  <p className={`text-xs font-bold mt-2 ${getScoreColor(m.avg)}`}>
                    {getScoreLabel(m.avg)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Website Cards */}
          <div className="space-y-6">
            {websites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                <Globe className="w-10 h-10 text-zinc-700 mb-4" />
                <p className="text-zinc-500 font-medium">Belum ada website</p>
                <a
                  href="/websites"
                  className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest"
                >
                  + Tambah Website dulu
                </a>
              </div>
            ) : (
              websites.map((website, index) => (
                <motion.div
                  key={website.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 lg:p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{website.name}</h3>
                        <p className="text-xs text-zinc-500 font-mono">{website.url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => checkPerformance(website, device)}
                      disabled={website.loading}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${website.loading ? 'animate-spin' : ''}`} />
                      {website.loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>

                  {website.loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-zinc-800/50 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : website.error ? (
                    <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-rose-400">Gagal menganalisis</p>
                        <p className="text-xs text-zinc-500">
                          Google PageSpeed butuh waktu ~30 detik. Coba lagi beberapa saat.
                        </p>
                      </div>
                    </div>
                  ) : website.scores ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {metrics.map((m) => {
                        const score = website.scores![m.key];
                        return (
                          <div key={m.key} className="bg-zinc-800/40 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs text-zinc-500 font-bold uppercase">{m.label}</p>
                              {getScoreIcon(score)}
                            </div>
                            <p className={`text-3xl font-bold mb-2 ${getScoreColor(score)}`}>
                              {score}
                            </p>
                            <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full ${getScoreBg(score)}`}
                              />
                            </div>
                            <p className={`text-[10px] font-bold mt-1.5 ${getScoreColor(score)}`}>
                              {getScoreLabel(score)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-10 border border-dashed border-white/5 rounded-2xl">
                      <p className="text-zinc-600 text-sm">Klik Analyze untuk cek performa</p>
                    </div>
                  )}

                  {website.checkedAt && !website.loading && (
                    <p className="text-[10px] text-zinc-600 mt-4 font-mono">
                      Last analyzed: {new Date(website.checkedAt).toLocaleString('id-ID')} · {device}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}