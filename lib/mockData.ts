export interface Server {
  id: string;
  name: string;
  status: 'Online' | 'Offline';
  ip: string;
  region: string;
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
}

// Alias agar kompatibel dengan import ServerData dari komponen lain
export type ServerData = Server;

export const servers: Server[] = [
  {
    id: '1',
    name: 'Production-Web-01',
    status: 'Online',
    ip: '192.168.1.10',
    region: 'US-East (N. Virginia)',
    cpu: 45,
    memory: 62,
    storage: 78,
    uptime: '15d 4h 22m',
  },
  {
    id: '2',
    name: 'Database-Primary',
    status: 'Online',
    ip: '192.168.1.20',
    region: 'US-West (Oregon)',
    cpu: 22,
    memory: 85,
    storage: 45,
    uptime: '42d 12h 5m',
  },
  {
    id: '3',
    name: 'Auth-Service-Node',
    status: 'Offline',
    ip: '192.168.1.30',
    region: 'EU-West (Ireland)',
    cpu: 0,
    memory: 0,
    storage: 12,
    uptime: '0d 0h 0m',
  },
  {
    id: '4',
    name: 'Storage-Bucket-S3',
    status: 'Online',
    ip: '10.0.0.55',
    region: 'AP-Southeast (Singapore)',
    cpu: 12,
    memory: 30,
    storage: 92,
    uptime: '120d 2h 10m',
  },
  {
    id: '5',
    name: 'Cache-Redis-Cluster',
    status: 'Online',
    ip: '10.0.0.60',
    region: 'US-East (N. Virginia)',
    cpu: 68,
    memory: 40,
    storage: 15,
    uptime: '5d 18h 30m',
  },
];

export const cpuHistory = [
  { time: '00:00', usage: 30 },
  { time: '04:00', usage: 45 },
  { time: '08:00', usage: 60 },
  { time: '12:00', usage: 85 },
  { time: '16:00', usage: 55 },
  { time: '20:00', usage: 40 },
  { time: '23:59', usage: 35 },
];

export const storageData = [
  { name: 'Used', value: 750, fill: '#10b981' },
  { name: 'Free', value: 250, fill: '#334155' },
];