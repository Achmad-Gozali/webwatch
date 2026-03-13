// PATH: components/AiInsights.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface Website {
  name: string;
  status?: string;
  responseTime?: number;
  uptime?: number;
}

export default function AiInsights() {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setInsight('');
    try {
      const raw = localStorage.getItem('cloudwatch_websites');
      const sites: Website[] = raw ? JSON.parse(raw) : [];

      // Filter hanya site yang sudah dicek
      const checkedSites = sites.filter(
        (s) => s.status && s.status !== 'undefined' && s.status !== 'checking...'
      );

      const sitesParam = encodeURIComponent(JSON.stringify(
        checkedSites.map((s) => ({
          name: s.name,
          status: s.status,
          responseTime: s.responseTime,
          uptime: s.uptime,
        }))
      ));

      // Cache bust dengan timestamp biar tiap klik refresh dapat data baru
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
    // Delay sedikit biar localStorage sempat ke-update dari halaman Websites
    const timer = setTimeout(fetchInsight, 500);
    return () => clearTimeout(timer);
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
                <div key={i} className={`h-2 bg-zinc-800 rounded animate-pulse`} style={{ width: `${w}%` }} />
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