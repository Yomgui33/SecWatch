"use client";

import type { RssArticle } from "@/lib/sources/rss/types";

interface FeedStat {
  id: string;
  name: string;
  total: number;
  unread: number;
}

interface Props {
  articles: RssArticle[];
  readIds: Set<string>;
  selectedFeeds: Set<string>;
  onToggleFeed: (feedId: string) => void;
  hideRead: boolean;
  onToggleHideRead: () => void;
  onMarkAllRead: () => void;
}

export default function RssFeedFilter({
  articles,
  readIds,
  selectedFeeds,
  onToggleFeed,
  hideRead,
  onToggleHideRead,
  onMarkAllRead,
}: Props) {
  // Calculer les stats par flux
  const statsMap = new Map<string, FeedStat>();
  for (const a of articles) {
    let stat = statsMap.get(a.feedId);
    if (!stat) {
      stat = { id: a.feedId, name: a.feedName, total: 0, unread: 0 };
      statsMap.set(a.feedId, stat);
    }
    stat.total++;
    if (!readIds.has(a.id)) stat.unread++;
  }

  const stats = Array.from(statsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const totalUnread = stats.reduce((sum, s) => sum + s.unread, 0);

  return (
    <div className="space-y-3">
      {/* Contrôles globaux */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onToggleHideRead}
          className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
            hideRead
              ? "border-accent bg-accent-light text-accent font-medium"
              : "border-border text-text-secondary hover:bg-surface-hover"
          }`}
        >
          Masquer les lus
        </button>
        <button
          onClick={onMarkAllRead}
          className="px-3 py-1.5 text-xs rounded-md border border-border text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Tout marquer lu
        </button>
        <span className="text-xs text-text-muted ml-auto">
          {totalUnread} non lu{totalUnread !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filtres par flux */}
      <div className="flex flex-wrap gap-1.5">
        {stats.filter((stat) => !hideRead || stat.unread > 0).map((stat) => {
          const isSelected =
            selectedFeeds.size === 0 || selectedFeeds.has(stat.id);
          return (
            <button
              key={stat.id}
              onClick={() => onToggleFeed(stat.id)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                isSelected
                  ? "border-accent bg-accent-light text-accent font-medium"
                  : "border-border text-text-muted hover:bg-surface-hover"
              }`}
            >
              {stat.name}
              {stat.unread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] leading-none font-medium">
                  {stat.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
