// PATH: components/LandingClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import Link from 'next/link';
import {
  Globe, Activity, ShieldCheck, Zap, AlertTriangle,
  Sparkles, ArrowRight, CheckCircle, XCircle, AlertCircle,
  Clock, TrendingUp, Bell,
} from 'lucide-react';

interface WebsiteStat {
  id: string;
  name: string;
  url: string;
  status: string;
  responseTime: number | null;
  uptime: number;
}

interface LandingData {
  websites: WebsiteStat[];
  stats: {
    total: number;
    online: number;
    avgUptime: number;
    resolvedIncidents: number;
  };
}

const features = [
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Uptime Monitoring',
    desc: 'Pantau status website Anda setiap 5 menit. Deteksi gangguan sebelum pengguna melaporkannya.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Telegram Alert',
    desc: 'Notifikasi langsung ke Telegram saat website mengalami gangguan atau kembali normal.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'SSL & Security',
    desc: 'Cek SSL certificate, expiry date, dan 6 security headers sekaligus.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Performance Score',
    desc: 'Lighthouse score untuk Performance, SEO, Accessibility, dan Best Practices.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Incident Tracking',
    desc: 'Catat semua insiden otomatis lengkap dengan durasi dan timeline.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI Insights',
    desc: 'Analisis cerdas kondisi website Anda menggunakan teknologi AI.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
];

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'online') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === 'degraded') return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
  if (status === 'offline') return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  return <div className="w-3.5 h-3.5 rounded-full bg-zinc-600" />;
}

function StatusColor(status: string) {
  if (status === 'online') return 'text-emerald-400';
  if (status === 'degraded') return 'text-amber-400';
  if (status === 'offline') return 'text-rose-400';
  return 'text-zinc-500';
}

export default function LandingClient({ data }: { data: LandingData }) {
  const featuresRef = useRef(null);
  const websitesRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const websitesInView = useInView(websitesRef, { once: true, margin: '-100px' });

  // Auto-refresh data tiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const allOnline = data.websites.every((w) => w.status === 'online' || w.status === 'unknown');
  const offlineCount = data.websites.filter((w) => w.status === 'offline').length;
  const degradedCount = data.websites.filter((w) => w.status === 'degraded').length;

  const systemStatus = offlineCount > 0
    ? { label: 'Partial Outage', short: 'Outage', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500 animate-pulse' }
    : degradedCount > 0
    ? { label: 'Degraded Performance', short: 'Degraded', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500 animate-pulse' }
    : { label: 'All Systems Operational', short: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse' };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />

      {/* Glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">WebWatch</span>
        </div>
        <Link href="/status"
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all hover:opacity-80 ${systemStatus.bg}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${systemStatus.dot}`} />
          <span className={`text-xs font-semibold hidden sm:block ${systemStatus.color}`}>
            {systemStatus.label}
          </span>
          <span className={`text-xs font-semibold sm:hidden ${systemStatus.color}`}>
            {systemStatus.short}
          </span>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {data.stats.online} dari {data.stats.total} website aktif dipantau
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
          Real-time monitoring{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">for your website.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-zinc-400 text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Pantau uptime, SSL, performa, dan keamanan semua website Anda dalam satu dashboard.
          Dapat notifikasi Telegram instan saat ada yang bermasalah.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard"
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/25 text-sm">
            Buka Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/status"
            className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-bold rounded-xl transition-all text-sm">
            <div className={`w-2 h-2 rounded-full ${allOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            Lihat Status Page
          </Link>
        </motion.div>
      </section>

      {/* Live Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Website Dipantau', value: data.stats.total, suffix: '', icon: <Globe className="w-4 h-4" />, color: 'text-white' },
            { label: 'Online Sekarang', value: data.stats.online, suffix: '', icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400' },
            { label: 'Avg Uptime', value: data.stats.avgUptime, suffix: '%', icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-400' },
            { label: 'Incident Resolved', value: data.stats.resolvedIncidents, suffix: '', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
              className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 text-center hover:border-white/10 transition-all">
              <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className={`text-3xl font-bold mb-1 ${stat.color}`}>
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <motion.p initial={{ opacity: 0 }} animate={featuresInView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}
            className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Fitur</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            className="text-2xl lg:text-3xl font-bold text-white">Semua yang Anda butuhkan</motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
            className="text-zinc-500 mt-3 text-sm">Dari monitoring dasar hingga analisis AI, semua tersedia dalam satu platform.</motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-zinc-900/60 transition-all group">
              <div className={`w-9 h-9 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Website Preview */}
      <section ref={websitesRef} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-10">
          <motion.p initial={{ opacity: 0 }} animate={websitesInView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}
            className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Live</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={websitesInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            className="text-2xl lg:text-3xl font-bold text-white">Status real-time</motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={websitesInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
            className="text-zinc-500 mt-3 text-sm">Website yang sedang dipantau secara real-time.</motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={websitesInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
          className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
            <div className="col-span-5">Website</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Response</div>
            <div className="col-span-3">Uptime 30d</div>
          </div>

          {data.websites.slice(0, 8).map((website, i) => (
            <motion.div key={website.id}
              initial={{ opacity: 0, x: -10 }}
              animate={websitesInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              {/* Name */}
              <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${website.status === 'online' ? 'bg-emerald-500 animate-pulse' : website.status === 'offline' ? 'bg-rose-500' : website.status === 'degraded' ? 'bg-amber-500' : 'bg-zinc-600'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{website.name}</p>
                  <p className="text-xs text-zinc-600 font-mono truncate">{website.url}</p>
                </div>
              </div>
              {/* Status */}
              <div className="sm:col-span-2 flex items-center gap-1.5">
                <StatusIcon status={website.status} />
                <span className={`text-xs font-bold capitalize ${StatusColor(website.status)}`}>
                  {website.status === 'unknown' ? '—' : website.status}
                </span>
              </div>
              {/* Response */}
              <div className="sm:col-span-2 flex items-center gap-1.5 text-zinc-500">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono">
                  {website.responseTime !== null ? `${website.responseTime}ms` : '—'}
                </span>
              </div>
              {/* Uptime */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${website.uptime >= 99 ? 'bg-emerald-500' : website.uptime >= 95 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${website.uptime}%` }}
                  />
                </div>
                <span className={`text-xs font-mono shrink-0 ${website.uptime >= 99 ? 'text-emerald-400' : website.uptime >= 95 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {website.uptime}%
                </span>
              </div>
            </motion.div>
          ))}

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-zinc-600">{data.websites.length} website dipantau</p>
            <Link href="/dashboard" className="text-xs text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              Siap memantau website Anda?
            </h2>
            <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Tambahkan website Anda sekarang dan mulai pantau uptime, SSL, serta performa secara real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/websites"
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/25 text-sm">
                Tambah Website
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/status"
                className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-bold rounded-xl transition-all text-sm">
                Lihat Status Page
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-4 sm:px-6 lg:px-12 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-5 text-xs text-zinc-600">
            <Link href="/dashboard" className="hover:text-zinc-400 transition-colors">Dashboard</Link>
            <Link href="/status" className="hover:text-zinc-400 transition-colors">Status</Link>
            <Link href="/monitoring" className="hover:text-zinc-400 transition-colors">Monitoring</Link>
            <Link href="/help" className="hover:text-zinc-400 transition-colors">Help</Link>
          </div>
          <p className="text-xs text-zinc-700">© 2026 WebWatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}