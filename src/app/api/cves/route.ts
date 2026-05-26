import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { fetchCvesFromVulnCheck, getLastModRange } from "@/lib/sources/vulncheck/api";
import type { DateFilter } from "@/lib/sources/nvd/types";

export async function GET(request: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const params = request.nextUrl.searchParams;
  const dateFilter = (params.get("dateFilter") ?? "7d") as DateFilter;
  const customStart = params.get("customStart");
  const customEnd = params.get("customEnd");

  let fetchOptions: Parameters<typeof fetchCvesFromVulnCheck>[0] = { limit: 100 };

  if (dateFilter === "custom" && customStart && customEnd) {
    // Mode custom : on filtre par date de publication (le choix est explicite)
    fetchOptions = { ...fetchOptions, pubStartDate: customStart, pubEndDate: customEnd };
  } else if (dateFilter !== "custom") {
    // Filtres prédéfinis : on utilise lastModified décalé de 2j pour obtenir
    // uniquement des CVEs ayant déjà reçu leur score CVSS.
    const range = getLastModRange(dateFilter);
    fetchOptions = { ...fetchOptions, lastModStartDate: range.start, lastModEndDate: range.end };
  }

  try {
    const result = await fetchCvesFromVulnCheck(fetchOptions);

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
