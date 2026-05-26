import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { fetchCvesFromVulnCheck, isoToDate } from "@/lib/sources/vulncheck/api";
import { getDateRange } from "@/lib/sources/nvd/api";
import type { DateFilter } from "@/lib/sources/nvd/types";

export async function GET(request: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const params = request.nextUrl.searchParams;
  const dateFilter = (params.get("dateFilter") ?? "7d") as DateFilter;
  const customStart = params.get("customStart");
  const customEnd = params.get("customEnd");

  let pubStartDate: string | undefined;
  let pubEndDate: string | undefined;

  if (dateFilter === "custom" && customStart && customEnd) {
    pubStartDate = customStart; // déjà en YYYY-MM-DD depuis le date picker
    pubEndDate = customEnd;
  } else if (dateFilter !== "custom") {
    const range = getDateRange(dateFilter);
    pubStartDate = isoToDate(range.start);
    pubEndDate = isoToDate(range.end);
  }

  try {
    const result = await fetchCvesFromVulnCheck({
      pubStartDate,
      pubEndDate,
      limit: 100,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("VulnCheck API error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les données VulnCheck." },
      { status: 502 }
    );
  }
}
