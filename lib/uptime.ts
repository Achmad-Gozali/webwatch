// PATH: lib/uptime.ts
// Helper untuk hitung uptime akurat dari monitor_logs

import { supabase } from '@/lib/supabase';

/**
 * Hitung uptime % website dalam N hari terakhir
 * Rumus: (jumlah log 'online') / (total log) * 100
 */
export async function calculateUptime(
  websiteId: string,
  days: number = 30
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: logs, error } = await supabase
    .from('monitor_logs')
    .select('status')
    .eq('website_id', websiteId)
    .gte('checked_at', since.toISOString());

  if (error || !logs || logs.length === 0) return 100; // default kalau belum ada data

  const total = logs.length;
  const onlineCount = logs.filter((l) => l.status === 'online').length;

  return parseFloat(((onlineCount / total) * 100).toFixed(2));
}

/**
 * Hitung uptime untuk banyak website sekaligus (lebih efisien)
 */
export async function calculateUptimeBatch(
  websiteIds: string[],
  days: number = 30
): Promise<Record<string, number>> {
  if (websiteIds.length === 0) return {};

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: logs, error } = await supabase
    .from('monitor_logs')
    .select('website_id, status')
    .in('website_id', websiteIds)
    .gte('checked_at', since.toISOString());

  if (error || !logs || logs.length === 0) {
    // Default semua 100% kalau belum ada data
    return Object.fromEntries(websiteIds.map((id) => [id, 100]));
  }

  // Group logs per website_id
  const grouped: Record<string, { total: number; online: number }> = {};

  for (const log of logs) {
    if (!grouped[log.website_id]) {
      grouped[log.website_id] = { total: 0, online: 0 };
    }
    grouped[log.website_id].total++;
    if (log.status === 'online') grouped[log.website_id].online++;
  }

  // Hitung % per website
  const result: Record<string, number> = {};
  for (const id of websiteIds) {
    const g = grouped[id];
    if (!g || g.total === 0) {
      result[id] = 100; // belum ada data
    } else {
      result[id] = parseFloat(((g.online / g.total) * 100).toFixed(2));
    }
  }

  return result;
}

/**
 * Warna uptime berdasarkan persentase
 */
export function getUptimeColor(uptime: number): string {
  if (uptime >= 99) return 'text-emerald-400';
  if (uptime >= 95) return 'text-amber-400';
  return 'text-rose-400';
}

export function getUptimeBg(uptime: number): string {
  if (uptime >= 99) return 'bg-emerald-500';
  if (uptime >= 95) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function getUptimeLabel(uptime: number): string {
  if (uptime >= 99) return 'Excellent';
  if (uptime >= 95) return 'Good';
  if (uptime >= 90) return 'Fair';
  return 'Poor';
}