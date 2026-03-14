// PATH: app/api/uptime/route.ts
import { NextRequest, NextResponse } from "next/server";
import { calculateUptime, calculateUptimeBatch } from "@/lib/uptime";

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get("websiteId");
  const websiteIds = req.nextUrl.searchParams.get("websiteIds");

  // Fix: clamp days antara 1-90 untuk mencegah query data terlalu banyak
  const rawDays = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const days = Math.min(Math.max(isNaN(rawDays) ? 30 : rawDays, 1), 90);

  if (websiteId) {
    const uptime = await calculateUptime(websiteId, days);
    return NextResponse.json({ websiteId, uptime, days });
  }

  if (websiteIds) {
    const ids = websiteIds.split(",").filter(Boolean);
    const uptimes = await calculateUptimeBatch(ids, days);
    return NextResponse.json({ uptimes, days });
  }

  return NextResponse.json(
    { error: "websiteId atau websiteIds diperlukan" },
    { status: 400 }
  );
}