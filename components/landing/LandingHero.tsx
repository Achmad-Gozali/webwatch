"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface LandingHeroProps {
  totalWebsites: number;
  onlineWebsites: number;
  allOnline: boolean;
}

export default function LandingHero({ allOnline }: LandingHeroProps) {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24 lg:pb-20">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5 text-3xl leading-tight font-bold text-white sm:text-5xl lg:text-6xl"
      >
        Pemantauan website{" "}
        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          secara real-time.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 lg:text-xl"
      >
        Pantau uptime, SSL, performa, dan keamanan seluruh website Anda dalam
        satu dasbor terpadu. Terima notifikasi Telegram secara instan saat
        terjadi gangguan.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-600"
        >
          Buka Dasbor
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/status"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-8 py-3.5 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
        >
          <div className={`h-2 w-2 rounded-full ${allOnline ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`} />
          Lihat Halaman Status
        </Link>
      </motion.div>
    </section>
  );
}