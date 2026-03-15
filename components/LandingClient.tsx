// PATH: components/LandingClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  Globe,
  Activity,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Bell,
} from "lucide-react";

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
    icon: <Activity className="h-5 w-5" />,
    title: "Uptime Monitoring",
    desc: "Pantau status website Anda setiap 5 menit. Deteksi gangguan sebelum pengguna melaporkannya.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Telegram Alert",
    desc: "Notifikasi langsung ke Telegram saat website mengalami gangguan atau kembali normal.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "SSL & Security",
    desc: "Cek SSL certificate, expiry date, dan 6 security headers sekaligus.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Performance Score",
    desc: "Lighthouse score untuk Performance, SEO, Accessibility, dan Best Practices.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Incident Tracking",
    desc: "Catat semua insiden otomatis lengkap dengan durasi dan timeline.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI Insights",
    desc: "Analisis cerdas kondisi website Anda menggunakan teknologi AI.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
];

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
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

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "online")
    return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "degraded")
    return <AlertCircle className="h-3.5 w-3.5 text-amber-400" />;
  if (status === "offline")
    return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
  return <div className="h-3.5 w-3.5 rounded-full bg-zinc-600" />;
}

function StatusColor(status: string) {
  if (status === "online") return "text-emerald-400";
  if (status === "degraded") return "text-amber-400";
  if (status === "offline") return "text-rose-400";
  return "text-zinc-500";
}

