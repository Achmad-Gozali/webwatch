// PATH: app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  // WAJIB: Biar semua link relatif di metadata ngarah ke domain baru lu
  metadataBase: new URL('https://agcode.biz.id'), 
  
  title: {
    default: 'WebWatch | Real-time Website Monitoring',
    template: '%s | WebWatch'
  },
  description: 'Monitor uptime, SSL certificate, performance, dan keamanan website Anda secara real-time. Dapatkan notifikasi Telegram instan saat terjadi gangguan.',
  keywords: ['website monitoring', 'uptime monitor', 'SSL checker', 'real-time monitoring', 'WebWatch', 'Achmad Gozali', 'AG Code', 'UNPAM Informatics'],
  authors: [{ name: 'Achmad Gozali', url: 'https://agcode.biz.id' }],
  creator: 'Achmad Gozali',
  
  // Mencegah duplikat konten antara domain .vercel.app dan .biz.id
  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'WebWatch | Real-time Website Monitoring',
    description: 'Monitor uptime, SSL certificate, performance, dan keamanan website Anda secara real-time.',
    url: 'https://agcode.biz.id',
    siteName: 'WebWatch',
    images: [
      {
        url: '/favicon.svg', // Sebaiknya nanti lu bikin og-image.png khusus biar cakep
        width: 1200,
        height: 630,
        alt: 'WebWatch Preview',
      },
    ],
    type: 'website',
    locale: 'id_ID',
  },
  
  twitter: {
    card: 'summary_large_image',
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