import type { TweetEntry, TweetCard, QuotedTweet } from "./types";

// Bearer token public de l'app web Twitter (identique pour tous les utilisateurs)
const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

// --- Auth ---

export interface XCredentials {
  authToken: string;
  ct0: string;
  screenName?: string;
}

function getAuthHeaders(creds: XCredentials): Record<string, string> {
  return {
    authorization: `Bearer ${BEARER_TOKEN}`,
    "x-csrf-token": creds.ct0,
    cookie: `auth_token=${creds.authToken}; ct0=${creds.ct0}`,
    "content-type": "application/json",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "fr",
  };
}

// --- Helpers ---

interface MediaEntity {
  media_url_https?: string;
  type?: string;
}

interface UrlEntity {
  url?: string;
  expanded_url?: string;
}

interface TweetLegacy {
  full_text?: string;
  created_at?: string;
  id_str?: string;
  entities?: { media?: MediaEntity[]; urls?: UrlEntity[] };
  extended_entities?: { media?: MediaEntity[] };
  retweeted_status_result?: { result?: TweetResult };
}

interface CardBindingValue {
  key: string;
  value: { string_value?: string; image_value?: { url?: string }; type?: string };
}

interface TweetResult {
  rest_id?: string;
  __typename?: string;
  core?: {
    user_results?: {
      result?: {
        legacy?: {
          name?: string;
          screen_name?: string;
          profile_image_url_https?: string;
        };
      };
    };
  };
  legacy?: TweetLegacy;
  note_tweet?: {
    note_tweet_results?: {
      result?: {
        text?: string;
        entity_set?: { urls?: UrlEntity[] };
      };
    };
  };
  tweet?: TweetResult;
  card?: {
    legacy?: {
      binding_values?: CardBindingValue[];
      name?: string;
    };
  };
  quoted_status_result?: { result?: TweetResult };
}

function parseCard(tweetResult: TweetResult): TweetCard | undefined {
  const bindings = tweetResult.card?.legacy?.binding_values;
  if (!bindings || bindings.length === 0) return undefined;

  const vals = new Map<string, CardBindingValue["value"]>();
  for (const b of bindings) vals.set(b.key, b.value);

  const title = vals.get("title")?.string_value;
  const linkUrl =
    vals.get("card_url")?.string_value ||
    vals.get("url")?.string_value;
  if (!title || !linkUrl) return undefined;

  const imageUrl =
    vals.get("thumbnail_image_original")?.image_value?.url ||
    vals.get("summary_photo_image_original")?.image_value?.url ||
    vals.get("thumbnail_image_x_large")?.image_value?.url ||
    vals.get("summary_photo_image_x_large")?.image_value?.url ||
    vals.get("thumbnail_image")?.image_value?.url ||
    vals.get("summary_photo_image")?.image_value?.url;

  const domain =
    vals.get("domain")?.string_value ||
    vals.get("vanity_url")?.string_value ||
    (() => { try { return new URL(linkUrl).hostname; } catch { return ""; } })();

  return {
    title,
    description: vals.get("description")?.string_value,
    imageUrl,
    linkUrl,
    domain: domain || "",
  };
}

function parseQuotedTweet(qt: TweetResult | undefined): QuotedTweet | undefined {
  if (!qt) return undefined;
  const qtActual = qt.tweet || qt;
  if (qtActual.__typename === "TweetTombstone") return undefined;

  const qtLegacy = qtActual.legacy;
  if (!qtLegacy?.full_text) return undefined;

  const qtUser = qtActual.core?.user_results?.result?.legacy;
  const qtNoteTweet = qtActual.note_tweet?.note_tweet_results?.result;
  let qtContent = qtNoteTweet?.text || qtLegacy.full_text || "";
  const qtUrlEntities = qtNoteTweet?.entity_set?.urls ?? qtLegacy.entities?.urls ?? [];

  qtContent = qtContent.replace(/\s*https:\/\/t\.co\/\w+\s*$/g, "").trim();
  for (const u of qtUrlEntities) {
    if (u.url && u.expanded_url) {
      qtContent = qtContent.replace(u.url, u.expanded_url);
    }
  }

  const qtMediaEntities = qtLegacy.extended_entities?.media ?? qtLegacy.entities?.media ?? [];
  const qtMedia: string[] = [];
  for (const m of qtMediaEntities) {
    if (m.media_url_https) qtMedia.push(m.media_url_https);
  }

  const qtHandle = qtUser?.screen_name || "unknown";
  const qtId = qtActual.rest_id || qtLegacy.id_str || "";

  return {
    author: qtUser?.name || "Inconnu",
    authorHandle: qtHandle,
    avatarUrl: qtUser?.profile_image_url_https?.replace("_normal.", "_200x200.") || undefined,
    content: qtContent,
    published: qtLegacy.created_at
      ? new Date(qtLegacy.created_at).toISOString()
      : new Date().toISOString(),
    media: qtMedia,
    url: `https://x.com/${qtHandle}/status/${qtId}`,
  };
}