export default function LandingClient({ data }: { data: LandingData }) {
  const featuresRef = useRef(null);
  const websitesRef = useRef(null);
  const featuresInView = useInView(featuresRef, {
    once: true,
    margin: "-100px",
  });
  const websitesInView = useInView(websitesRef, {
    once: true,
    margin: "-100px",
  });

  // Auto-refresh data tiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const allOnline = data.websites.every(
    (w) => w.status === "online" || w.status === "unknown",
  );
  const offlineCount = data.websites.filter(
    (w) => w.status === "offline",
  ).length;
  const degradedCount = data.websites.filter(
    (w) => w.status === "degraded",
  ).length;

  const systemStatus =
    offlineCount > 0
      ? {
          label: "Partial Outage",
          short: "Outage",
          color: "text-rose-400",
          bg: "bg-rose-500/10 border-rose-500/20",
          dot: "bg-rose-500 animate-pulse",
        }
      : degradedCount > 0
        ? {
            label: "Degraded Performance",
            short: "Degraded",
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
            dot: "bg-amber-500 animate-pulse",
          }
        : {
            label: "All Systems Operational",
            short: "Operational",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
            dot: "bg-emerald-500 animate-pulse",
          };

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      {/* Grid background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />

      {/* Glow top */}
      <div className="pointer-events-none fixed top-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      {/* Navbar */}
      <nav className="relative sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">WebWatch</span>
        </div>
        <Link
          href="/status"
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all hover:opacity-80 ${systemStatus.bg}`}
        >
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${systemStatus.dot}`}
          />
          <span
            className={`hidden text-xs font-semibold sm:block ${systemStatus.color}`}
          >
            {systemStatus.label}
          </span>
          <span
            className={`text-xs font-semibold sm:hidden ${systemStatus.color}`}
          >
            {systemStatus.short}
          </span>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24 lg:pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400"
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {data.stats.online} dari {data.stats.total} website aktif dipantau
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5 text-3xl leading-tight font-bold text-white sm:text-5xl lg:text-6xl"
        >
          Real-time monitoring{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            for your website.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 lg:text-xl"
        >
          Pantau uptime, SSL, performa, dan keamanan semua website Anda dalam
          satu dashboard. Dapat notifikasi Telegram instan saat ada yang
          bermasalah.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-600"
          >
            Buka Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/status"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-8 py-3.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
          >
            <div
              className={`h-2 w-2 rounded-full ${allOnline ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`}
            />
            Lihat Status Page
          </Link>
        </motion.div>
      </section>

      {/* Live Stats */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Website Dipantau",
              value: data.stats.total,
              suffix: "",
              icon: <Globe className="h-4 w-4" />,
              color: "text-white",
            },
            {
              label: "Online Sekarang",
              value: data.stats.online,
              suffix: "",
              icon: <CheckCircle className="h-4 w-4" />,
              color: "text-emerald-400",
            },
            {
              label: "Avg Uptime",
              value: data.stats.avgUptime,
              suffix: "%",
              icon: <TrendingUp className="h-4 w-4" />,
              color: "text-blue-400",
            },
            {
              label: "Incident Resolved",
              value: data.stats.resolvedIncidents,
              suffix: "",
              icon: <AlertTriangle className="h-4 w-4" />,
              color: "text-amber-400",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 text-center transition-all hover:border-white/10"
            >
              <div className={`mb-2 flex justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <p className={`mb-1 text-3xl font-bold ${stat.color}`}>
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div className="mb-12 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="mb-3 text-xs font-bold tracking-widest text-emerald-500 uppercase"
          >
            Fitur
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white lg:text-3xl"
          >
            Semua yang Anda butuhkan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="mt-3 text-sm text-zinc-500"
          >
            Dari monitoring dasar hingga analisis AI, semua tersedia dalam satu
            platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="group rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all hover:border-white/10 hover:bg-zinc-900/60"
            >
              <div
                className={`h-9 w-9 rounded-xl ${f.bg} ${f.color} mb-4 flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                {f.icon}
              </div>
              <h3 className="mb-2 text-sm font-bold text-white">{f.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Website Preview */}
      <section
        ref={websitesRef}
        className="relative z-10 mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div className="mb-10 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={websitesInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="mb-3 text-xs font-bold tracking-widest text-emerald-500 uppercase"
          >
            Live
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={websitesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white lg:text-3xl"
          >
            Status real-time
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={websitesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="mt-3 text-sm text-zinc-500"
          >
            Website yang sedang dipantau secara real-time.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={websitesInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40"
        >
          {/* Table header */}
          <div className="hidden grid-cols-12 gap-4 border-b border-white/5 px-6 py-3 text-[10px] font-bold tracking-wider text-zinc-600 uppercase sm:grid">
            <div className="col-span-5">Website</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Response</div>
            <div className="col-span-3">Uptime 30d</div>
          </div>

          {data.websites.slice(0, 8).map((website, i) => (
            <motion.div
              key={website.id}
              initial={{ opacity: 0, x: -10 }}
              animate={websitesInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="grid grid-cols-1 gap-2 border-b border-white/5 px-6 py-4 transition-colors last:border-0 hover:bg-white/[0.02] sm:grid-cols-12 sm:gap-4"
            >
              {/* Name */}
              <div className="flex min-w-0 items-center gap-3 sm:col-span-5">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${website.status === "online" ? "animate-pulse bg-emerald-500" : website.status === "offline" ? "bg-rose-500" : website.status === "degraded" ? "bg-amber-500" : "bg-zinc-600"}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {website.name}
                  </p>
                  <p className="truncate font-mono text-xs text-zinc-600">
                    {website.url}
                  </p>
                </div>
              </div>
              {/* Status */}
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <StatusIcon status={website.status} />
                <span
                  className={`text-xs font-bold capitalize ${StatusColor(website.status)}`}
                >
                  {website.status === "unknown" ? "—" : website.status}
                </span>
              </div>
              {/* Response */}
              <div className="flex items-center gap-1.5 text-zinc-500 sm:col-span-2">
                <Clock className="h-3 w-3" />
                <span className="font-mono text-xs">
                  {website.responseTime !== null
                    ? `${website.responseTime}ms`
                    : "—"}
                </span>
              </div>
              {/* Uptime */}
              <div className="flex items-center gap-2 sm:col-span-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${website.uptime >= 99 ? "bg-emerald-500" : website.uptime >= 95 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${website.uptime}%` }}
                  />
                </div>
                <span
                  className={`shrink-0 font-mono text-xs ${website.uptime >= 99 ? "text-emerald-400" : website.uptime >= 95 ? "text-amber-400" : "text-rose-400"}`}
                >
                  {website.uptime}%
                </span>
              </div>
            </motion.div>
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-xs text-zinc-600">
              {data.websites.length} website dipantau
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-xs font-bold text-emerald-500 transition-colors hover:text-emerald-400"
            >
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-10 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]" />
          <div className="relative z-10">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20">
              <Globe className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white lg:text-3xl">
              Siap memantau website Anda?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-zinc-400">
              Tambahkan website Anda sekarang dan mulai pantau uptime, SSL,
              serta performa secara real-time.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/websites"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-600"
              >
                Tambah Website
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/status"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-8 py-3.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
              >
                Lihat Status Page
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-4 py-6 sm:px-6 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-5 text-xs text-zinc-600">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-zinc-400"
            >
              Dashboard
            </Link>
            <Link
              href="/status"
              className="transition-colors hover:text-zinc-400"
            >
              Status
            </Link>
            <Link
              href="/monitoring"
              className="transition-colors hover:text-zinc-400"
            >
              Monitoring
            </Link>
            <Link
              href="/help"
              className="transition-colors hover:text-zinc-400"
            >
              Help
            </Link>
          </div>
          <p className="text-xs text-zinc-700">
            © 2026 WebWatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
