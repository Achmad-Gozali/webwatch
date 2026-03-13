// PATH: app/monitoring/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion } from 'motion/react';
import {
  Activity,
  RefreshCw,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Square,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Website {
  id: string;
  name: string;
  url: string;
}

interface ResponseEntry {
  time: string;
  ms: number | null;
}

interface WebsiteHistory {
  id: string;
  name: string;
  url: string;
  history: ResponseEntry[];
  latest: number | null;
  status: 'online' | 'offline' | 'unknown';
}

const STORAGE_KEY = 'cloudwatch_websites';
const HISTORY_KEY = 'webwatch_response_history';
const MAX_HISTORY = 20;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

function getStatusColor(ms: number | null) {
  if (ms === null) return 'text-zinc-500';
  if (ms < 300) return 'text-emerald-400';
  if (ms < 800) return 'text-amber-400';
  return 'text-rose-400';
}

function getStatusBg(ms: number | null) {
  if (ms === null) return 'bg-zinc-500';
  if (ms < 300) return 'bg-emerald-500';
  if (ms < 800) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getTrend(history: ResponseEntry[]) {
  const valid = history.filter((h) => h.ms !== null).slice(-5);
  if (valid.length < 2) return 'stable';
  const first = valid[0].ms!;
  const last = valid[valid.length - 1].ms!;
  const diff = last - first;
  if (diff > 50) return 'up';
  if (diff < -50) return 'down';
  return 'stable';
}

export default function MonitoringPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState<WebsiteHistory[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load websites & history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    const historyMap: Record<string, ResponseEntry[]> = savedHistory ? JSON.parse(savedHistory) : {};

    if (saved) {
      const parsed: Website[] = JSON.parse(saved);
      setWebsites(
        parsed.map((w) => ({
          ...w,
          history: historyMap[w.id] || [],
          latest: historyMap[w.id]?.slice(-1)[0]?.ms ?? null,
          status: 'unknown',
        }))
      );
    }
  }, []);

  const checkAll = useCallback(async (sites: WebsiteHistory[]) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updated = await Promise.all(
      sites.map(async (w) => {
        try {
          const start = Date.now();
          await fetch(`/api/check-website?url=${encodeURIComponent(w.url)}`, { cache: 'no-store' });
          const ms = Date.now() - start;

          const newEntry: ResponseEntry = { time: timeLabel, ms };
          const newHistory = [...w.history, newEntry].slice(-MAX_HISTORY);

          return {
            ...w,
            history: newHistory,
            latest: ms,
            status: 'online' as const,
          };
        } catch {
          const newEntry: ResponseEntry = { time: timeLabel, ms: null };
          const newHistory = [...w.history, newEntry].slice(-MAX_HISTORY);
          return {
            ...w,
            history: newHistory,
            latest: null,
            status: 'offline' as const,
          };
        }
      })
    );

    // Save history to localStorage
    const historyMap: Record<string, ResponseEntry[]> = {};
    updated.forEach((w) => { historyMap[w.id] = w.history; });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyMap));

    setWebsites(updated);
    setLastUpdated(timeLabel);
  }, []);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (isAutoRefresh) {
      checkAll(websites);
      intervalRef.current = setInterval(() => {
        setWebsites((prev) => { checkAll(prev); return prev; });
      }, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAutoRefresh]);

  // Build combined chart data
  const chartData = (() => {
    if (websites.length === 0) return [];
    const maxLen = Math.max(...websites.map((w) => w.history.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const entry: Record<string, string | number | null> = {
        time: websites[0]?.history[websites[0].history.length - maxLen + i]?.time ?? '',
      };
      websites.forEach((w) => {
        const idx = w.history.length - maxLen + i;
        entry[w.name] = idx >= 0 ? (w.history[idx]?.ms ?? null) : null;
      });
      return entry;
    });
  })();

  const avgResponseTime = websites.length > 0
    ? Math.round(
        websites
          .filter((w) => w.latest !== null)
          .reduce((acc, w) => acc + (w.latest ?? 0), 0) /
          Math.max(1, websites.filter((w) => w.latest !== null).length)
      )
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
                <Activity className="w-7 h-7 text-emerald-500" />
                Response Time Monitor
              </h1>
              <p className="text-zinc-500 text-sm">
                Track response time website lo dari waktu ke waktu
                {lastUpdated && <span className="ml-2 text-zinc-600">· Last check: {lastUpdated}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAutoRefresh((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isAutoRefresh
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {isAutoRefresh ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isAutoRefresh ? 'Stop Auto' : 'Auto (30s)'}
              </button>
              <button
                onClick={() => checkAll(websites)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Check Now
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5"
            >
              <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Websites</p>
              <p className="text-3xl font-bold text-white">{websites.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5"
            >
              <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Online</p>
              <p className="text-3xl font-bold text-emerald-400">
                {websites.filter((w) => w.status === 'online').length}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5"
            >
              <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Offline</p>
              <p className="text-3xl font-bold text-rose-400">
                {websites.filter((w) => w.status === 'offline').length}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5"
            >
              <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Avg Response</p>
              <p className={`text-3xl font-bold ${getStatusColor(avgResponseTime ?? null)}`}>
                {avgResponseTime !== null ? `${avgResponseTime}ms` : '—'}
              </p>
            </motion.div>
          </div>

          {/* Combined Chart */}
          {chartData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 lg:p-8"
            >
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Response Time History
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                    formatter={(value: unknown) => [`${value}ms`]}
                  />
                  <Legend />
                  {websites.map((w, i) => (
                    <Line
                      key={w.id}
                      type="monotone"
                      dataKey={w.name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Per Website Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {websites.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
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
              websites.map((website, index) => {
                const trend = getTrend(website.history);
                return (
                  <motion.div
                    key={website.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6"
                  >
                    {/* Website Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusBg(website.latest)}`} />
                        <div>
                          <h3 className="font-bold text-white">{website.name}</h3>
                          <p className="text-xs text-zinc-500 font-mono">{website.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-rose-400" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-emerald-400" />}
                        {trend === 'stable' && <Minus className="w-4 h-4 text-zinc-500" />}
                        <span className={`text-2xl font-bold ${getStatusColor(website.latest)}`}>
                          {website.latest !== null ? `${website.latest}ms` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    {website.history.filter((h) => h.ms !== null).length > 1 ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <LineChart data={website.history}>
                          <Line
                            type="monotone"
                            dataKey="ms"
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                          />
                          <YAxis hide domain={['auto', 'auto']} />
                          <XAxis dataKey="time" hide />
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                            labelStyle={{ color: '#a1a1aa', fontSize: 10 }}
                            formatter={(value: unknown) => [`${value}ms`]}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[100px] flex items-center justify-center border border-dashed border-white/5 rounded-xl">
                        <p className="text-zinc-600 text-xs">Klik Check Now untuk mulai tracking</p>
                      </div>
                    )}

                    {/* History dots */}
                    <div className="flex items-center gap-1 mt-3">
                      {website.history.slice(-10).map((h, i) => (
                        <div
                          key={i}
                          title={h.ms !== null ? `${h.ms}ms` : 'Offline'}
                          className={`flex-1 h-1.5 rounded-full ${getStatusBg(h.ms)}`}
                        />
                      ))}
                      {website.history.length === 0 &&
                        Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="flex-1 h-1.5 rounded-full bg-zinc-800" />
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">Last {website.history.length} checks</p>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}