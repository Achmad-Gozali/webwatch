// PATH: app/api/check-website/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PRIVATE_IP_REGEX =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fd[0-9a-f]{2}:)/i;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL diperlukan' }, { status: 400 });
  }

  // Fix: validasi URL — cegah SSRF ke internal network
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Hanya HTTP/HTTPS yang diizinkan' }, { status: 400 });
  }

  if (PRIVATE_IP_REGEX.test(parsed.hostname)) {
    return NextResponse.json({ error: 'Akses ke IP privat tidak diizinkan' }, { status: 400 });
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

    // Fix: SSL valid = HTTPS berhasil di-fetch
    // Kalau fetch HTTPS sukses, berarti SSL-nya valid
    // ssl-checker.io hanya dipakai untuk info tambahan (expiry, issuer)
    let sslValid = isSSL; // default: valid kalau HTTPS berhasil diakses
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

          // Override ke false HANYA kalau ssl-checker explicitly bilang invalid
          if (sslData?.valid === false) sslValid = false;

          sslExpiry = sslData?.validTo ?? null;
          sslIssuer = sslData?.issuer ?? null;

          if (sslExpiry) {
            const expDate = new Date(sslExpiry);
            const now = new Date();
            sslDaysLeft = Math.max(
              0,
              Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            );
          }
        }
        // Kalau ssl-checker gagal / rate limit → tetap pakai sslValid = true
        // karena fetch HTTPS-nya tadi sudah berhasil
      } catch {
        // ssl-checker error → tidak mengubah sslValid
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