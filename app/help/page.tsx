// PATH: app/help/page.tsx
'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Globe, Activity, Zap, ShieldCheck, LayoutDashboard, ChevronDown } from 'lucide-react';

interface DocSection {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: { q: string; a: string }[];
}

const docs: DocSection[] = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: 'Dashboard',
    color: 'text-blue-400',
    items: [
      { q: 'Apa yang ditampilkan di Dashboard?', a: 'Dashboard menampilkan ringkasan semua website yang lo monitor — status online/offline, response time terakhir, SSL validity, dan uptime. Klik kartu website untuk lihat detail lebih lanjut di halaman Websites.' },
      { q: 'Apa arti status Online, Offline, dan Degraded?', a: 'Online = website merespons normal (HTTP 2xx). Degraded = website merespons tapi ada masalah (HTTP 3xx/4xx/5xx). Offline = website tidak bisa diakses sama sekali.' },
    ],
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Websites',
    color: 'text-emerald-400',
    items: [
      { q: 'Cara tambah website?', a: 'Klik tombol "+ Add Website" di pojok kanan atas, masukkan nama dan URL website (harus diawali https://), lalu klik Add. Website langsung muncul di list.' },
      { q: 'Cara cek status website?', a: 'Klik tombol refresh di sebelah kanan tiap website, atau klik "Refresh All" untuk cek semua sekaligus. Proses cek butuh beberapa detik.' },
      { q: 'Data website disimpen di mana?', a: 'Data website disimpen di localStorage browser lo. Artinya data hanya ada di browser ini — kalau buka di browser/device lain, lo perlu tambah ulang websitenya.' },
      { q: 'Cara hapus website?', a: 'Klik ikon tempat sampah di sebelah kanan website yang mau dihapus.' },
    ],
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Monitoring',
    color: 'text-purple-400',
    items: [
      { q: 'Apa itu Response Time Monitor?', a: 'Fitur ini mengukur seberapa cepat website lo merespons request — dalam satuan milidetik (ms). Makin kecil angkanya, makin cepat website lo.' },
      { q: 'Apa arti warna di response time?', a: 'Hijau (<300ms) = cepat. Kuning (300-800ms) = sedang. Merah (>800ms) = lambat. Website di Vercel free tier biasanya di kisaran 400-900ms karena cold start.' },
      { q: 'Apa itu Auto (30s)?', a: 'Kalau diaktifkan, WebWatch akan otomatis cek response time semua website setiap 30 detik. Auto refresh berhenti kalau lo tutup atau pindah halaman.' },
    ],
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Performance',
    color: 'text-amber-400',
    items: [
      { q: 'Apa itu Lighthouse Score?', a: 'Skor dari Google PageSpeed Insights (0-100) yang mengukur kualitas website dari 4 aspek: Performance (kecepatan), Accessibility (aksesibilitas), SEO, dan Best Practices.' },
      { q: 'Bedanya Desktop vs Mobile?', a: 'Google menganalisis website dari dua perspektif berbeda — Desktop biasanya skornya lebih tinggi. Mobile lebih strict karena mensimulasikan koneksi dan perangkat yang lebih terbatas.' },
      { q: 'Kenapa analisis lama?', a: 'Google PageSpeed API butuh waktu 15-30 detik karena mereka benar-benar me-load dan menganalisis website lo dari server mereka. Ini normal dan tidak bisa dipercepat.' },
    ],
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Security',
    color: 'text-rose-400',
    items: [
      { q: 'Apa itu SSL Certificate?', a: 'SSL memastikan koneksi antara pengunjung dan website lo terenkripsi (HTTPS). Kalau SSL expired, browser akan menampilkan peringatan "Not Secure" ke pengunjung.' },
      { q: 'Apa itu Security Headers?', a: 'Header HTTP tambahan yang memberikan instruksi keamanan ke browser pengunjung. Ada 6 header yang dicek: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, dan Permissions-Policy.' },
      { q: 'Security Score dihitung dari mana?', a: 'Score 0-100 dihitung dari: SSL valid (+40), SSL >30 hari lagi expired (+10), dan jumlah security headers yang passed (masing-masing ~8 poin). Score 80+ = Secure.' },
    ],
  },
];

function DocCard({ section }: { section: DocSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 lg:p-5 border-b border-white/5">
        <div className={`w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center ${section.color}`}>
          {section.icon}
        </div>
        <h2 className="font-bold text-white">{section.title}</h2>
      </div>
      <div>
        {section.items.map((item, i) => (
          <div key={i} className="border-b border-white/5 last:border-0">
            <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors active:bg-white/5">
              <span className="text-sm font-medium text-zinc-200 pr-3">{item.q}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar
        className={`fixed lg:sticky lg:flex z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        onClose={() => setSidebarOpen(false)}
      />
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 lg:p-8 max-w-2xl mx-auto w-full space-y-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-emerald-500" />
              Help & Docs
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Panduan penggunaan fitur WebWatch</p>
          </div>
          {docs.map((section) => <DocCard key={section.title} section={section} />)}
        </div>
      </main>
    </div>
  );
}