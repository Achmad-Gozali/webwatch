// PATH: app/api/insights/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY tidak ditemukan di environment variables.');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ insight: 'API Key Groq tidak ditemukan.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const sitesParam = searchParams.get('sites');

  let sitesContext = 'Tidak ada data website.';
  let hasValidData = false;

  if (sitesParam) {
    try {
      const sites = JSON.parse(decodeURIComponent(sitesParam));
      const validSites = sites.filter((s: { status?: string }) =>
        s.status && s.status !== 'undefined' && s.status !== 'checking...'
      );
      if (validSites.length > 0) {
        hasValidData = true;
        sitesContext = validSites
          .map((s: { name: string; status: string; responseTime?: number; uptime?: number }) => {
            const statusLabel =
              s.status === 'online' ? 'Online ✓' :
              s.status === 'offline' ? 'Offline ✗' :
              s.status === 'degraded' ? 'Degraded ⚠' : s.status;
            return `- ${s.name}: ${statusLabel}${s.responseTime ? `, response ${s.responseTime}ms` : ''}${s.uptime ? `, uptime ${s.uptime}%` : ''}`;
          })
          .join('\n');
      }
    } catch {
      sitesContext = 'Gagal membaca data website.';
    }
  }

  if (!hasValidData) {
    return NextResponse.json({
      insight: 'Belum ada data website. Buka halaman Websites, tunggu pengecekan selesai, lalu klik refresh.',
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Kamu adalah AI monitoring website bernama WebWatch. Berikan analisis singkat dalam bahasa Indonesia.
Aturan:
- Maksimal 2-3 kalimat, langsung ke insight tanpa salam
- Response time: semakin KECIL ms = semakin CEPAT = lebih baik. Contoh: 95ms lebih cepat dari 130ms
- <300ms = bagus, 300-800ms = perlu perhatian, >800ms = lambat
- Kalau semua bagus: puji + kasih 1 tips optimasi
- Gaya: santai tapi profesional seperti DevOps senior`,
        },
        {
          role: 'user',
          content: `Data website:\n${sitesContext}\n\nBerikan analisis singkat.`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 120,
    });

    const insight = completion.choices[0]?.message?.content ?? 'Gagal mendapatkan analisis.';
    return NextResponse.json({ insight });
  } catch (error: unknown) {
    if (error instanceof Groq.APIError) {
      if (error.status === 429) return NextResponse.json({ insight: 'Rate limit tercapai. Coba lagi sebentar.' }, { status: 429 });
      if (error.status === 401) return NextResponse.json({ insight: 'API Key Groq tidak valid.' }, { status: 401 });
    }
    return NextResponse.json({ insight: 'Gagal menghubungi layanan AI.' }, { status: 500 });
  }
}