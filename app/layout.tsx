import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebWatch | Website Monitoring Dashboard',
  description: 'Monitor uptime, response time, dan performa website kamu secara realtime.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}