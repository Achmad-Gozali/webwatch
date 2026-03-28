"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { Clock, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface WebsiteStat {
  id: string;
  name: string;
  url: string;
  status: string;
  responseTime: number | null;
  uptime: number;
}

interface LandingWebsiteTableProps {
  websites: WebsiteStat[];
}

function StatusIcon({ status }: { status: string }) {
  if (status === "online") return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "degraded") return <AlertCircle className="h-3.5 w-3.5 text-amber-400" />;
  if (status === "offline") return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
  return <div className="h-3.5 w-3.5 rounded-full bg-zinc-600" />;
}

function getStatusLabel(status: string) {
  if (status === "online") return "Aktif";
  if (status === "degraded") return "Terganggu";
  if (status === "offline") return "Tidak Aktif";
  return "—";
}

function getStatusColor(status: string) {
  if (status === "online") return "text-emerald-400";
  if (status === "degraded") return "text-amber-400";
  if (status === "offline") return "text-rose-400";
  return "text-zinc-500";
}

export default function LandingWebsiteTable({ websites }: LandingWebsiteTableProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative z-10 mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="mb-3 text-xs font-bold tracking-widest text-emerald-500 uppercase"
        >
          Langsung
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white lg:text-3xl"
        >
          Status terkini
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="mt-3 text-sm text-zinc-500"
        >
          Website yang sedang dipantau secara langsung dan berkelanjutan.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
        className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40"
      >
        <div className="hidden grid-cols-12 gap-4 border-b border-white/5 px-6 py-3 text-[10px] font-bold tracking-wider text-zinc-600 uppercase sm:grid">
          <div className="col-span-5">Website</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Respons</div>
          <div className="col-span-3">Uptime 30 Hari</div>
        </div>

        {websites.slice(0, 8).map((website, i) => (
          <motion.div
            key={website.id}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="grid grid-cols-1 gap-2 border-b border-white/5 px-6 py-4 transition-colors last:border-0 hover:bg-white/[0.02] sm:grid-cols-12 sm:gap-4"
          >
            <div className="flex min-w-0 items-center gap-3 sm:col-span-5">
              <div className={`h-2 w-2 shrink-0 rounded-full ${
                website.status === "online" ? "animate-pulse bg-emerald-500"
                : website.status === "offline" ? "bg-rose-500"
                : website.status === "degraded" ? "bg-amber-500"
                : "bg-zinc-600"
              }`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{website.name}</p>
                <p className="truncate font-mono text-xs text-zinc-600">{website.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:col-span-2">
              <StatusIcon status={website.status} />
              <span className={`text-xs font-bold ${getStatusColor(website.status)}`}>
                {getStatusLabel(website.status)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 sm:col-span-2">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-xs">
                {website.responseTime !== null ? `${website.responseTime}ms` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${website.uptime >= 99 ? "bg-emerald-500" : website.uptime >= 95 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${website.uptime}%` }}
                />
              </div>
              <span className={`shrink-0 font-mono text-xs ${website.uptime >= 99 ? "text-emerald-400" : website.uptime >= 95 ? "text-amber-400" : "text-rose-400"}`}>
                {website.uptime}%
              </span>
            </div>
          </motion.div>
        ))}

        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-xs text-zinc-600">{websites.length} website dipantau</p>
          <Link href="/dashboard" className="flex items-center gap-1 text-xs font-bold text-emerald-500 transition-colors hover:text-emerald-400">
            Lihat semua <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}