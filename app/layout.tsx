// PATH: app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebWatch | Real-time Website Monitoring',
  description: 'Monitor uptime, SSL certificate, performance, dan keamanan website Anda secara real-time. Dapatkan notifikasi Telegram instan saat terjadi gangguan.',
  keywords: ['website monitoring', 'uptime monitor', 'SSL checker', 'real-time monitoring', 'WebWatch'],
  authors: [{ name: 'WebWatch' }],
  openGraph: {
    title: 'WebWatch | Real-time Website Monitoring',
    description: 'Monitor uptime, SSL certificate, performance, dan keamanan website Anda secara real-time.',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary',
    title: 'WebWatch | Real-time Website Monitoring',
    description: 'Monitor uptime, SSL certificate, performance, dan keamanan website Anda secara real-time.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-zinc-950 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}