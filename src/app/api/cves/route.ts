import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import {
  fetchCvesPublishedBetween,
  getPublishedRange,
  parseCustomRange,
} from "@/lib/sources/vulncheck/api";
import type { DateFilter } from "@/lib/sources/nvd/types";

const PRESETS: DateFilter[] = ["24h", "7d", "30d"];

export async function GET(request: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const params = request.nextUrl.searchParams;
  const requested = params.get("dateFilter");
  const dateFilter: DateFilter =
    requested === "custom" || PRESETS.includes(requested as DateFilter)
      ? (requested as DateFilter)
      : "7d";

  let range;
  if (dateFilter === "custom") {
    const customStart = params.get("customStart");
    const customEnd = params.get("customEnd");
    range = customStart && customEnd ? parseCustomRange(customStart, customEnd) : null;
    if (!range) {
      return NextResponse.json(
        { error: "Plage personnalisée invalide : indiquez une date de début et de fin." },
        { status: 400 }
      );
    }
  } else {
    range = getPublishedRange(dateFilter as "24h" | "7d" | "30d");
  }

  try {
    const result = await fetchCvesPublishedBetween(range);

    return NextResponse.json(
      { ...result, range },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("VulnCheck API error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les données VulnCheck." },
      { status: 502 }
    );
  }
}
