import type { TweetEntry } from "./types";

// Bearer token public de l'app web Twitter (identique pour tous les utilisateurs)
const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

// --- Auth ---

export interface XCredentials {
  authToken: string;
  ct0: string;
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
  tweet?: TweetResult;
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

  // Médias
  const mediaEntities =
    legacy.extended_entities?.media ?? legacy.entities?.media ?? [];
  const media: string[] = [];
  for (const m of mediaEntities) {
    if (m.media_url_https) media.push(m.media_url_https);
  }

  // Nettoyer le texte
  let content = legacy.full_text || "";
  // Retirer les t.co finaux (liens médias)
  content = content.replace(/\s*https:\/\/t\.co\/\w+\s*$/g, "").trim();
  // Remplacer les t.co restants par les URLs complètes
  for (const u of legacy.entities?.urls ?? []) {
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
    content,
    published: legacy.created_at
      ? new Date(legacy.created_at).toISOString()
      : new Date().toISOString(),
    url: `https://x.com/${authorHandle}/status/${tweetId}`,
    media,
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
  responsive_web_enhance_cards_enabled: false,
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
      const tweetResult =
        entry.content?.itemContent?.tweet_results?.result;
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
