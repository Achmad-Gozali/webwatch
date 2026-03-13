'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServerData } from '@/lib/mockData'; // Fix: import dari mockData, bukan supabase
import CpuChart from './Charts/CpuChart';
import StorageChart from './Charts/StorageChart';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: ServerData | null;
}

export default function Modal({ isOpen, onClose, server }: ModalProps) {
  if (!server) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-4 top-20 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl z-[60] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-bold text-white">{server.name}</h3>
                <p className="text-sm text-zinc-500 font-mono">{server.ip}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status</p>
                  <p
                    className={`text-sm font-bold ${
                      server.status === 'Online' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {server.status}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Uptime</p>
                  <p className="text-sm font-bold text-white">{server.uptime}</p>
                </div>
              </div>

              <div className="space-y-6">
                <CpuChart />
                <StorageChart />
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}