// PATH: app/page.tsx
import { createClient } from '@supabase/supabase-js';
import LandingClient from '@/components/LandingClient';

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: websites }, { data: logs }, { data: incidents }] = await Promise.all([
    supabase.from('websites').select('id, name, url').order('created_at', { ascending: true }),
    supabase.from('monitor_logs')
      .select('website_id, status, response_time, checked_at')
      .order('checked_at', { ascending: false })
      .limit(300),
    supabase.from('incidents').select('id, status'),
  ]);

  const websiteStats = (websites ?? []).map((site) => {
    const siteLogs = (logs ?? []).filter((l) => l.website_id === site.id);
    const latest = siteLogs[0];
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const recentLogs = siteLogs.filter((l) => new Date(l.checked_at) >= last30);
    const uptime = recentLogs.length > 0
      ? parseFloat(((recentLogs.filter((l) => l.status === 'online').length / recentLogs.length) * 100).toFixed(1))
      : 100;
    return {
      id: site.id,
      name: site.name,
      url: site.url,
      status: latest?.status ?? 'unknown',
      responseTime: latest?.status !== 'offline' ? (latest?.response_time ?? null) : null,
      uptime,
    };
  });

  const onlineCount = websiteStats.filter((w) => w.status === 'online').length;
  const avgUptime = websiteStats.length > 0
    ? parseFloat((websiteStats.reduce((a, b) => a + b.uptime, 0) / websiteStats.length).toFixed(1))
    : 100;
  const resolvedIncidents = (incidents ?? []).filter((i) => i.status === 'resolved').length;

  return {
    websites: websiteStats,
    stats: {
      total: websiteStats.length,
      online: onlineCount,
      avgUptime,
      resolvedIncidents,
    },
  };
}

export default async function HomePage() {
  const data = await getData();
  return <LandingClient data={data} />;
}

export const revalidate = 300;