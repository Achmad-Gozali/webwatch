// PATH: app/incidents/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { calculateUptimeBatch, getUptimeColor, getUptimeLabel } from '@/lib/uptime';
import {
  AlertTriangle, CheckCircle, Clock, Globe, RefreshCw,
  Target, TrendingUp, Calendar, BarChart2,
} from 'lucide-react';

interface Incident {
  id: string;
  website_id: string;
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
  status: 'ongoing' | 'resolved';
  websites?: { name: string; url: string };
}

interface Website {
  id: string;
  name: string;
  url: string;
}

interface SLATarget {
  websiteId: string;
  target: number; // 99, 99.9, 99.99, dll
}

// SLA targets disimpan di localStorage
const SLA_KEY = 'webwatch_sla_targets';

const SLA_OPTIONS = [99.99, 99.9, 99.5, 99, 95];

type Tab = 'log' | 'timeline' | 'sla';

export default function IncidentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [uptimes, setUptimes] = useState<Record<string, number>>({});
  const [slaTargets, setSlaTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Load incidents
    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .select('*, websites(name, url)')
      .order('started_at', { ascending: false })
      .limit(100);

    if (!incidentError && incidentData) setIncidents(incidentData);

    // Load websites
    const { data: websiteData } = await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: true });

    if (websiteData && websiteData.length > 0) {
      setWebsites(websiteData);
      // Load uptime batch
      const ids = websiteData.map((w: Website) => w.id);
      const uptimeData = await calculateUptimeBatch(ids, 30);
      setUptimes(uptimeData);
    }

    // Load SLA targets dari localStorage
    const saved = localStorage.getItem(SLA_KEY);
    if (saved) setSlaTargets(JSON.parse(saved));

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const saveSlaTarget = (websiteId: string, target: number) => {
    const updated = { ...slaTargets, [websiteId]: target };
    setSlaTargets(updated);
    localStorage.setItem(SLA_KEY, JSON.stringify(updated));
  };

  const ongoing = incidents.filter((i) => i.status === 'ongoing');
  const resolved = incidents.filter((i) => i.status === 'resolved');

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}j ${mins}m` : `${hours}j`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'log', label: 'Incident Log', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'sla', label: 'SLA Tracking', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-emerald-500" />
                Incidents
              </h1>
              <p className="text-zinc-500 text-sm">Log, timeline, dan SLA tracking semua website</p>
            </div>
            <button onClick={loadData}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-xl transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Incidents', value: incidents.length, color: 'text-white' },
              { label: 'Ongoing', value: ongoing.length, color: ongoing.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
              { label: 'Resolved', value: resolved.length, color: 'text-emerald-400' },
              {
                label: 'Avg Duration',
                value: resolved.length > 0
                  ? formatDuration(Math.round(resolved.reduce((acc, i) => acc + (i.duration_minutes ?? 0), 0) / resolved.length))
                  : '—',
                color: 'text-blue-400',
              },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-2">{card.label}</p>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mr-3" />
              <p className="text-zinc-500">Memuat data...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* ─── TAB: INCIDENT LOG ─── */}
              {activeTab === 'log' && (
                <motion.div key="log" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  {incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-4" />
                      <p className="text-white font-bold text-lg">No Incidents Recorded</p>
                      <p className="text-zinc-400 text-sm mt-1">Semua website berjalan normal.</p>
                    </div>
                  ) : (
                    <>
                      {/* Ongoing */}
                      {ongoing.length > 0 && (
                        <div>
                          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Ongoing ({ongoing.length})
                          </h2>
                          <div className="space-y-3">
                            {ongoing.map((incident, i) => (
                              <motion.div key={incident.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                      <Globe className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-white">{incident.websites?.name ?? '—'}</p>
                                      <p className="text-xs text-zinc-500 font-mono">{incident.websites?.url ?? '—'}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Ongoing
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-4 text-xs text-zinc-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  Started: {formatDate(incident.started_at)}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resolved */}
                      {resolved.length > 0 && (
                        <div>
                          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Resolved ({resolved.length})
                          </h2>
                          <div className="space-y-3">
                            {resolved.map((incident, i) => (
                              <motion.div key={incident.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                                      <Globe className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-white">{incident.websites?.name ?? '—'}</p>
                                      <p className="text-xs text-zinc-500 font-mono">{incident.websites?.url ?? '—'}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3" />
                                    Resolved
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-zinc-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Started: {formatDate(incident.started_at)}
                                  </div>
                                  {incident.resolved_at && (
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                      Resolved: {formatDate(incident.resolved_at)}
                                    </div>
                                  )}
                                  {incident.duration_minutes !== null && (
                                    <div className="flex items-center gap-1.5 font-bold text-zinc-400">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                      Duration: {formatDuration(incident.duration_minutes)}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ─── TAB: TIMELINE ─── */}
              {activeTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <p className="text-xs text-zinc-500">Visualisasi uptime 30 hari terakhir per website. Hijau = online, merah = down/degraded.</p>

                  {websites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                      <Globe className="w-10 h-10 text-zinc-700 mb-4" />
                      <p className="text-zinc-500">Belum ada website</p>
                    </div>
                  ) : websites.map((website, index) => {
                    // Ambil incidents untuk website ini
                    const siteIncidents = incidents.filter((i) => i.website_id === website.id);
                    const uptime = uptimes[website.id] ?? 100;

                    // Buat 30 slot (1 slot = 1 hari)
                    const now = new Date();
                    const slots = Array.from({ length: 30 }, (_, i) => {
                      const dayStart = new Date(now);
                      dayStart.setDate(now.getDate() - (29 - i));
                      dayStart.setHours(0, 0, 0, 0);
                      const dayEnd = new Date(dayStart);
                      dayEnd.setHours(23, 59, 59, 999);

                      // Cek apakah ada incident di hari ini
                      const hasIncident = siteIncidents.some((inc) => {
                        const start = new Date(inc.started_at);
                        const end = inc.resolved_at ? new Date(inc.resolved_at) : now;
                        return start <= dayEnd && end >= dayStart;
                      });

                      return { date: dayStart, hasIncident };
                    });

                    const incidentDays = slots.filter((s) => s.hasIncident).length;

                    return (
                      <motion.div key={website.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                        className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{website.name}</p>
                              <p className="text-xs text-zinc-500 font-mono">{website.url}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getUptimeColor(uptime)}`}>{uptime}%</p>
                            <p className={`text-xs font-bold ${getUptimeColor(uptime)}`}>{getUptimeLabel(uptime)}</p>
                          </div>
                        </div>

                        {/* Timeline bar — 30 hari */}
                        <div className="flex items-center gap-0.5">
                          {slots.map((slot, i) => (
                            <div
                              key={i}
                              title={`${slot.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} — ${slot.hasIncident ? 'Ada incident' : 'Normal'}`}
                              className={`flex-1 h-8 rounded-sm transition-all cursor-pointer hover:opacity-80 ${
                                slot.hasIncident ? 'bg-rose-500/70' : 'bg-emerald-500/70'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-zinc-600">30 hari lalu</p>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                            {incidentDays > 0 ? (
                              <span className="text-rose-400">{incidentDays} hari ada incident</span>
                            ) : (
                              <span className="text-emerald-400">Tidak ada incident</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-600">Hari ini</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* ─── TAB: SLA TRACKING ─── */}
              {activeTab === 'sla' && (
                <motion.div key="sla" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <p className="text-xs text-zinc-500">Set target uptime per website. WebWatch akan kasih warning kalau target tidak tercapai.</p>

                  {websites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                      <Globe className="w-10 h-10 text-zinc-700 mb-4" />
                      <p className="text-zinc-500">Belum ada website</p>
                    </div>
                  ) : websites.map((website, index) => {
                    const uptime = uptimes[website.id] ?? 100;
                    const target = slaTargets[website.id] ?? 99;
                    const isMet = uptime >= target;
                    const gap = parseFloat((uptime - target).toFixed(2));

                    return (
                      <motion.div key={website.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                        className={`bg-zinc-900/40 border rounded-2xl p-5 transition-all ${
                          isMet ? 'border-white/5' : 'border-rose-500/30 bg-rose-500/5'
                        }`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMet ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                              {isMet
                                ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{website.name}</p>
                              <p className="text-xs text-zinc-500 font-mono">{website.url}</p>
                            </div>
                          </div>

                          {/* SLA Target Selector */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-zinc-500">Target:</span>
                            <select
                              value={target}
                              onChange={(e) => saveSlaTarget(website.id, parseFloat(e.target.value))}
                              className="bg-zinc-800 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50"
                            >
                              {SLA_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}%</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Uptime 30 hari</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getUptimeColor(uptime)}`}>{uptime}%</span>
                              <span className="text-zinc-600">/</span>
                              <span className="text-zinc-400">target {target}%</span>
                            </div>
                          </div>

                          {/* Bar dengan marker target */}
                          <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isMet ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(uptime, 100)}%` }}
                            />
                            {/* Target marker */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-white/40"
                              style={{ left: `${target}%` }}
                            />
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-between">
                            {isMet ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5" />
                                SLA tercapai — {gap > 0 ? `+${gap}%` : 'tepat di target'}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                SLA tidak tercapai — kurang {Math.abs(gap)}%
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <Calendar className="w-3 h-3" />
                              30 hari terakhir
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Summary */}
                  {websites.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        SLA Summary
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          {
                            label: 'Target Tercapai',
                            value: websites.filter((w) => (uptimes[w.id] ?? 100) >= (slaTargets[w.id] ?? 99)).length,
                            color: 'text-emerald-400',
                          },
                          {
                            label: 'Target Tidak Tercapai',
                            value: websites.filter((w) => (uptimes[w.id] ?? 100) < (slaTargets[w.id] ?? 99)).length,
                            color: 'text-rose-400',
                          },
                          {
                            label: 'Avg Uptime',
                            value: `${Object.values(uptimes).length > 0
                              ? (Object.values(uptimes).reduce((a, b) => a + b, 0) / Object.values(uptimes).length).toFixed(1)
                              : '—'}%`,
                            color: 'text-blue-400',
                          },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                            <p className="text-xs text-zinc-500 mt-1">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}