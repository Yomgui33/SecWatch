import type { PeaksysTopic } from "./topics";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Construit une fonction renvoyant les noms des sujets mentionnés dans un texte.
 *
 * Recherche insensible à la casse, sur le mot entier : un terme ne doit pas être
 * collé à une lettre ou un chiffre ("Jira" ne matche pas "Jiraffe"), mais la
 * ponctuation compte comme séparateur ("Next.js," ou "(Node.js)" matchent).
 */
export function buildTopicMatcher(topics: PeaksysTopic[]): (text: string) => string[] {
  const compiled = topics
    .map((topic) => {
      const terms = [topic.name, ...topic.aliases]
        .map((t) => t.trim())
        .filter(Boolean)
        .map(escapeRegExp);
      if (terms.length === 0) return null;
      return {
        name: topic.name,
        re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${terms.join("|")})(?![\\p{L}\\p{N}])`, "iu"),
      };
    })
    .filter((c): c is { name: string; re: RegExp } => c !== null);

  return (text: string) => compiled.filter((c) => c.re.test(text)).map((c) => c.name);
}

/**
 * Rend les produits CPE (`atlassian:jira_software_data_center`) cherchables
 * comme du texte : "atlassian jira software data center". Les antislashs
 * d'échappement CPE (`c\+\+`) sont retirés.
 */
export function productsToText(products: string[] | undefined): string {
  return (products ?? [])
    .map((p) => p.replace(/\\/g, "").replace(/[:_]/g, " "))
    .join("\n");
}
