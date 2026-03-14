// PATH: app/api/check-website/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL diperlukan' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;
    const isSSL = url.startsWith('https://');

    const securityHeaders: Record<string, string | null> = {
      'strict-transport-security': res.headers.get('strict-transport-security'),
      'content-security-policy': res.headers.get('content-security-policy'),
      'x-frame-options': res.headers.get('x-frame-options'),
      'x-content-type-options': res.headers.get('x-content-type-options'),
      'referrer-policy': res.headers.get('referrer-policy'),
      'permissions-policy': res.headers.get('permissions-policy'),
    };

    // Cek SSL via ssl-checker.io
    let sslValid = false;
    let sslExpiry: string | null = null;
    let sslDaysLeft: number | null = null;
    let sslIssuer: string | null = null;

    if (isSSL) {
      try {
        const hostname = new URL(url).hostname;
        const sslRes = await fetch(`https://ssl-checker.io/api/v1/check/${hostname}`, {
          cache: 'no-store',
        });
        if (sslRes.ok) {
          const sslData = await sslRes.json();
          sslValid = sslData?.valid ?? true;
          sslExpiry = sslData?.validTo ?? null;
          sslIssuer = sslData?.issuer ?? null;

          if (sslExpiry) {
            const expDate = new Date(sslExpiry);
            const now = new Date();
            sslDaysLeft = Math.max(0, Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          }
        } else {
          sslValid = true;
        }
      } catch {
        sslValid = true;
      }
    }

    return NextResponse.json({
      url,
      status: res.ok ? 'Online' : 'Degraded',
      statusCode: res.status,
      responseTime,
      isSSL,
      sslValid,
      sslExpiry,
      sslDaysLeft,
      sslIssuer,
      headers: securityHeaders,
      // Fix: hapus uptime hardcoded 99.9 — uptime dihitung dari monitor_logs via lib/uptime.ts
      checkedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const isAborted = error instanceof Error && error.name === 'AbortError';

    return NextResponse.json({
      url,
      status: 'Offline',
      statusCode: null,
      responseTime: isAborted ? 10000 : responseTime,
      isSSL: url.startsWith('https://'),
      sslValid: false,
      sslExpiry: null,
      sslDaysLeft: null,
      sslIssuer: null,
      headers: {},
      checkedAt: new Date().toISOString(),
    });
  }
}