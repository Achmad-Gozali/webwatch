// PATH: components/Charts/UptimeChart.tsx
'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck } from 'lucide-react';

interface Website {
  id: string;
  name: string;
  url: string;
  status?: string;
  uptime?: number;
}

export default function UptimeChart() {
  const [sites, setSites] = useState<Website[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('cloudwatch_websites');
    if (!raw) return;
    setSites(JSON.parse(raw));
  }, []);

  const online = sites.filter((s) => s.status === 'online').length;
  const degraded = sites.filter((s) => s.status === 'degraded').length;
  const offline = sites.filter((s) => s.status === 'offline').length;
  const unknown = sites.filter((s) => !s.status || s.status === 'unknown').length;
  const total = sites.length;

  const chartData = [
    { name: 'Online', value: online, color: '#10b981' },
    { name: 'Degraded', value: degraded, color: '#f59e0b' },
    { name: 'Offline', value: offline, color: '#ef4444' },
    { name: 'Belum dicek', value: unknown, color: '#52525b' },
  ].filter((d) => d.value > 0);

  const uptimePct = total > 0 ? Math.round((online / total) * 100) : null;
  const pieData = chartData.length > 0 ? chartData : [{ name: 'Belum dicek', value: 1, color: '#27272a' }];

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-white">Uptime Status</h3>
          </div>
          <p className="text-xs text-zinc-500">Status semua website</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">{uptimePct ?? 0}%</p>
            <p className="text-[10px] text-zinc-500 font-mono">Online</p>
          </div>
        )}
      </div>

      {total > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2">
            {[
              { label: 'Online', value: online, color: 'bg-emerald-500' },
              { label: 'Degraded', value: degraded, color: 'bg-amber-500' },
              { label: 'Offline', value: offline, color: 'bg-rose-500' },
              { label: 'Belum dicek', value: unknown, color: 'bg-zinc-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs text-zinc-400">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-white">{item.value} site</span>
              </div>
            ))}
            <div className="pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Total</span>
                <span className="text-xs font-bold text-white">{total} site</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-xs text-zinc-600 text-center">
            Belum ada website.<br />Tambah di halaman Websites dulu.
          </p>
        </div>
      )}

      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
    </div>
  );
}