// PATH: components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  HelpCircle,
  Activity,
  ChevronRight,
  Globe,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Zap, label: 'Performance', href: '/performance' },
  { icon: Activity, label: 'Monitoring', href: '/monitoring' },
  { icon: Globe, label: 'Websites', href: '/websites' },
  { icon: ShieldCheck, label: 'Security', href: '/security' },
  { icon: AlertTriangle, label: 'Incidents', href: '/incidents' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn('w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-screen sticky top-0', className)}>
      <div className="p-6 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform">
            <Globe className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            WebWatch
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href}>
              <motion.div whileHover={{ x: 4 }}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group cursor-pointer',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}>
                <div className="flex items-center gap-3">
                  <item.icon className={cn('w-5 h-5', isActive ? 'text-emerald-400' : 'group-hover:text-white')} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">System Status</span>
          </div>
          <p className="text-sm text-white font-medium">All systems operational</p>
          <div className="mt-3 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}