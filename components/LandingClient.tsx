"use client";

// PATH: components/LandingClient.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingStats from "@/components/landing/LandingStats";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingWebsiteTable from "@/components/landing/LandingWebsiteTable";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

interface WebsiteStat {
  id: string;
  name: string;
  url: string;
  status: string;
  responseTime: number | null;
  uptime: number;
}

interface LandingData {
  websites: WebsiteStat[];
  stats: {
    total: number;
    online: number;
    avgUptime: number;
    resolvedIncidents: number;
  };
}

export default function LandingClient({ data }: { data: LandingData }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(interval);
  }, [router]);

  const allOnline = data.websites.every((w) => w.status === "online" || w.status === "unknown");

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.07),transparent)]" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-950/20 blur-[100px]" />

      <LandingNavbar />
      <LandingHero totalWebsites={data.stats.total} onlineWebsites={data.stats.online} allOnline={allOnline} />
      <LandingStats total={data.stats.total} online={data.stats.online} avgUptime={data.stats.avgUptime} resolvedIncidents={data.stats.resolvedIncidents} />
      <LandingFeatures />
      <LandingWebsiteTable websites={data.websites} />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}