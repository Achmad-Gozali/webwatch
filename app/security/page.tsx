// PATH: app/security/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, ShieldX, Shield, RefreshCw, Globe, Lock,
  AlertTriangle, CheckCircle, XCircle, Clock,
} from 'lucide-react';

interface Website {
  id: string;
  name: string;
  url: string;
}

interface SSLInfo {
  valid: boolean;
  daysLeft: number | null;
  issuer: string | null;
  expiresAt: string | null;
}

interface HeadersInfo {
  'strict-transport-security': boolean;
  'content-security-policy': boolean;
  'x-frame-options': boolean;
  'x-content-type-options': boolean;
  'referrer-policy': boolean;
  'permissions-policy': boolean;
}

interface WebsiteSecurity extends Website {
  ssl: SSLInfo | null;
  headers: HeadersInfo | null;
  loading: boolean;
  error: boolean;
  checkedAt: string | null;
}

const HEADER_LABELS: Record<keyof HeadersInfo, string> = {
  'strict-transport-security': 'HSTS',
  'content-security-policy': 'CSP',
  'x-frame-options': 'X-Frame',
  'x-content-type-options': 'X-Content-Type',
  'referrer-policy': 'Referrer Policy',
  'permissions-policy': 'Permissions Policy',
};

const HEADER_DESC: Record<keyof HeadersInfo, string> = {
  'strict-transport-security': 'Paksa HTTPS',
  'content-security-policy': 'Cegah XSS',
  'x-frame-options': 'Cegah clickjacking',
  'x-content-type-options': 'Cegah MIME sniffing',
  'referrer-policy': 'Kontrol referrer info',
  'permissions-policy': 'Batasi browser features',
};

function getSSLColor(daysLeft: number | null) {
  if (daysLeft === null) return 'text-zinc-500';
  if (daysLeft > 30) return 'text-emerald-400';
  if (daysLeft > 7) return 'text-amber-400';
  return 'text-rose-400';
}

