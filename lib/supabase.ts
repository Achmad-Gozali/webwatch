// PATH: lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fix: kasih warning yang jelas kalau env vars tidak ada
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[WebWatch] Supabase env vars tidak ditemukan.\n' +
    'Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diset di .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseKey ?? ''
);

// Types
export interface Website {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface MonitorLog {
  id: string;
  website_id: string;
  status: 'online' | 'offline' | 'degraded';
  response_time: number;
  checked_at: string;
}