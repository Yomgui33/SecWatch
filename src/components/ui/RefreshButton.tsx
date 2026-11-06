"use client";

import { clearClientCache } from "@/lib/clientCache";
import { refreshPeaksysUnread } from "@/components/peaksys/unreadStore";

export default function RefreshButton() {
  function refresh() {
    clearClientCache();
    refreshPeaksysUnread({ force: true });
  }

  return (
    <button
      onClick={refresh}
      aria-label="Rafraîchir les données"
      title="Rafraîchir les données (cache de 15 min)"
      className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
        <path d="M13.5 2.5v3h-3" />
      </svg>
    </button>
  );
}
