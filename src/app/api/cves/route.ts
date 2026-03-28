import { NextRequest, NextResponse } from "next/server";
import { fetchCves, getDateRange } from "@/lib/sources/nvd/api";
import type { DateFilter } from "@/lib/sources/nvd/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dateFilter = (params.get("dateFilter") ?? "7d") as DateFilter;
  const customStart = params.get("customStart");
  const customEnd = params.get("customEnd");

  let pubStartDate: string | undefined;
  let pubEndDate: string | undefined;

  if (dateFilter === "custom" && customStart && customEnd) {
    pubStartDate = new Date(customStart).toISOString();
    pubEndDate = new Date(customEnd + "T23:59:59").toISOString();
  } else if (dateFilter !== "custom") {
    const range = getDateRange(dateFilter);
    pubStartDate = range.start;
    pubEndDate = range.end;
  }

  try {
    const result = await fetchCves({
      pubStartDate,
      pubEndDate,
      resultsPerPage: 100,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("NVD API error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les données NVD." },
      { status: 502 }
    );
  }
}
