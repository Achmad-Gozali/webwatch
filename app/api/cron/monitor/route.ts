// PATH: app/api/cron/monitor/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  // Security: cek CRON_SECRET biar gak bisa dipanggil sembarangan
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ambil semua website dari Supabase
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
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
        responseTime = Date.now() - start;

        if (res.ok) status = responseTime > 2000 ? 'degraded' : 'online';
        else status = 'degraded';
      } catch {
        status = 'offline';
        responseTime = 0;
      }

      // Simpan hasil ke monitor_logs
      await supabase.from('monitor_logs').insert({
        website_id: site.id,
        status,
        response_time: responseTime,
      });

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