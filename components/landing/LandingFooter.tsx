"use client";

import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 px-4 py-6 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-5 text-xs text-zinc-600">
          <Link href="/dashboard" className="transition-colors hover:text-zinc-400">Dasbor</Link>
          <Link href="/status" className="transition-colors hover:text-zinc-400">Status</Link>
          <Link href="/monitoring" className="transition-colors hover:text-zinc-400">Pemantauan</Link>
          <Link href="/help" className="transition-colors hover:text-zinc-400">Bantuan</Link>
        </div>
        <p className="text-xs text-zinc-700">© 2026 WebWatch. Seluruh hak dilindungi.</p>
      </div>
    </footer>
  );
}