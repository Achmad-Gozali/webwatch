// PATH: app/status/StatusClient.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle, XCircle, AlertCircle, Globe, Clock,
  RefreshCw, Activity, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WebsiteStat {
  id: string;
  name: string;
  url: string;
  status: string;
  responseTime: number | null;
  uptime: number;
  slots: string[];
}

interface Incident {
  id: string;
  website_id: string;
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
  status: 'ongoing' | 'resolved';
  websites?: { name: string; url: string };
}

function getStatusColor(status: string) {
  if (status === 'online') return 'text-emerald-400';
  if (status === 'degraded') return 'text-amber-400';
  if (status === 'offline') return 'text-rose-400';
  return 'text-zinc-500';
}

function getStatusBg(status: string) {
  if (status === 'online') return 'bg-emerald-500';
  if (status === 'degraded') return 'bg-amber-500';
  if (status === 'offline') return 'bg-rose-500';
  return 'bg-zinc-700';
}

function getSlotColor(slot: string) {
  if (slot === 'online') return 'bg-emerald-500';
  if (slot === 'degraded') return 'bg-amber-400';
  if (slot === 'offline') return 'bg-rose-500';
  return 'bg-zinc-700';
}

function getUptimeColor(uptime: number) {
  if (uptime >= 99) return 'text-emerald-400';
  if (uptime >= 95) return 'text-amber-400';
  return 'text-rose-400';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

async function fetchStatusData() {
  const [{ data: websites }, { data: incidents }, { data: logs }] = await Promise.all([
    supabase.from('websites').select('id, name, url').order('created_at', { ascending: true }),
    supabase.from('incidents').select('*, websites(name, url)').order('started_at', { ascending: false }).limit(10),
    supabase.from('monitor_logs').select('website_id, status, response_time, checked_at')
      .order('checked_at', { ascending: false }).limit(500),
  ]);

  const websiteStats: WebsiteStat[] = (websites ?? []).map((site) => {
    const siteLogs = (logs ?? []).filter((l) => l.website_id === site.id);
    const latest = siteLogs[0];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentLogs = siteLogs.filter((l) => new Date(l.checked_at) >= last30Days);
    const uptime = recentLogs.length > 0
      ? parseFloat(((recentLogs.filter((l) => l.status === 'online').length / recentLogs.length) * 100).toFixed(2))
      : 100;

    const now = new Date();
    const slots = Array.from({ length: 45 }, (_, i) => {
      const slotEnd = new Date(now.getTime() - i * 16 * 60 * 60 * 1000);
      const slotStart = new Date(slotEnd.getTime() - 16 * 60 * 60 * 1000);
      const slotLogs = siteLogs.filter((l) => {
        const t = new Date(l.checked_at);
        return t >= slotStart && t <= slotEnd;
      });
      if (slotLogs.length === 0) return 'unknown';
      if (slotLogs.some((l) => l.status === 'offline')) return 'offline';
      if (slotLogs.some((l) => l.status === 'degraded')) return 'degraded';
      return 'online';
    }).reverse();

    return {
      ...site,
      status: latest?.status ?? 'unknown',
      responseTime: latest?.status !== 'offline' ? (latest?.response_time ?? null) : null,
      uptime,
      slots,
    };
  });

  return {
    websites: websiteStats,
    incidents: (incidents ?? []) as Incident[],
    lastUpdated: new Date().toISOString(),
  };
}

export default function StatusClient() {
  const [data, setData] = useState<{ websites: WebsiteStat[]; incidents: Incident[]; lastUpdated: string } | null>(null);
  const [expandedIncidents, setExpandedIncidents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const result = await fetchStatusData();
    setData(result);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // Realtime subscription — auto update saat ada log baru
    const channel = supabase
      .channel('status-page-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monitor_logs' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Memuat data...</span>
        </div>
      </div>
    );
  }

  const onlineCount = data.websites.filter((w) => w.status === 'online').length;
  const degradedCount = data.websites.filter((w) => w.status === 'degraded').length;
  const offlineCount = data.websites.filter((w) => w.status === 'offline').length;
  const allOnline = offlineCount === 0 && degradedCount === 0;
  const ongoingIncidents = data.incidents.filter((i) => i.status === 'ongoing');
  const resolvedIncidents = data.incidents.filter((i) => i.status === 'resolved');

  const overallStatus = offlineCount > 0
    ? { label: 'Partial Outage', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500' }
    : degradedCount > 0
    ? { label: 'Degraded Performance', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' }
    : { label: 'All Systems Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse' };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-12 lg:py-20 space-y-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">WebWatch</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white">Status Page</h1>
          <p className="text-zinc-500 text-sm">Real-time monitoring status semua layanan</p>

          <div className="flex items-center justify-center gap-3 text-xs text-zinc-600">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live — update otomatis</span>
            </div>
            <span>·</span>
            <span>Last updated: {formatDate(data.lastUpdated)}</span>
            <button onClick={handleRefresh} disabled={isRefreshing}
              className="p-1 hover:text-zinc-400 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Overall status banner */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className={`border rounded-2xl p-5 flex items-center gap-4 ${overallStatus.bg}`}>
          <div className={`w-3 h-3 rounded-full shrink-0 ${overallStatus.dot}`} />
          <div className="flex-1">
            <p className={`text-lg font-bold ${overallStatus.color}`}>{overallStatus.label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {onlineCount} online · {degradedCount} degraded · {offlineCount} offline dari {data.websites.length} layanan
            </p>
          </div>
          {allOnline && <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />}
        </motion.div>

        {/* Ongoing incidents */}
        <AnimatePresence>
          {ongoingIncidents.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="font-bold text-rose-400 text-sm uppercase tracking-widest">Active Incidents</h2>
              </div>
              {ongoingIncidents.map((inc) => (
                <div key={inc.id} className="pl-4 border-l-2 border-rose-500/40">
                  <p className="font-bold text-white text-sm">{inc.websites?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Incident dimulai {formatDate(inc.started_at)}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Website list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Services</h2>

          {data.websites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/40 border border-white/5 rounded-2xl">
              <Activity className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">Belum ada layanan yang dimonitor</p>
            </div>
          ) : data.websites.map((website, index) => (
            <motion.div key={website.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.04 }}
              className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 lg:p-5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusBg(website.status)} ${website.status === 'online' ? 'animate-pulse' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{website.name}</span>
                    <span className={`text-xs font-bold capitalize ${getStatusColor(website.status)}`}>
                      {website.status === 'online' ? '● Online'
                        : website.status === 'degraded' ? '⚠ Degraded'
                        : website.status === 'offline' ? '✕ Offline' : '— Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono truncate">{website.url}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${getUptimeColor(website.uptime)}`}>{website.uptime}%</p>
                  <p className="text-[10px] text-zinc-600">uptime</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {website.slots.map((slot, i) => (
                  <div key={i} title={slot}
                    className={`flex-1 h-6 lg:h-7 rounded-sm transition-all hover:opacity-70 cursor-default ${getSlotColor(slot)}`} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-zinc-600">30 hari lalu</span>
                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                  {website.responseTime !== null && (
                    <><Clock className="w-2.5 h-2.5" />{website.responseTime}ms</>
                  )}
                </div>
                <span className="text-[10px] text-zinc-600">Sekarang</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
          {[
            { color: 'bg-emerald-500', label: 'Operational' },
            { color: 'bg-amber-400', label: 'Degraded' },
            { color: 'bg-rose-500', label: 'Outage' },
            { color: 'bg-zinc-700', label: 'No data' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Incident history */}
        {resolvedIncidents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="space-y-3">
            <button onClick={() => setExpandedIncidents(!expandedIncidents)}
              className="w-full flex items-center justify-between px-1 group">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Incident History</h2>
              <div className="flex items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <span className="text-xs">{resolvedIncidents.length} incidents</span>
                {expandedIncidents ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            <AnimatePresence>
              {expandedIncidents && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2">
                  {resolvedIncidents.map((inc, i) => (
                    <motion.div key={inc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-zinc-900/40 border border-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{inc.websites?.name ?? '—'}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-500">
                            <span>Mulai: {formatDate(inc.started_at)}</span>
                            {inc.resolved_at && <span>Selesai: {formatDate(inc.resolved_at)}</span>}
                            {inc.duration_minutes && <span>Durasi: {formatDuration(inc.duration_minutes)}</span>}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shrink-0">
                          Resolved
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Stats summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, label: 'Online', value: onlineCount, color: 'text-emerald-400' },
            { icon: <AlertCircle className="w-4 h-4 text-amber-400" />, label: 'Degraded', value: degradedCount, color: 'text-amber-400' },
            { icon: <XCircle className="w-4 h-4 text-rose-400" />, label: 'Offline', value: offlineCount, color: 'text-rose-400' },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-zinc-600">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs">Powered by WebWatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}