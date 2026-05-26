"use client";

import { useState, useEffect, useCallback } from "react";
import type { CveEntry, CveFilters as FiltersType, CveSeverity } from "@/lib/sources/nvd/types";
import { SEVERITY_CONFIG } from "@/lib/severity";
import CveFilters from "./CveFilters";
import CveList from "./CveList";

const ALL_SEVERITIES: CveSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"];

export default function CveDashboard() {
  const [filters, setFilters] = useState<FiltersType>({
    severities: ["CRITICAL", "HIGH"],
    dateFilter: "7d",
    sortBy: "date",
  });
  const [allCves, setAllCves] = useState<CveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ dateFilter: filters.dateFilter });
    if (filters.dateFilter === "custom") {
      if (filters.customStart) params.set("customStart", filters.customStart);
      if (filters.customEnd) params.set("customEnd", filters.customEnd);
    }

    try {
      const res = await fetch(`/api/cves?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur serveur");
      }
      const data = await res.json();
      setAllCves(data.cves ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("vides")
          ? "L'API NVD ne répond pas encore pour cette plage de dates (indexation en cours). Essayez 7j ou 30j."
          : "Impossible de charger les CVE. Réessayez dans quelques instants."
      );
    } finally {
      setLoading(false);
    }
  }, [filters.dateFilter, filters.customStart, filters.customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage local par sévérité
  const filtered = allCves
    .filter((cve) => filters.severities.includes(cve.severity))
    .sort((a, b) => {
      if (filters.sortBy === "date") {
        return new Date(b.published).getTime() - new Date(a.published).getTime();
      }
      // Tri par criticité : sévérité desc, puis score desc, puis date desc
      const sevDiff = SEVERITY_CONFIG[a.severity].order - SEVERITY_CONFIG[b.severity].order;
      if (sevDiff !== 0) return sevDiff;
      if (b.score !== null && a.score !== null) return b.score - a.score;
      return new Date(b.published).getTime() - new Date(a.published).getTime();
    });

  return (
    <div className="space-y-6">
      <CveFilters filters={filters} onChange={setFilters} totalResults={filtered.length} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-surface-alt rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-surface-alt rounded" />
                  <div className="h-3 w-full bg-surface-alt rounded" />
                  <div className="h-3 w-2/3 bg-surface-alt rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-severity-high mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="pill"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <CveList cves={filtered} />
      )}
    </div>
  );
}
