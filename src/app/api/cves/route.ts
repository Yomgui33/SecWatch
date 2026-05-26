import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated } from "@/lib/auth";
import { fetchCves, getDateRange } from "@/lib/sources/nvd/api";
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

    // L'API NVD peut retourner totalResults > 0 mais vulnerabilities: [] quand
    // les CVE très récents ne sont pas encore indexés ou en cas de throttling.
    // Dans ce cas on retourne une erreur explicite plutôt qu'un tableau vide trompeur.
    if (result.totalResults > 0 && result.cves.length === 0) {
      console.warn(`NVD returned totalResults=${result.totalResults} but empty vulnerabilities array (throttling or indexing delay).`);
      return NextResponse.json(
        { error: "L'API NVD a retourné des résultats vides. Réessayez dans quelques instants ou élargissez la plage de dates." },
        { status: 503 }
      );
    }

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
