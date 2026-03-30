"use client";

import type { NewsSource, NewsDateFilter, NewsFilters as Filters } from "@/lib/sources/twitter/types";

const SOURCE_OPTIONS: { value: NewsSource; label: string; active: boolean; href?: string }[] = [
  { value: "twitter", label: "Twitter / X", active: true },
  { value: "rss", label: "RSS", active: true },
  { value: "linkedin", label: "LinkedIn", active: false, href: "https://www.linkedin.com/feed/" },
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
    <div className="space-y-5">
      {/* Sources */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
          Sources
        </h3>
        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map((opt) => {
            const isActive = filters.activeSource === opt.value;
            if (!opt.active) {
              if (opt.href) {
                return (
                  <a
                    key={opt.value}
                    href={opt.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pill !text-text-muted"
                  >
                    {opt.label} ↗
                  </a>
                );
              }
              return (
                <span
                  key={opt.value}
                  className="pill opacity-40 !cursor-default"
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
                className={`pill ${isActive ? "pill-active" : ""}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Période */}
      <div>
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
          Période
        </h3>
        <div className="flex flex-wrap gap-2">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, dateFilter: opt.value })}
              className={`pill ${filters.dateFilter === opt.value ? "pill-active" : ""}`}
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
          <span> · {unreadCount} non lu{unreadCount !== 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}
