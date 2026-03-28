'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShieldCheck, HelpCircle, Activity,
  ChevronRight, Globe, Zap, AlertTriangle, X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Zap, label: 'Performance', href: '/performance' },
  { icon: Activity, label: 'Monitoring', href: '/monitoring' },
  { icon: Globe, label: 'Websites', href: '/websites' },
  { icon: ShieldCheck, label: 'Security', href: '/security' },
  { icon: AlertTriangle, label: 'Incidents', href: '/incidents' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn('w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-screen sticky top-0', className)}>
      <div className="p-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logoweb.png"
              alt="WebWatch"
              width={52}
              height={52}
              className="object-contain group-hover:opacity-90 transition-opacity"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              WebWatch
            </h1>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} onClick={onClose}>
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
    </aside>
  );
}