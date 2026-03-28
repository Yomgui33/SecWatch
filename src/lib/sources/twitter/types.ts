export interface TweetCard {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl: string;
  domain: string;
}

export interface QuotedTweet {
  author: string;
  authorHandle: string;
  avatarUrl?: string;
  content: string;
  published: string;
  media: string[];
  url: string;
}

export interface TweetEntry {
  id: string;
  source: "twitter";
  author: string;
  authorHandle: string;
  avatarUrl?: string;
  content: string;
  published: string;
  url: string;
  media: string[];
  card?: TweetCard;
  quoted?: QuotedTweet;
}

export type NewsSource = "twitter" | "rss" | "linkedin";

export type NewsDateFilter = "24h" | "all";

export interface NewsFilters {
  activeSource: NewsSource;
  dateFilter: NewsDateFilter;
}
