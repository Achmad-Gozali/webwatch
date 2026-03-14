// PATH: components/Charts/ResponseTimeChart.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResponseTimeChart() {
  const [data, setData] = useState<{ time: string; avg: number }[]>([]);
  const [avgNow, setAvgNow] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const { data: logs, error } = await supabase
      .from('monitor_logs')
      .select('response_time, checked_at, status')
      .neq('status', 'offline')
      .order('checked_at', { ascending: false })
      .limit(50);

    if (error || !logs || logs.length === 0) {
      const raw = localStorage.getItem('webwatch_response_history');
      if (!raw) return;
      const history = JSON.parse(raw);
      const allSites = Object.values(history) as { time: string; ms: number }[][];
      if (allSites.length === 0) return;
      const maxLen = Math.max(...allSites.map((s) => s.length));
      const points: { time: string; avg: number }[] = [];
      for (let i = 0; i < Math.min(maxLen, 10); i++) {
        const vals = allSites.map((s) => s[i]?.ms).filter((v): v is number => typeof v === 'number');
        if (vals.length === 0) continue;
        points.push({ time: allSites[0][i]?.time ?? `#${i + 1}`, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) });
      }
      setData(points);
      if (points.length > 0) setAvgNow(points[points.length - 1].avg);
      return;
    }

    const grouped: Record<string, number[]> = {};
    logs.forEach((log) => {
      const time = new Date(log.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (!grouped[time]) grouped[time] = [];
      grouped[time].push(log.response_time);
    });

    const points = Object.entries(grouped)
      .slice(-10)
      .reverse()
      .map(([time, vals]) => ({
        time,
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }));

    setData(points);
    if (points.length > 0) setAvgNow(points[points.length - 1].avg);
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('response-time-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monitor_logs' }, () => {
        loadData();
      })
      .subscribe();

    const handleFocus = () => loadData();

    // Fix: hanya load saat tab aktif (visible), bukan saat disembunyikan
    const handleVisibility = () => {
      if (!document.hidden) loadData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  const color = avgNow === null ? '#10b981' : avgNow < 300 ? '#10b981' : avgNow < 800 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-white">Response Time</h3>
          </div>
          <p className="text-xs text-zinc-500">Rata-rata semua website</p>
        </div>
        <div className="text-right">
          {avgNow !== null ? (
            <>
              <p className="text-2xl font-bold" style={{ color }}>{avgNow}ms</p>
              <p className="text-[10px] text-zinc-500 font-mono">Terbaru</p>
            </>
          ) : (
            <p className="text-xs text-zinc-600">Belum ada data</p>
          )}
        </div>
      </div>

      {data.length > 1 ? (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#52525b' }} tickLine={false} axisLine={false} unit="ms" />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }}
              formatter={(value: unknown) => [`${value}ms`, 'Avg']}
            />
            <Area type="monotone" dataKey="avg" stroke={color} strokeWidth={2} fill="url(#rtGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-xs text-zinc-600 text-center">
            Menunggu data dari Supabase.<br />GitHub Actions akan update tiap 5 menit.
          </p>
        </div>
      )}

      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
    </div>
  );
}