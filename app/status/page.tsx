// PATH: app/status/page.tsx
// Halaman publik — bisa diakses siapapun tanpa login
// URL: webwatch-id.vercel.app/status

import { createClient } from '@supabase/supabase-js';
import StatusClient from './StatusClient';

// Fetch data di server side
async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: websites }, { data: incidents }, { data: logs }] = await Promise.all([
    supabase.from('websites').select('id, name, url').order('created_at', { ascending: true }),
    supabase.from('incidents').select('*, websites(name, url)').order('started_at', { ascending: false }).limit(10),
    supabase.from('monitor_logs').select('website_id, status, response_time, checked_at')
      .order('checked_at', { ascending: false })
      .limit(500),
  ]);

  // Hitung uptime & status terbaru per website
  const websiteStats = (websites ?? []).map((site) => {
    const siteLogs = (logs ?? []).filter((l) => l.website_id === site.id);
    const latest = siteLogs[0];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentLogs = siteLogs.filter((l) => new Date(l.checked_at) >= last30Days);
    const uptime = recentLogs.length > 0
      ? parseFloat(((recentLogs.filter((l) => l.status === 'online').length / recentLogs.length) * 100).toFixed(2))
      : 100;

    // Timeline 90 slot (per 8 jam dalam 30 hari)
    const now = new Date();
    const slots = Array.from({ length: 45 }, (_, i) => {
      const slotEnd = new Date(now.getTime() - i * 16 * 60 * 60 * 1000);
      const slotStart = new Date(slotEnd.getTime() - 16 * 60 * 60 * 1000);
      const slotLogs = siteLogs.filter((l) => {
        const t = new Date(l.checked_at);
        return t >= slotStart && t <= slotEnd;
      });
      if (slotLogs.length === 0) return 'unknown';
      const hasOffline = slotLogs.some((l) => l.status === 'offline');
      const hasDegraded = slotLogs.some((l) => l.status === 'degraded');
      if (hasOffline) return 'offline';
      if (hasDegraded) return 'degraded';
      return 'online';
    }).reverse();

    return {
      ...site,
      status: latest?.status ?? 'unknown',
      responseTime: latest?.status !== 'offline' ? latest?.response_time ?? null : null,
      uptime,
      slots,
    };
  });

  return {
    websites: websiteStats,
    incidents: incidents ?? [],
    lastUpdated: new Date().toISOString(),
  };
}

export default async function StatusPage() {
  const data = await getData();
  return <StatusClient data={data} />;
}

// Revalidate tiap 5 menit
export const revalidate = 300;