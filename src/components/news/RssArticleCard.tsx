"use client";

import type { RssArticle } from "@/lib/sources/rss/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  article: RssArticle;
  read: boolean;
  onToggleRead: (id: string, read: boolean) => void;
  onLinkClick?: (id: string) => void;
}

export default function RssArticleCard({ article, read, onToggleRead, onLinkClick }: Props) {
  return (
    <article
      className={`card p-4 ${read ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Feed icon */}
        <div className="shrink-0 w-9 h-9 rounded-full bg-accent-light flex items-center justify-center text-accent text-xs font-semibold">
          {article.feedName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span className="text-xs text-accent font-medium truncate">
              {article.feedName}
            </span>
            <span
              className="text-xs text-text-muted shrink-0"
              title={formatDate(article.published)}
            >
              {timeAgo(article.published)}
            </span>
          </div>

          {/* Title */}
          {article.title && (
            <h4 className="text-sm font-semibold text-text-primary mb-1 leading-snug">
              {article.title}
            </h4>
          )}

          {/* Content excerpt */}
          {article.content && (
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-2">
              {article.content}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {article.link && (
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onLinkClick?.(article.id)}
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3H3v10h10v-3M9 2h5v5M8 8l6-6" />
                </svg>
                Lire l&apos;article
              </a>
            )}
            <button
              onClick={() => onToggleRead(article.id, !read)}
              className="text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
            >
              {read ? "Marquer non lu" : "Marquer lu"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
