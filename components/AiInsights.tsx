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
        const { data: logs } = await supabase
          .from('monitor_logs')
          .select('website_id, status, response_time, checked_at')
          .in('website_id', websites.map((w) => w.id))
          .order('checked_at', { ascending: false });

        const latestByWebsite: Record<string, { status: string; response_time: number }> = {};
        if (logs) {
          for (const log of logs) {
            if (!latestByWebsite[log.website_id]) {
              latestByWebsite[log.website_id] = { status: log.status, response_time: log.response_time };
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
      setInsight('Tidak dapat terhubung ke layanan AI.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchInsight, 500);
    return () => clearTimeout(timer);
  }, [fetchInsight]);

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
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden group flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-white">AI Insights</h3>
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="text-zinc-500 hover:text-white transition-colors disabled:opacity-40 p-1.5 hover:bg-white/5 rounded-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 min-h-[120px] flex items-start">
        {loading ? (
          <div className="w-full space-y-2.5 mt-1">
            <div className="h-2.5 bg-zinc-800 rounded-full animate-pulse w-full" />
            <div className="h-2.5 bg-zinc-800 rounded-full animate-pulse w-4/5" />
            <div className="h-2.5 bg-zinc-800 rounded-full animate-pulse w-3/5" />
          </div>
        ) : (
          <p className="text-zinc-400 text-sm leading-relaxed">{insight}</p>
        )}
      </div>

      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
    </div>
  );
}