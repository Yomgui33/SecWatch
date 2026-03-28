"use client";

import type { NewsSource, NewsDateFilter, NewsFilters as Filters } from "@/lib/sources/twitter/types";

const SOURCE_OPTIONS: { value: NewsSource; label: string; active: boolean }[] = [
  { value: "twitter", label: "Twitter / X", active: true },
  { value: "rss", label: "RSS", active: false },
  { value: "linkedin", label: "LinkedIn", active: false },
];

const DATE_OPTIONS: { value: NewsDateFilter; label: string }[] = [
  { value: "24h", label: "24 h" },
  { value: "all", label: "Tout" },
];

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  totalResults: number;
}

export default function NewsFilters({ filters, onChange, totalResults }: Props) {
  const toggleSource = (source: NewsSource) => {
    const current = filters.sources;
    const next = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    onChange({ ...filters, sources: next });
  };

  return (
    <div className="space-y-4">
      {/* Sources */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
          Sources
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_OPTIONS.map((opt) => {
            const isActive = filters.sources.includes(opt.value);
            if (!opt.active) {
              return (
                <span
                  key={opt.value}
                  className="px-3 py-1.5 text-xs rounded-md border border-border text-text-muted opacity-50 cursor-default"
                  title="Bientot disponible"
                >
                  {opt.label}
                </span>
              );
            }
            return (
              <button
                key={opt.value}
                onClick={() => toggleSource(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                  isActive
                    ? "border-accent bg-accent-light text-accent font-medium"
                    : "border-border text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Période */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
          Période
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, dateFilter: opt.value })}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                filters.dateFilter === opt.value
                  ? "border-accent bg-accent-light text-accent font-medium"
                  : "border-border text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="text-xs text-text-muted">
        {totalResults} publication{totalResults !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
