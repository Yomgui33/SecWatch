import { getRedis } from "@/lib/kv";

const KV_KEY = "secwatch:peaksys:topics";

export interface PeaksysTopic {
  id: string;
  /** Nom affiché, également utilisé comme terme de recherche */
  name: string;
  /** Variantes d'écriture supplémentaires (ex: "NextJS", "next.js") */
  aliases: string[];
}

/** ID dérivé du nom normalisé : deux sujets ne diffèrent pas que par la casse. */
export function topicIdFromName(name: string): string {
  return name.trim().toLowerCase();
}

export async function getPeaksysTopics(): Promise<PeaksysTopic[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    return (await redis.get<PeaksysTopic[]>(KV_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function savePeaksysTopics(topics: PeaksysTopic[]): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis non configuré.");
  await redis.set(KV_KEY, topics);
}

export async function addPeaksysTopic(topic: PeaksysTopic): Promise<void> {
  const topics = await getPeaksysTopics();
  if (topics.some((t) => t.id === topic.id)) return; // déjà présent
  topics.push(topic);
  await savePeaksysTopics(topics);
}

export async function removePeaksysTopic(id: string): Promise<void> {
  const topics = await getPeaksysTopics();
  await savePeaksysTopics(topics.filter((t) => t.id !== id));
}
