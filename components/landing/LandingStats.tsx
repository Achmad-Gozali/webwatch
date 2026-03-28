"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { Globe, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";

interface LandingStatsProps {
  total: number;
  online: number;
  avgUptime: number;
  resolvedIncidents: number;
}

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

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingStats({ total, online, avgUptime, resolvedIncidents }: LandingStatsProps) {
  const stats = [
    { label: "Website Dipantau", value: total, suffix: "", icon: <Globe className="h-4 w-4" />, color: "text-white" },
    { label: "Aktif Sekarang", value: online, suffix: "", icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-400" },
    { label: "Rata-rata Uptime", value: avgUptime, suffix: "%", icon: <TrendingUp className="h-4 w-4" />, color: "text-blue-400" },
    { label: "Insiden Teratasi", value: resolvedIncidents, suffix: "", icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-400" },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
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
  );
}