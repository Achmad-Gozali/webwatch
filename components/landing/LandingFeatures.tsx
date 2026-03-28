"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Activity, Bell, ShieldCheck, Zap, AlertTriangle, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Pemantauan Uptime",
    desc: "Pantau status website Anda setiap 5 menit. Deteksi gangguan sebelum pengguna melaporkannya.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Notifikasi Telegram",
    desc: "Terima notifikasi langsung ke Telegram saat website mengalami gangguan atau kembali normal.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "SSL & Keamanan",
    desc: "Periksa sertifikat SSL, tanggal kedaluwarsa, dan 6 security headers secara bersamaan.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Skor Performa",
    desc: "Skor Lighthouse untuk Performa, SEO, Aksesibilitas, dan Praktik Terbaik.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Pelacakan Insiden",
    desc: "Catat seluruh insiden secara otomatis lengkap dengan durasi dan linimasa kejadian.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Analisis AI",
    desc: "Dapatkan analisis cerdas kondisi website Anda menggunakan teknologi kecerdasan buatan.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
];

export default function LandingFeatures() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="mb-3 text-xs font-bold tracking-widest text-emerald-500 uppercase"
        >
          Fitur
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white lg:text-3xl"
        >
          Semua yang Anda butuhkan
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="mt-3 text-sm text-zinc-500"
        >
          Dari pemantauan dasar hingga analisis berbasis AI, semua tersedia dalam satu platform.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="group rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all hover:border-white/10 hover:bg-zinc-900/60"
          >
            <div className={`h-9 w-9 rounded-xl ${f.bg} ${f.color} mb-4 flex items-center justify-center transition-transform group-hover:scale-110`}>
              {f.icon}
            </div>
            <h3 className="mb-2 text-sm font-bold text-white">{f.title}</h3>
            <p className="text-xs leading-relaxed text-zinc-500">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}