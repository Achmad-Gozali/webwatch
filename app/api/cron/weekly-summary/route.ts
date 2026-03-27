// PATH: app/api/cron/weekly-summary/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { sendTelegram } from '@/lib/telegram';

// Fix: tambah guard seperti di monitor/route.ts
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[WebWatch] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: websites } = await supabase
      .from('websites')
      .select('id, name, url');

    if (!websites || websites.length === 0) {
      return NextResponse.json({ message: 'No websites' });
    }

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: logs } = await supabase
      .from('monitor_logs')
      .select('website_id, status, response_time, checked_at')
      .in('website_id', websites.map((w) => w.id))
      .gte('checked_at', since.toISOString());

    const { data: incidents } = await supabase
      .from('incidents')
      .select('website_id, started_at, resolved_at, duration_minutes, status')
      .in('website_id', websites.map((w) => w.id))
      .gte('started_at', since.toISOString());

    const websiteStats = websites.map((site) => {
      const siteLogs = (logs ?? []).filter((l) => l.website_id === site.id);
      const siteIncidents = (incidents ?? []).filter((i) => i.website_id === site.id);

      const total = siteLogs.length;
      const online = siteLogs.filter((l) => l.status === 'online').length;
      const uptime = total > 0 ? parseFloat(((online / total) * 100).toFixed(1)) : 100;

      const onlineLogs = siteLogs.filter((l) => l.status !== 'offline' && l.response_time > 0);
      const avgResponse = onlineLogs.length > 0
        ? Math.round(onlineLogs.reduce((a, b) => a + b.response_time, 0) / onlineLogs.length)
        : null;

      const totalIncidents = siteIncidents.length;
      const totalDowntime = siteIncidents.reduce((a, b) => a + (b.duration_minutes ?? 0), 0);

      return {
        name: site.name,
        url: site.url,
        uptime,
        avgResponse,
        totalIncidents,
        totalDowntime,
      };
    });

    const statsText = websiteStats
      .map((s) => `- ${s.name}: uptime ${s.uptime}%${s.avgResponse ? `, avg response ${s.avgResponse}ms` : ''}${s.totalIncidents > 0 ? `, ${s.totalIncidents} incident (${s.totalDowntime} menit downtime)` : ', no incidents'}`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Kamu adalah sistem monitoring website WebWatch. Buat ringkasan mingguan singkat dalam bahasa Indonesia yang profesional.
Format output HARUS persis seperti ini (gunakan emoji):
📊 *Weekly Report*
[tanggal range minggu ini]

✅ *Highlights*
[2-3 poin positif]

⚠️ *Issues*
[masalah yang perlu perhatian, atau "Tidak ada masalah signifikan" jika semua baik]

📈 *Top Performers*
[2 website dengan uptime/response terbaik]

💡 *Rekomendasi*
[1-2 saran singkat]

Maksimal 200 kata. Langsung ke isi, tanpa salam.`,
        },
        {
          role: 'user',
          content: `Data 7 hari terakhir (${since.toLocaleDateString('id-ID')} - ${new Date().toLocaleDateString('id-ID')}):\n\n${statsText}`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary = completion.choices[0]?.message?.content ?? 'Gagal generate summary.';

    const message = `🗓 *WebWatch Weekly Summary*\n\n${summary}`;
    await sendTelegram(message);

    return NextResponse.json({
      success: true,
      message: 'Weekly summary sent to Telegram',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WebWatch] Weekly summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}