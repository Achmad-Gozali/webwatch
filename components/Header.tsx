'use client';

// PATH: components/Header.tsx
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Bell, Menu, ChevronRight, X, CheckCircle, XCircle, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface HeaderProps { onMenuClick: () => void; }
interface Notification { id: string; text: string; time: string; type: 'success' | 'error' | 'warning' | 'info'; }

const NOTIF_KEY = 'webwatch_notifications';
const PROFILE_KEY = 'webwatch_profile';
const STORAGE_KEY = 'cloudwatch_websites';

function NotifDropdown({ notifications, onClear, onClose, bellRef }: {
  notifications: Notification[];
  onClear: () => void;
  onClose: () => void;
  bellRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState({ top: 80, right: 16 });

  useEffect(() => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [bellRef]);

  const getIcon = (type: string) => {
    if (type === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />;
    if (type === 'error') return <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
    if (type === 'warning') return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
    return <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />;
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{ position: 'fixed', top: pos.top, right: pos.right }}
        className="w-80 max-w-[calc(100vw-1rem)] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[999]"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h4 className="text-sm font-bold text-white">Notifications</h4>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{notifications.length} notif</span>
                <button onClick={onClear} className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-wider">Hapus</button>
              </>
            )}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? notifications.map((n) => (
            <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <div className="flex gap-3">
                {getIcon(n.type)}
                <div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{n.text}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">{n.time}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-white">Semua aman</p>
              <p className="text-xs text-zinc-500 mt-1">Tidak ada notifikasi. Semua website berjalan normal.</p>
            </div>
          )}
        </div>
      </motion.div>
    </>,
    document.body
  );
}

function HeaderContent({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') ?? 'all';

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [profileName, setProfileName] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const prevStatusesRef = useRef<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) setProfileName(JSON.parse(saved).name || '');
    const handleProfile = () => {
      const s = localStorage.getItem(PROFILE_KEY);
      if (s) setProfileName(JSON.parse(s).name || '');
    };
    window.addEventListener('webwatch-profile-updated', handleProfile);
    return () => window.removeEventListener('webwatch-profile-updated', handleProfile);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(NOTIF_KEY);
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const newNotif: Notification = { ...notif, id: Date.now().toString() };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, 20);
      localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const checkStatuses = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const sites = JSON.parse(raw);
      sites.forEach((site: { id: string; name: string; status?: string; responseTime?: number }) => {
        const curr = site.status;
        const prev = prevStatusesRef.current[site.id];
        if (!curr || curr === 'checking...') return;
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        if (prev && prev !== curr) {
          if (curr === 'offline') addNotification({ text: `${site.name} tidak dapat diakses`, time, type: 'error' });
          else if (curr === 'online' && prev === 'offline') addNotification({ text: `${site.name} kembali online`, time, type: 'success' });
          else if (curr === 'degraded') addNotification({ text: `${site.name} mengalami gangguan`, time, type: 'warning' });
        }
        if (curr === 'online' && site.responseTime && site.responseTime > 800 && prev === curr) {
          addNotification({ text: `${site.name} response time lambat (${site.responseTime}ms)`, time, type: 'warning' });
        }
        prevStatusesRef.current[site.id] = curr;
      });
    };

    // Fix: naikkan interval dari 3s ke 15s — kurangi pembacaan & parsing localStorage
    const interval = setInterval(checkStatuses, 15000);
    checkStatuses();
    return () => clearInterval(interval);
  }, [addNotification]);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(NOTIF_KEY);
  };

  const initials = profileName
    ? profileName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'W';

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('q', val.toLowerCase()); else params.delete('q');
    router.push(`?${params.toString()}`);
  };

  const routeLabels: Record<string, string> = {
    'cloud-services': 'Performance',
    'performance': 'Performance',
    'dashboard': 'Overview',
    'help': 'Help',
  };

  const getBreadcrumbs = () => {
    if (pathname === '/' || pathname === '/dashboard') return ['Dashboard', 'Overview'];
    const parts = pathname.split('/').filter(Boolean);
    return ['Dashboard', ...parts.map((p) => routeLabels[p] ?? p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '))];
  };

  const handleFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = status.toLowerCase();
    if (val === 'all') params.delete('status'); else params.set('status', val);
    router.push(`/dashboard?${params.toString()}`);
  };

  const isFilterActive = (f: string) =>
    f === 'All' ? currentStatus === 'all' : currentStatus === f.toLowerCase();

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-[100] px-4 lg:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-zinc-400">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <span className={index === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-zinc-500'}>{crumb}</span>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-700" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {pathname === '/' && (
          <div className="hidden sm:flex items-center bg-zinc-900 border border-white/5 rounded-full p-1">
            {(['All', 'Online', 'Offline'] as string[]).map((f) => (
              <button key={f} onClick={() => handleFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isFilterActive(f) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input initial={{ width: 0, opacity: 0 }} animate={{ width: 160, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                  type="text" placeholder="Search..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 mr-2" autoFocus />
              )}
            </AnimatePresence>
            <button onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2.5 bg-zinc-900 border border-white/5 rounded-xl transition-colors ${isSearchOpen ? 'text-emerald-400 border-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}>
              {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <button
              ref={bellRef}
              onClick={() => setIsNotifOpen((v) => !v)}
              className={`p-2.5 bg-zinc-900 border border-white/5 rounded-xl transition-colors relative ${isNotifOpen ? 'text-emerald-400 border-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}>
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[9px] font-bold text-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && mounted && (
                <NotifDropdown
                  notifications={notifications}
                  onClear={clearNotifications}
                  onClose={() => setIsNotifOpen(false)}
                  bellRef={bellRef}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-white/5" />

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/10">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <Suspense fallback={<div className="h-16 border-b border-white/5 bg-zinc-950/80" />}>
      <HeaderContent onMenuClick={onMenuClick} />
    </Suspense>
  );
}