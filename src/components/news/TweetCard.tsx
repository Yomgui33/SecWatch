import type { TweetEntry, QuotedTweet } from "@/lib/sources/twitter/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="shrink-0 w-10 h-10 rounded-full bg-surface-alt"
        loading="lazy"
      />
    );
  }
  return (
    <div className="shrink-0 w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-accent text-sm font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function QuotedTweetBlock({ qt }: { qt: QuotedTweet }) {
  return (
    <a
      href={qt.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-border rounded-lg p-3 hover:bg-surface-alt transition-colors mb-2"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        {qt.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qt.avatarUrl}
            alt={qt.author}
            className="w-5 h-5 rounded-full bg-surface-alt"
            loading="lazy"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-accent-light flex items-center justify-center text-accent text-[10px] font-semibold">
            {qt.author.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs font-semibold text-text-primary">{qt.author}</span>
        <span className="text-xs text-text-muted">@{qt.authorHandle}</span>
        <span className="text-xs text-text-muted">&middot; {timeAgo(qt.published)}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary [overflow-wrap:anywhere]">
        {qt.content}
      </p>
      {qt.media.length > 0 && (
        <div className={`grid gap-2 mt-2 ${qt.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {qt.media.slice(0, 4).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="rounded-lg border border-border w-full h-auto max-h-96 object-contain"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </a>
  );
}

export default function TweetCard({ tweet, onLinkClick }: { tweet: TweetEntry; onLinkClick?: (id: string) => void }) {
  const hasMedia = tweet.media.length > 0;
  const hasCard = tweet.card && !hasMedia && !tweet.quoted;

  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar src={tweet.avatarUrl} name={tweet.author} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">
              {tweet.author}
            </span>
            <a
              href={`https://x.com/${tweet.authorHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted hover:text-accent transition-colors shrink-0"
            >
              @{tweet.authorHandle}
            </a>
            <span className="text-xs text-text-muted shrink-0" title={formatDate(tweet.published)}>
              {timeAgo(tweet.published)}
            </span>
          </div>

          {/* Content */}
          <p className="mb-2 text-sm leading-relaxed whitespace-pre-line text-text-secondary [overflow-wrap:anywhere]">
            {tweet.content}
          </p>

          {/* Media */}
          {hasMedia && (
            <div className={`grid gap-2 mb-2 ${tweet.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {tweet.media.slice(0, 4).map((url, i) => (
                <a key={i} href={tweet.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="rounded-lg border border-border w-full h-auto max-h-96 object-contain"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Quoted tweet */}
          {tweet.quoted && <QuotedTweetBlock qt={tweet.quoted} />}

          {/* Link preview card */}
          {hasCard && (
            <a
              href={tweet.card!.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-border rounded-lg overflow-hidden hover:bg-surface-alt transition-colors mb-2"
            >
              {tweet.card!.imageUrl && (
                <div className="bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tweet.card!.imageUrl}
                    alt=""
                    className="w-full max-h-64 object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="px-3 py-2.5">
                <p className="text-xs text-text-muted mb-0.5">
                  {tweet.card!.domain}
                </p>
                <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
                  {tweet.card!.title}
                </p>
                {tweet.card!.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                    {tweet.card!.description}
                  </p>
                )}
              </div>
            </a>
          )}

          {/* Link to original */}
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLinkClick?.(tweet.id)}
            className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent [overflow-wrap:anywhere]"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3H3v10h10v-3M9 2h5v5M8 8l6-6" />
            </svg>
            Voir sur X
          </a>
        </div>
      </div>
    </article>
  );
}
