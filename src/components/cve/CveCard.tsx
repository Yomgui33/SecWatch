import type { CveEntry } from "@/lib/sources/nvd/types";
import { SEVERITY_CONFIG } from "@/lib/severity";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "\u2026";
}

export default function CveCard({ cve, onLinkClick }: { cve: CveEntry; onLinkClick?: (id: string) => void }) {
  const sev = SEVERITY_CONFIG[cve.severity];

  return (
    <article className="group border border-border rounded-lg p-4 hover:bg-surface-hover transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Score badge */}
        <div
          className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-md ${sev.bgClass} ${sev.textClass} font-semibold text-sm`}
        >
          {cve.score !== null ? (
            <div className="text-center leading-tight">
              <div className="text-lg font-bold">{cve.score.toFixed(1)}</div>
              <div className="text-[10px] uppercase tracking-wide opacity-80">{sev.label}</div>
            </div>
          ) : (
            <div className="text-xs uppercase tracking-wide">N/A</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1.5">
            <a
              href={cve.nvdUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onLinkClick?.(cve.id)}
              className="font-mono text-sm font-semibold text-accent hover:underline"
            >
              {cve.id}
            </a>
            <time className="text-xs text-text-muted" dateTime={cve.published}>
              {formatDate(cve.published)}
            </time>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {truncate(cve.description, 280)}
          </p>
        </div>
      </div>
    </article>
  );
}
