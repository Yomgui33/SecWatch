export interface TweetCard {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl: string;
  domain: string;
}

export interface TweetEntry {
  id: string;
  source: "twitter";
  author: string;
  authorHandle: string;
  content: string;
  published: string;
  url: string;
  media: string[];
  card?: TweetCard;
}

export type NewsSource = "twitter" | "rss" | "linkedin";

export type NewsDateFilter = "24h" | "all";

export interface NewsFilters {
  activeSource: NewsSource;
  dateFilter: NewsDateFilter;
}
