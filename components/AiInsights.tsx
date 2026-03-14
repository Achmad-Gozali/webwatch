// PATH: components/AiInsights.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateUptimeBatch } from '@/lib/uptime';

interface SiteData {
  name: string;
  status?: string;
  responseTime?: number;
  uptime?: number;
}

export default function AiInsights() {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  // Fix: debounce ref untuk hindari spam ke Groq API saat banyak INSERT masuk sekaligus
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setInsight('');

    try {
      const { data: websites, error } = await supabase
        .from('websites')
        .select('id, name, url');

      let sitesData: SiteData[] = [];

      if (!error && websites && websites.length > 0) {
        // Fix: batch query status terbaru — 1 query untuk semua website, bukan N+1
        const { data: logs } = await supabase
          .from('monitor_logs')
          .select('website_id, status, response_time, checked_at')
          .in('website_id', websites.map((w) => w.id))
          .order('checked_at', { ascending: false });

        // Ambil log terbaru per website
        const latestByWebsite: Record<string, { status: string; response_time: number }> = {};
        if (logs) {
          for (const log of logs) {
            if (!latestByWebsite[log.website_id]) {
              latestByWebsite[log.website_id] = {
                status: log.status,
                response_time: log.response_time,
              };
            }
          }
        }

        const ids = websites.map((w) => w.id);
        const uptimes = await calculateUptimeBatch(ids, 30);

        sitesData = websites.map((site) => ({
          name: site.name,
          status: latestByWebsite[site.id]?.status ?? undefined,
          responseTime: latestByWebsite[site.id]?.response_time ?? undefined,
          uptime: uptimes[site.id] ?? undefined,
        }));
      } else {
        const raw = localStorage.getItem('cloudwatch_websites');
        if (raw) {
          const parsed = JSON.parse(raw);
          sitesData = parsed.filter((s: SiteData) =>
            s.status && s.status !== 'undefined' && s.status !== 'checking...'
          );
        }
      }

      const validSites = sitesData.filter(
        (s) => s.status && s.status !== 'undefined' && s.status !== 'checking...'
      );

      if (validSites.length === 0) {
        setInsight('Belum ada data website. Tambah website di halaman Websites dulu.');
        setLoading(false);
        return;
      }

      const sitesParam = encodeURIComponent(JSON.stringify(
        validSites.map((s) => ({
          name: s.name,
          status: s.status,
          responseTime: s.responseTime,
          uptime: s.uptime,
        }))
      ));

      const res = await fetch(`/api/insights?sites=${sitesParam}&t=${Date.now()}`);
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await res.json();
        setInsight(data.insight || 'Gagal mendapatkan analisis.');
      } else {
        throw new Error('Response bukan JSON');
      }
    } catch (error) {
      console.error('Gagal fetch AI:', error);
      setInsight('Tidak dapat terhubung ke layanan AI. Pastikan GROQ_API_KEY sudah dikonfigurasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchInsight, 500);
    return () => clearTimeout(timer);
  }, [fetchInsight]);

  // Fix: debounce 30 detik — hindari hit Groq API setiap ada INSERT monitor_logs
  useEffect(() => {
    const channel = supabase
      .channel('aiinsights-monitor-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'monitor_logs' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchInsight, 30000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchInsight]);

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Insights</h3>
            <p className="text-xs text-emerald-400 font-mono">Llama-3 Analysis Active</p>
          </div>
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50 p-2 hover:bg-white/5 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-black/30 rounded-2xl p-4 font-mono text-sm min-h-[150px] flex items-start border border-white/5 relative z-10">
        {loading ? (
          <div className="flex flex-col gap-2 w-full mt-1">
            <div className="flex items-center gap-2 text-emerald-500/70">
              <div className="w-2 h-4 bg-emerald-500/70 rounded-sm animate-bounce" />
              <span className="text-xs">Menganalisis website lo...</span>
            </div>
            <div className="space-y-2 mt-2">
              {[80, 60, 40].map((w, i) => (
                <div key={i} className="h-2 bg-zinc-800 rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-zinc-300 leading-relaxed text-xs">
            <span className="text-emerald-500 mr-2">{'>_'}</span>
            {insight}
          </p>
        )}
      </div>

      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
    </div>
  );
}