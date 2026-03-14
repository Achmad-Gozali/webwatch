// PATH: app/api/uptime/route.ts
// API route untuk ambil uptime akurat dari monitor_logs

import { NextRequest, NextResponse } from "next/server";
import { calculateUptime, calculateUptimeBatch } from "@/lib/uptime";

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get("websiteId");
  const websiteIds = req.nextUrl.searchParams.get("websiteIds"); // comma-separated
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

  // Single website
  if (websiteId) {
    const uptime = await calculateUptime(websiteId, days);
    return NextResponse.json({ websiteId, uptime, days });
  }

  // Batch websites
  if (websiteIds) {
    const ids = websiteIds.split(",").filter(Boolean);
    const uptimes = await calculateUptimeBatch(ids, days);
    return NextResponse.json({ uptimes, days });
  }

  return NextResponse.json(
    { error: "websiteId atau websiteIds diperlukan" },
    { status: 400 },
  );
}
