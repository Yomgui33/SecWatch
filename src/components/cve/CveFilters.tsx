"use client";

import { useCallback } from "react";
import type { CveSeverity, DateFilter, SortOrder, CveFilters as Filters } from "@/lib/sources/nvd/types";
import { SEVERITY_CONFIG } from "@/lib/severity";

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "custom", label: "Personnalisé" },
];

const SEVERITIES: CveSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "severity", label: "Criticité" },
  { value: "date", label: "Date" },
];

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  totalResults: number;
}

export default function CveFilters({ filters, onChange, totalResults }: Props) {
  const toggleSeverity = useCallback(
    (sev: CveSeverity) => {
      const current = filters.severities;
      const next = current.includes(sev)
        ? current.filter((s) => s !== sev)
        : [...current, sev];
      onChange({ ...filters, severities: next });
    },
    [filters, onChange]
  );

  const setDateFilter = useCallback(
    (df: DateFilter) => {
      onChange({ ...filters, dateFilter: df });
    },
    [filters, onChange]
  );

  return (
    <div className="space-y-5">
      {/* Période */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
          Période
        </h3>
        <div className="flex flex-wrap gap-2">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`pill ${filters.dateFilter === opt.value ? "pill-active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {filters.dateFilter === "custom" && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            <input
              type="date"
              value={filters.customStart ?? ""}
              onChange={(e) => onChange({ ...filters, customStart: e.target.value })}
              className="px-3 py-1.5 text-xs border border-border rounded-full bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-text-muted text-xs self-center">au</span>
            <input
              type="date"
              value={filters.customEnd ?? ""}
              onChange={(e) => onChange({ ...filters, customEnd: e.target.value })}
              className="px-3 py-1.5 text-xs border border-border rounded-full bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {/* Sévérité */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
          Sévérité
        </h3>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((sev) => {
            const cfg = SEVERITY_CONFIG[sev];
            const active = filters.severities.includes(sev);
            return (
              <button
                key={sev}
                onClick={() => toggleSeverity(sev)}
                className={`pill ${
                  active
                    ? `${cfg.bgClass} ${cfg.textClass} !border-current font-medium`
                    : ""
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tri + Compteur */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Trier par</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, sortBy: opt.value })}
              className={`pill ${filters.sortBy === opt.value ? "pill-active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-text-muted">
          {totalResults} CVE trouvée{totalResults !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
