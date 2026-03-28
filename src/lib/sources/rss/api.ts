import type { RssArticle, RssFeed } from "./types";

// --- Simple RSS / Atom parser (no external dependency) ---

function extractText(xml: string, tag: string): string {
  // CDATA
  const cdataRe = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i"
  );
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  // Regular text
  const textRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const textMatch = xml.match(textRe);
  if (textMatch) return decodeEntities(textMatch[1].trim());

  return "";
}

function extractAtomLink(xml: string): string {
  const alt = xml.match(
    /<link[^>]*rel\s*=\s*"alternate"[^>]*href\s*=\s*"([^"]*)"[^>]*\/?>/i
  );
  if (alt) return alt[1];
  const any = xml.match(/<link[^>]*href\s*=\s*"([^"]*)"[^>]*\/?>/i);
  return any?.[1] ?? "";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function splitItems(xml: string): { items: string[]; isAtom: boolean } {
  // Atom
  if (xml.includes("<feed") && xml.includes("xmlns")) {
    const parts = xml.split(/<entry[\s>]/);
    const items = parts.slice(1).map((p) => p.substring(0, p.indexOf("</entry>")));
    return { items, isAtom: true };
  }
  // RSS 2.0
  const parts = xml.split(/<item[\s>]/);
  const items = parts.slice(1).map((p) => p.substring(0, p.indexOf("</item>")));
  return { items, isAtom: false };
}

function parseFeedXml(xml: string, feed: RssFeed): RssArticle[] {
  const { items, isAtom } = splitItems(xml);
  const articles: RssArticle[] = [];

  for (const raw of items) {
    const title = stripHtml(extractText(raw, "title"));
    const link = isAtom
      ? extractAtomLink(raw)
      : extractText(raw, "link");
    const id = isAtom
      ? extractText(raw, "id") || link
      : extractText(raw, "guid") || link;
    const content = stripHtml(
      extractText(raw, isAtom ? "content" : "description") ||
        extractText(raw, isAtom ? "summary" : "content:encoded")
    );
    const pubRaw = isAtom
      ? extractText(raw, "published") || extractText(raw, "updated")
      : extractText(raw, "pubDate");

    if (!title && !content) continue;

    articles.push({
      id: id || link || `${feed.id}:${articles.length}`,
      feedId: feed.id,
      feedName: feed.name,
      title,
      content: content.slice(0, 500),
      link: decodeEntities(link),
      published: parseDate(pubRaw),
    });
  }

  return articles;
}

// --- Public API ---

export async function fetchFeedArticles(feed: RssFeed): Promise<RssArticle[]> {
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "SecWatch/1.0",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeedXml(xml, feed);
  } catch {
    return [];
  }
}

export async function fetchAllArticles(feeds: RssFeed[]): Promise<RssArticle[]> {
  const results = await Promise.allSettled(
    feeds.map((feed) => fetchFeedArticles(feed))
  );

  const articles: RssArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }

  // Tri par date décroissante
  articles.sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
  );

  return articles;
}
