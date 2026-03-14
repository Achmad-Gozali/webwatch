// PATH: app/incidents/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Globe, RefreshCw } from 'lucide-react';

interface Incident {
  id: string;
  website_id: string;
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
  status: 'ongoing' | 'resolved';
  websites?: { name: string; url: string };
}

export default function IncidentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select('*, websites(name, url)')
      .order('started_at', { ascending: false })
      .limit(50);

    if (!error && data) setIncidents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();

    // Realtime
    const channel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        loadIncidents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const ongoing = incidents.filter((i) => i.status === 'ongoing');
  const resolved = incidents.filter((i) => i.status === 'resolved');

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

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
                Incident Log
              </h1>
              <p className="text-zinc-500 text-sm">Riwayat kapan website pernah down dan berapa lama</p>
            </div>
            <button onClick={loadIncidents}
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mr-3" />
              <p className="text-zinc-500">Memuat incident log...</p>
            </div>
          ) : incidents.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-white font-bold text-lg">No Incidents Recorded</p>
              <p className="text-zinc-400 text-sm mt-1">Semua website berjalan normal — belum ada insiden terdeteksi.</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
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
                        <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Started: {formatDate(incident.started_at)}
                          </div>
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}