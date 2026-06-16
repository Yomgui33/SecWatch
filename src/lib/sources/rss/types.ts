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

/** Feed ID from URL — uses the URL directly since URLs are already unique. */
export function feedIdFromUrl(url: string): string {
  return url;
}
