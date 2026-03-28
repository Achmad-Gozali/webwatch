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

interface Website { id: string; name: string; url: string; }

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

  const loadUptimes = useCallback(async (sites: Website[]) => {
    if (sites.length === 0) return;
    const result = await calculateUptimeBatch(sites.map((w) => w.id), 30);
    setUptimes(result);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents').select('*, websites(name, url)')
      .order('started_at', { ascending: false }).limit(100);
    if (!incidentError && incidentData) setIncidents(incidentData);

    const { data: websiteData } = await supabase.from('websites').select('*').order('created_at', { ascending: true });
    if (websiteData && websiteData.length > 0) {
      setWebsites(websiteData);
      await loadUptimes(websiteData);
    }

    const saved = localStorage.getItem(SLA_KEY);
    if (saved) setSlaTargets(JSON.parse(saved));
    setLoading(false);
  }, [loadUptimes]);

  useEffect(() => {
    loadData();
    const incidentChannel = supabase.channel('incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(incidentChannel); };
  }, [loadData]);

  useEffect(() => {
    if (websites.length === 0) return;
    const channel = supabase.channel('incidents-page-monitor-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monitor_logs' }, () => loadUptimes(websites))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [websites, loadUptimes]);

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
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return m > 0 ? `${h}j ${m}m` : `${h}j`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'log', label: 'Log', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'timeline', label: 'Linimasa', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'sla', label: 'SLA', icon: <Target className="w-4 h-4" /> },
  ];

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-emerald-500" />
                Insiden
              </h1>
              <p className="text-zinc-500 text-xs lg:text-sm mt-0.5">Log, linimasa, dan pelacakan SLA</p>
            </div>
            <button onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold rounded-xl transition-all text-sm">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Perbarui</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: incidents.length, color: 'text-white' },
              { label: 'Berlangsung', value: ongoing.length, color: ongoing.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
              { label: 'Teratasi', value: resolved.length, color: 'text-emerald-400' },
              {
                label: 'Rata-rata Durasi',
                value: resolved.length > 0
                  ? formatDuration(Math.round(resolved.reduce((acc, i) => acc + (i.duration_minutes ?? 0), 0) / resolved.length))
                  : '—',
                color: resolved.length > 0 ? 'text-blue-400' : 'text-zinc-600',
              },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] lg:text-xs text-zinc-500 uppercase font-bold mb-1">{card.label}</p>
                <p className={`text-2xl lg:text-3xl font-bold ${card.color}`}>{card.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-xl p-1 w-fit min-w-full sm:min-w-0">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
                    activeTab === tab.id ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white'
                  }`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin mr-3" />
              <p className="text-zinc-500 text-sm">Memuat data...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'log' && (
                <motion.div key="log" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {incidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
                      <p className="text-white font-bold">Tidak Ada Insiden Tercatat</p>
                      <p className="text-zinc-400 text-sm mt-1">Semua website berjalan normal.</p>
                    </div>
                  ) : (
                    <>
                      {ongoing.length > 0 && (
                        <div>
                          <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Berlangsung ({ongoing.length})
                          </h2>
                          <div className="space-y-3">
                            {ongoing.map((incident, i) => (
                              <motion.div key={incident.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                                      <Globe className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-white text-sm truncate">{incident.websites?.name ?? '—'}</p>
                                      <p className="text-xs text-zinc-500 font-mono truncate">{incident.websites?.url ?? '—'}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20 flex items-center gap-1 shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Berlangsung
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-500">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(incident.started_at)}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {resolved.length > 0 && (
                        <div>
                          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Teratasi ({resolved.length})
                          </h2>
                          <div className="space-y-3">
                            {resolved.map((incident, i) => (
                              <motion.div key={incident.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                                      <Globe className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-white text-sm truncate">{incident.websites?.name ?? '—'}</p>
                                      <p className="text-xs text-zinc-500 font-mono truncate">{incident.websites?.url ?? '—'}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shrink-0">
                                    Teratasi
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(incident.started_at)}
                                  </div>
                                  {incident.duration_minutes !== null && (
                                    <div className="flex items-center gap-1 font-bold text-zinc-400">
                                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                                      {formatDuration(incident.duration_minutes)}
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

              {activeTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <p className="text-xs text-zinc-500">Uptime 30 hari terakhir. Hijau = aktif, merah = gangguan.</p>
                  {websites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                      <Globe className="w-8 h-8 text-zinc-700 mb-3" />
                      <p className="text-zinc-500 text-sm">Belum ada website</p>
                    </div>
                  ) : websites.map((website, index) => {
                    const siteIncidents = incidents.filter((i) => i.website_id === website.id);
                    const uptime = uptimes[website.id] ?? 100;
                    const now = new Date();
                    const slots = Array.from({ length: 30 }, (_, i) => {
                      const dayStart = new Date(now);
                      dayStart.setDate(now.getDate() - (29 - i));
                      dayStart.setHours(0, 0, 0, 0);
                      const dayEnd = new Date(dayStart);
                      dayEnd.setHours(23, 59, 59, 999);
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
                        className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm truncate">{website.name}</p>
                            <p className="text-xs text-zinc-500 font-mono truncate">{website.url}</p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className={`text-base font-bold ${getUptimeColor(uptime)}`}>{uptime}%</p>
                            <p className={`text-xs font-bold ${getUptimeColor(uptime)}`}>{getUptimeLabel(uptime)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {slots.map((slot, i) => (
                            <div key={i}
                              title={`${slot.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} — ${slot.hasIncident ? 'Ada insiden' : 'Normal'}`}
                              className={`flex-1 h-6 rounded-sm cursor-pointer hover:opacity-80 transition-all ${slot.hasIncident ? 'bg-rose-500/70' : 'bg-emerald-500/70'}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-zinc-600">30 hari lalu</p>
                          <p className={`text-[10px] ${incidentDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {incidentDays > 0 ? `${incidentDays} hari ada insiden` : 'Tidak ada insiden'}
                          </p>
                          <p className="text-[10px] text-zinc-600">Hari ini</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'sla' && (
                <motion.div key="sla" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <p className="text-xs text-zinc-500">Atur target uptime per website.</p>
                  {websites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                      <Globe className="w-8 h-8 text-zinc-700 mb-3" />
                      <p className="text-zinc-500 text-sm">Belum ada website</p>
                    </div>
                  ) : websites.map((website, index) => {
                    const uptime = uptimes[website.id] ?? 100;
                    const target = slaTargets[website.id] ?? 99;
                    const isMet = uptime >= target;
                    const gap = parseFloat((uptime - target).toFixed(2));

                    return (
                      <motion.div key={website.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                        className={`bg-zinc-900/40 border rounded-2xl p-4 transition-all ${isMet ? 'border-white/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isMet ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                              {isMet ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-sm truncate">{website.name}</p>
                              <p className="text-xs text-zinc-500 font-mono truncate">{website.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-zinc-500">Target:</span>
                            <select value={target} onChange={(e) => saveSlaTarget(website.id, parseFloat(e.target.value))}
                              className="bg-zinc-800 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50">
                              {SLA_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}%</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Uptime 30 hari</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getUptimeColor(uptime)}`}>{uptime}%</span>
                              <span className="text-zinc-600">/ target {target}%</span>
                            </div>
                          </div>
                          <div className="relative h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${isMet ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(uptime, 100)}%` }} />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: `${target}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            {isMet ? (
                              <div className="flex items-center gap-1 text-xs text-emerald-400">
                                <TrendingUp className="w-3 h-3" />
                                SLA tercapai {gap > 0 ? `+${gap}%` : ''}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-rose-400">
                                <AlertTriangle className="w-3 h-3" />
                                Kurang {Math.abs(gap)}%
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Calendar className="w-3 h-3" />
                              30 hari
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {websites.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" /> Ringkasan SLA
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Tercapai', value: websites.filter((w) => (uptimes[w.id] ?? 100) >= (slaTargets[w.id] ?? 99)).length, color: 'text-emerald-400' },
                          { label: 'Tidak Tercapai', value: websites.filter((w) => (uptimes[w.id] ?? 100) < (slaTargets[w.id] ?? 99)).length, color: 'text-rose-400' },
                          {
                            label: 'Rata-rata Uptime',
                            value: `${Object.values(uptimes).length > 0 ? (Object.values(uptimes).reduce((a, b) => a + b, 0) / Object.values(uptimes).length).toFixed(1) : '—'}%`,
                            color: 'text-blue-400',
                          },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <p className={`text-xl lg:text-2xl font-bold ${item.color}`}>{item.value}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">{item.label}</p>
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