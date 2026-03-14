// PATH: app/api/pagespeed/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  // Fix: validasi strategy — hanya terima 'desktop' atau 'mobile'
  const rawStrategy = req.nextUrl.searchParams.get('strategy');
  const strategy = rawStrategy === 'mobile' ? 'mobile' : 'desktop';

  if (!url) {
    return NextResponse.json({ error: 'URL diperlukan' }, { status: 400 });
  }

  try {
    const apiKey = process.env.PAGESPEED_API_KEY;
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=${strategy}&category=performance&category=accessibility&category=seo&category=best-practices${
      apiKey ? `&key=${apiKey}` : ''
    }`;

    const res = await fetch(apiUrl, { cache: 'no-store' });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const cats = data.lighthouseResult?.categories;
    const scores = {
      performance: Math.round((cats?.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats?.accessibility?.score ?? 0) * 100),
      seo: Math.round((cats?.seo?.score ?? 0) * 100),
      bestPractices: Math.round((cats?.['best-practices']?.score ?? 0) * 100),
    };

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('PageSpeed error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data PageSpeed' }, { status: 500 });
  }
}