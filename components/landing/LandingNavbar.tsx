"use client";

import Image from "next/image";

export default function LandingNavbar() {
  return (
    <nav className="relative sticky top-0 z-10 flex items-center border-b border-white/5 bg-black/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-12">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logoweb.png"
          alt="WebWatch"
          width={52}
          height={52}
          className="object-contain"
        />
        <span className="text-lg font-bold text-white">WebWatch</span>
      </div>
    </nav>
  );
}