function getSSLBg(daysLeft: number | null) {
  if (daysLeft === null) return 'bg-zinc-700';
  if (daysLeft > 30) return 'bg-emerald-500';
  if (daysLeft > 7) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getSecurityScore(site: WebsiteSecurity): number {
  let score = 0;
  if (site.ssl?.valid) score += 40;
  if (site.ssl?.daysLeft && site.ssl.daysLeft > 30) score += 10;
  if (site.headers) {
    const keys = Object.keys(site.headers) as (keyof HeadersInfo)[];
    score += Math.round((keys.filter((k) => site.headers![k]).length / keys.length) * 50);
  }
  return score;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

// Fix: pakai inline style untuk background opacity — hindari dynamic Tailwind class yang di-purge
function getScoreBadgeStyle(score: number): React.CSSProperties {
  if (score >= 80) return { backgroundColor: 'rgba(16,185,129,0.15)' };
  if (score >= 50) return { backgroundColor: 'rgba(245,158,11,0.15)' };
  return { backgroundColor: 'rgba(244,63,94,0.15)' };
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Secure';
  if (score >= 50) return 'Moderate';
  return 'At Risk';
}

export default function SecurityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websites, setWebsites] = useState<WebsiteSecurity[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const checkSecurity = useCallback(async (website: WebsiteSecurity) => {
    setWebsites((prev) => prev.map((w) => w.id === website.id ? { ...w, loading: true, error: false } : w));
    try {
      const res = await fetch(`/api/check-website?url=${encodeURIComponent(website.url)}`, { cache: 'no-store' });
      const data = await res.json();
      const ssl: SSLInfo = {
        valid: data.sslValid ?? false,
        daysLeft: data.sslDaysLeft ?? null,
        issuer: data.sslIssuer ?? null,
        expiresAt: data.sslExpiry ?? null,
      };
      const rawHeaders = data.headers ?? {};
      const headers: HeadersInfo = {
        'strict-transport-security': !!rawHeaders['strict-transport-security'],
        'content-security-policy': !!rawHeaders['content-security-policy'],
        'x-frame-options': !!rawHeaders['x-frame-options'],
        'x-content-type-options': !!rawHeaders['x-content-type-options'],
        'referrer-policy': !!rawHeaders['referrer-policy'],
        'permissions-policy': !!rawHeaders['permissions-policy'],
      };
      setWebsites((prev) => prev.map((w) =>
        w.id === website.id ? { ...w, ssl, headers, loading: false, error: false, checkedAt: new Date().toISOString() } : w
      ));
    } catch {
      setWebsites((prev) => prev.map((w) =>
        w.id === website.id ? { ...w, loading: false, error: true, checkedAt: new Date().toISOString() } : w
      ));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAndCheck = async () => {
      setLoadingWebsites(true);

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (!error && data && data.length > 0) {
        const sites: WebsiteSecurity[] = data.map((w: Website) => ({
          ...w, ssl: null, headers: null, loading: true, error: false, checkedAt: null,
        }));
        setWebsites(sites);
        setLoadingWebsites(false);

        for (const site of sites) {
          if (cancelled) break;
          await checkSecurity(site);
          await new Promise((r) => setTimeout(r, 500));
        }
      } else {
        const saved = localStorage.getItem('cloudwatch_websites');
        if (saved) {
          const parsed: Website[] = JSON.parse(saved);
          const sites: WebsiteSecurity[] = parsed.map((w) => ({
            ...w, ssl: null, headers: null, loading: true, error: false, checkedAt: null,
          }));
          setWebsites(sites);
          setLoadingWebsites(false);
          for (const site of sites) {
            if (cancelled) break;
            await checkSecurity(site);
            await new Promise((r) => setTimeout(r, 500));
          }
        } else {
          setLoadingWebsites(false);
        }
      }
    };

    loadAndCheck();
    return () => { cancelled = true; };
  }, [checkSecurity]);

  const checkAll = useCallback(() => {
    websites.forEach((w, i) => {
      setTimeout(() => checkSecurity(w), i * 500);
    });
  }, [websites, checkSecurity]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
                Security Overview
              </h1>
              <p className="text-zinc-500 text-sm">SSL certificate & HTTP security headers — auto check saat halaman dibuka</p>
            </div>
            <button onClick={checkAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              <RefreshCw className="w-4 h-4" /> Check All
            </button>
          </div>

          <div className="space-y-6">
            {loadingWebsites ? (
              [1, 2, 3].map((i) => <div key={i} className="h-48 bg-zinc-900/50 border border-white/5 rounded-3xl animate-pulse" />)
            ) : websites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                <Globe className="w-10 h-10 text-zinc-700 mb-4" />
                <p className="text-zinc-500 font-medium">Belum ada website</p>
                <a href="/websites" className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest">
                  + Tambah Website dulu
                </a>
              </div>
            ) : websites.map((website, index) => {
              const score = website.ssl || website.headers ? getSecurityScore(website) : null;
              return (
                <motion.div key={website.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white">{website.name}</h3>
                          {/* Fix: pakai inline style untuk background — hindari dynamic class Tailwind */}
                          {score !== null && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(score)}`}
                              style={getScoreBadgeStyle(score)}
                            >
                              {getScoreLabel(score)} · {score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-mono">{website.url}</p>
                      </div>
                    </div>
                    <button onClick={() => checkSecurity(website)} disabled={website.loading}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50">
                      <RefreshCw className={`w-3.5 h-3.5 ${website.loading ? 'animate-spin' : ''}`} />
                      {website.loading ? 'Checking...' : 'Check'}
                    </button>
                  </div>

                  {website.loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {[1, 2].map((i) => <div key={i} className="h-32 bg-zinc-800/50 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : website.error ? (
                    <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <p className="text-sm font-bold text-rose-400">Gagal mengecek. Coba lagi.</p>
                    </div>
                  ) : website.ssl || website.headers ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* SSL */}
                      <div className="bg-zinc-800/40 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="w-4 h-4 text-zinc-400" />
                          <h4 className="font-bold text-white text-sm uppercase tracking-wider">SSL Certificate</h4>
                        </div>
                        {website.ssl ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">Status</span>
                              <div className="flex items-center gap-1.5">
                                {website.ssl.valid
                                  ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  : <XCircle className="w-4 h-4 text-rose-400" />}
                                <span className={`text-sm font-bold ${website.ssl.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {website.ssl.valid ? 'Valid' : 'Invalid'}
                                </span>
                              </div>
                            </div>
                            {website.ssl.daysLeft !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">Expires in</span>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                  <span className={`text-sm font-bold ${getSSLColor(website.ssl.daysLeft)}`}>{website.ssl.daysLeft} days</span>
                                </div>
                              </div>
                            )}
                            {website.ssl.expiresAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">Expiry date</span>
                                <span className="text-xs text-zinc-400 font-mono">{website.ssl.expiresAt}</span>
                              </div>
                            )}
                            {website.ssl.issuer && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-500">Issuer</span>
                                <span className="text-xs text-zinc-400">{website.ssl.issuer}</span>
                              </div>
                            )}
                            {website.ssl.daysLeft !== null && (
                              <div>
                                <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden mt-2">
                                  <div
                                    className={`h-full rounded-full ${getSSLBg(website.ssl.daysLeft)}`}
                                    style={{ width: `${Math.min(100, (website.ssl.daysLeft / 90) * 100)}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-1">dari 90 hari</p>
                              </div>
                            )}
                          </div>
                        ) : <p className="text-zinc-600 text-sm">Tidak tersedia</p>}
                      </div>

                      {/* Headers */}
                      <div className="bg-zinc-800/40 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-zinc-400" />
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Security Headers</h4>
                          </div>
                          {website.headers && (
                            <span className="text-xs text-zinc-500">
                              {Object.values(website.headers).filter(Boolean).length}/{Object.keys(website.headers).length} passed
                            </span>
                          )}
                        </div>
                        {website.headers ? (
                          <div className="space-y-2">
                            {(Object.keys(website.headers) as (keyof HeadersInfo)[]).map((key) => (
                              <div key={key} className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-bold text-zinc-300">{HEADER_LABELS[key]}</span>
                                  <p className="text-[10px] text-zinc-600">{HEADER_DESC[key]}</p>
                                </div>
                                {website.headers![key]
                                  ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                  : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-zinc-600 text-sm">Tidak tersedia</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-10 border border-dashed border-white/5 rounded-2xl gap-3">
                      <AlertTriangle className="w-4 h-4 text-zinc-600" />
                      <p className="text-zinc-600 text-sm">Sedang memuat data keamanan...</p>
                    </div>
                  )}

                  {website.checkedAt && !website.loading && (
                    <p className="text-[10px] text-zinc-600 mt-4 font-mono">
                      Last checked: {new Date(website.checkedAt).toLocaleString('id-ID')}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}