export interface RssFeed {
  id: string;
  name: string;
  url: string;
  htmlUrl?: string;
}

export interface RssArticle {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  content: string;
  link: string;
  published: string;
}

/** Deterministic short ID from a URL (DJB2 hash, base36). */
export function feedIdFromUrl(url: string): string {
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) + hash + url.charCodeAt(i)) & 0x7fffffff;
  }
  return hash.toString(36);
}
