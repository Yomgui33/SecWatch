"use client";

import type { NewsSource, NewsDateFilter, NewsFilters as Filters } from "@/lib/sources/twitter/types";

const SOURCE_OPTIONS: { value: NewsSource; label: string; active: boolean }[] = [
  { value: "twitter", label: "Twitter / X", active: true },
  { value: "rss", label: "RSS", active: true },
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
  unreadCount?: number;
}

export default function NewsFilters({ filters, onChange, totalResults, unreadCount }: Props) {
  return (
    <div className="space-y-4">
      {/* Sources */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
          Sources
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_OPTIONS.map((opt) => {
            const isActive = filters.activeSource === opt.value;
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
                onClick={() => onChange({ ...filters, activeSource: opt.value })}
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
        {totalResults} {filters.activeSource === "rss" ? "article" : "publication"}
        {totalResults !== 1 ? "s" : ""}
        {unreadCount !== undefined && filters.activeSource === "rss" && (
          <span> &middot; {unreadCount} non lu{unreadCount !== 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}
