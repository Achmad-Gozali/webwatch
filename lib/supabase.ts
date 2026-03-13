import { createClient } from '@supabase/supabase-js';

// Interface untuk data server sesuai request
export interface ServerData {
  id: string;
  name: string;
  ip_address: string;
  status: 'Online' | 'Offline';
  os: string;
  uptime: string;
  cpu_usage?: number;
  memory_usage?: number;
  region?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzdummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

// Inisialisasi Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
