// PATH: components/ServerList.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Database,
  Globe,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { servers as mockServers, ServerData } from '@/lib/mockData'; // Fix: dari mockData bukan supabase

interface ServerListProps {
  onServerClick: (server: ServerData) => void;
}

function ServerListContent({ onServerClick }: ServerListProps) {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get('status') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const fetchServers = (showLoading = true) => {
    if (showLoading) setLoading(true);
    // Simulasi async fetch dari mockData
    setTimeout(() => {
      setServers(mockServers);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchServers(false);
  }, []);

  // Fix: mockData pakai field "ip" bukan "ip_address", "cpu" bukan "cpu_usage", dll
  const filteredServers = servers.filter((s) => {
    const matchesStatus =
      statusFilter === 'all' ? true : s.status.toLowerCase() === statusFilter;
    const matchesSearch =
      searchQuery === ''
        ? true
        : s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.ip.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xl font-bold text-white">Infrastructure</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchServers()}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredServers.length} Instances Active
          </span>
        </div>
      </div>

      {/* Desktop Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        <div className="col-span-4">Server Name</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Region</div>
        <div className="col-span-3">Usage (CPU/MEM)</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredServers.length > 0 ? (
          filteredServers.map((server) => (
            <motion.div
              key={server.id}
              whileHover={{ y: -2 }}
              onClick={() => onServerClick(server)}
              className={`group cursor-pointer bg-zinc-900/40 border border-white/5 rounded-2xl p-4 lg:px-6 transition-all duration-300 ${
                server.status === 'Online'
                  ? 'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  : 'hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Name & IP */}
                <div className="lg:col-span-4 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      server.status === 'Online'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {server.name}
                    </h4>
                    {/* Fix: field-nya "ip" bukan "ip_address" */}
                    <p className="text-xs text-zinc-500 font-mono">{server.ip}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="lg:col-span-2 flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      server.status === 'Online'
                        ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      server.status === 'Online' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {server.status}
                  </span>
                </div>

                {/* Region */}
                <div className="lg:col-span-2 flex items-center gap-2 text-zinc-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-xs">{server.region ?? 'Unknown'}</span>
                </div>

                {/* Usage - Fix: field "cpu" & "memory" bukan "cpu_usage" & "memory_usage" */}
                <div className="lg:col-span-3 flex items-center gap-6">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>CPU</span>
                      <span>{server.cpu ?? 0}%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${server.cpu ?? 0}%` }}
                        className={`h-full ${(server.cpu ?? 0) > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>MEM</span>
                      <span>{server.memory ?? 0}%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${server.memory ?? 0}%` }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="lg:col-span-1 flex justify-end">
                  <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
            <AlertCircle className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">Tidak ada server dalam status ini</p>
            <button
              onClick={() => router.push('?')}
              className="mt-4 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap Suspense karena useSearchParams butuh Suspense boundary
export default function ServerList({ onServerClick }: ServerListProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-900/50 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      }
    >
      <ServerListContent onServerClick={onServerClick} />
    </Suspense>
  );
}