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
    const params = new URLSearchParams({ dateFilter: filters.dateFilter });
    if (filters.dateFilter === "custom") {
      // Tant que la plage est incomplète, inutile d'appeler l'API.
      if (!filters.customStart || !filters.customEnd) {
        setAllCves([]);
        setLoading(false);
        setError(null);
        return;
      }
      params.set("customStart", filters.customStart);
      params.set("customEnd", filters.customEnd);
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/cves?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAllCves([]);
        setError(data.error ?? "Impossible de charger les CVE. Réessayez dans quelques instants.");
        return;
      }
      setAllCves(data.cves ?? []);
    } catch {
      setAllCves([]);
      setError("Impossible de charger les CVE. Réessayez dans quelques instants.");
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

  // Les CVE publiées très récemment n'ont pas encore de score CVSS : si le
  // filtre de sévérité les écarte, on le dit plutôt que de laisser une liste
  // vide inexpliquée.
  const hidden = allCves.length - filtered.length;
  const hiddenUnscored = allCves.filter(
    (cve) => cve.severity === "NONE" && !filters.severities.includes("NONE")
  ).length;

  return (
    <div className="space-y-6">
      <CveFilters filters={filters} onChange={setFilters} totalResults={filtered.length} />

      {!loading && !error && hidden > 0 && (
        <p className="text-xs text-text-muted">
          {hidden} CVE publiée{hidden > 1 ? "s" : ""} sur cette période
          {hidden > 1 ? " sont masquées" : " est masquée"} par le filtre de sévérité
          {hiddenUnscored > 0 && (
            <>
              , dont {hiddenUnscored} en attente de score CVSS
            </>
          )}
          .
        </p>
      )}

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
