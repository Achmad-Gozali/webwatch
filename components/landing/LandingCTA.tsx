"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";

export default function LandingCTA() {
  return (
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
            serta performa secara langsung dan berkelanjutan.
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
              Lihat Halaman Status
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}