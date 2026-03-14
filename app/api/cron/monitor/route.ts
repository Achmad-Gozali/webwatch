// PATH: app/api/cron/monitor/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[WebWatch] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. Tambahkan di .env.local dan Vercel environment variables.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: websites, error } = await supabase.from('websites').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!websites || websites.length === 0) {
    return NextResponse.json({ message: 'No websites to monitor' });
  }

  const results = await Promise.all(
    websites.map(async (site) => {
      const start = Date.now();
      let status: 'online' | 'offline' | 'degraded' = 'offline';
      let responseTime = 0;

      try {
        const res = await fetch(site.url, {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        });
        responseTime = Date.now() - start;
        if (res.ok) status = responseTime > 2000 ? 'degraded' : 'online';
        else status = 'degraded';
      } catch {
        status = 'offline';
        responseTime = 0;
      }

      await supabase.from('monitor_logs').insert({
        website_id: site.id,
        status,
        response_time: responseTime,
      });

      // Fix: pakai .maybeSingle() — tidak throw error kalau 0 rows
      const { data: ongoingIncident } = await supabase
        .from('incidents')
        .select('*')
        .eq('website_id', site.id)
        .eq('status', 'ongoing')
        .maybeSingle();

      if (status === 'offline' || status === 'degraded') {
        if (!ongoingIncident) {
          await supabase.from('incidents').insert({
            website_id: site.id,
            started_at: new Date().toISOString(),
            status: 'ongoing',
          });
        }
      } else if (status === 'online' && ongoingIncident) {
        const startedAt = new Date(ongoingIncident.started_at);
        const resolvedAt = new Date();
        const durationMinutes = Math.round(
          (resolvedAt.getTime() - startedAt.getTime()) / 60000
        );

        await supabase
          .from('incidents')
          .update({
            resolved_at: resolvedAt.toISOString(),
            duration_minutes: durationMinutes,
            status: 'resolved',
          })
          .eq('id', ongoingIncident.id);
      }

      return { name: site.name, url: site.url, status, responseTime };
    })
  );

  return NextResponse.json({
    success: true,
    checked: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}