function parseTweetResult(tweet: TweetResult): TweetEntry | null {
  // Dérouler les wrappers (TweetWithVisibilityResults, etc.)
  const actual = tweet.tweet || tweet;
  if (actual.__typename === "TweetTombstone") return null;

  const legacy = actual.legacy;
  if (!legacy?.full_text) return null;

  const user = actual.core?.user_results?.result?.legacy;
  const authorName = user?.name || "Inconnu";
  const authorHandle = user?.screen_name || "unknown";
  const avatarUrl = user?.profile_image_url_https?.replace("_normal.", "_200x200.") || undefined;

  // Médias
  const mediaEntities =
    legacy.extended_entities?.media ?? legacy.entities?.media ?? [];
  const media: string[] = [];
  for (const m of mediaEntities) {
    if (m.media_url_https) media.push(m.media_url_https);
  }

  // Retweet : récupérer le contenu complet depuis le tweet original
  const rt = legacy.retweeted_status_result?.result;
  const rtActual = rt?.tweet || rt;
  const rtLegacy = rtActual?.legacy;
  const rtNoteTweet = rtActual?.note_tweet?.note_tweet_results?.result;

  // Quote tweet
  const qt = actual.quoted_status_result?.result;
  const quoted = parseQuotedTweet(qt);

  // Card (link preview) — priorité au RT s'il existe
  const card = parseCard(rtActual ?? actual);

  // Texte complet : notetweet > full_text, en priorité depuis le RT
  const noteTweet = actual.note_tweet?.note_tweet_results?.result;
  const fullText =
    rtNoteTweet?.text ||
    rtLegacy?.full_text ||
    noteTweet?.text ||
    legacy.full_text ||
    "";
  let content = rtLegacy
    ? `RT @${rtActual?.core?.user_results?.result?.legacy?.screen_name ?? ""}: ${fullText}`
    : fullText;
  const urlEntities =
    rtNoteTweet?.entity_set?.urls ??
    rtLegacy?.entities?.urls ??
    noteTweet?.entity_set?.urls ??
    legacy.entities?.urls ??
    [];

  // Retirer les t.co finaux (liens médias)
  content = content.replace(/\s*https:\/\/t\.co\/\w+\s*$/g, "").trim();
  // Remplacer les t.co restants par les URLs complètes
  for (const u of urlEntities) {
    if (u.url && u.expanded_url) {
      content = content.replace(u.url, u.expanded_url);
    }
  }

  const tweetId = actual.rest_id || legacy.id_str || "";

  return {
    id: tweetId,
    source: "twitter",
    author: authorName,
    authorHandle,
    avatarUrl,
    content,
    published: legacy.created_at
      ? new Date(legacy.created_at).toISOString()
      : new Date().toISOString(),
    url: `https://x.com/${authorHandle}/status/${tweetId}`,
    media,
    card,
    quoted,
  };
}

// --- HomeLatestTimeline (onglet "Abonnements", chronologique, sans suggestions) ---

const HOME_LATEST_FEATURES = JSON.stringify({
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: true,
});

export async function fetchHomeTimeline(
  creds: XCredentials,
  count: number = 40
): Promise<TweetEntry[]> {
  const variables = JSON.stringify({
    count,
    includePromotedContent: false,
    latestControlAvailable: true,
  });

  const params = new URLSearchParams({
    variables,
    features: HOME_LATEST_FEATURES,
  });

  const url = `https://x.com/i/api/graphql/DiTkXJgLqBBxCs7zaYsbtA/HomeLatestTimeline?${params}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(creds),
    signal: AbortSignal.timeout(20000),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("cookies_expired");
  }

  if (!res.ok) {
    throw new Error(`X API error: ${res.status}`);
  }

  const data = await res.json();
  const instructions =
    data?.data?.home?.home_timeline_urt?.instructions ?? [];

  const tweets: TweetEntry[] = [];

  for (const instruction of instructions) {
    if (instruction.type !== "TimelineAddEntries") continue;

    for (const entry of instruction.entries ?? []) {
      // Filtrer le contenu promu et les suggestions algorithmiques
      const entryId: string = entry.entryId ?? "";
      if (!entryId.startsWith("tweet-") && !entryId.startsWith("homeConversation-")) continue;

      const itemContent = entry.content?.itemContent;
      if (!itemContent) continue;

      // Ignorer les tweets sponsorisés
      if (itemContent.promotedMetadata) continue;

      // Ignorer les suggestions "qui suivre", topics, etc.
      if (itemContent.socialContext?.type === "Suggest") continue;

      const tweetResult = itemContent.tweet_results?.result;
      if (!tweetResult) continue;

      const parsed = parseTweetResult(tweetResult);
      if (parsed) tweets.push(parsed);
    }
  }

  return tweets;
}

// --- Vérification des credentials ---

export async function verifyCredentials(
  creds: XCredentials
): Promise<{ valid: boolean; screenName?: string }> {
  try {
    // Utiliser l'endpoint notifications (v2) qui fonctionne encore et retourne l'utilisateur
    const url = "https://x.com/i/api/2/notifications/all.json?count=1";
    const res = await fetch(url, {
      headers: getAuthHeaders(creds),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { valid: false };

    const data = await res.json();

    // Extraire le screen_name du premier utilisateur (le compte connecté)
    const users = data?.globalObjects?.users;
    if (!users) return { valid: true }; // Valide mais pas de screen_name

    // Le premier utilisateur dans l'objet est généralement le compte connecté
    const firstUser = Object.values(users)[0] as
      | { screen_name?: string }
      | undefined;

    return {
      valid: true,
      screenName: firstUser?.screen_name,
    };
  } catch {
    return { valid: false };
  }
}
