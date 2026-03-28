import type { RssFeed } from "./types";
import { feedIdFromUrl } from "./types";

/** Flux RSS par défaut — catégorie "00 - netsec" de l'OPML Inoreader. */
export const DEFAULT_FEEDS: RssFeed[] = [
  { name: "Praetorian", url: "https://www.praetorian.com/feed/", htmlUrl: "https://www.praetorian.com/" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", htmlUrl: "https://krebsonsecurity.com/" },
  { name: "PortSwigger Research", url: "https://portswigger.net/research/rss", htmlUrl: "https://portswigger.net/research" },
  { name: "VAADATA", url: "https://www.vaadata.com/blog/fr/feed/", htmlUrl: "https://www.vaadata.com/blog/fr/" },
  { name: "Cisco Talos Blog", url: "https://blog.talosintelligence.com/rss/", htmlUrl: "https://blog.talosintelligence.com/" },
  { name: "Synacktiv", url: "https://www.synacktiv.com/en/feed/lastblog.xml", htmlUrl: "https://www.synacktiv.com/en.html" },
  { name: "dirkjanm.io", url: "https://dirkjanm.io/feed.xml", htmlUrl: "https://dirkjanm.io/" },
  { name: "ligolo-ng Releases", url: "https://github.com/nicocha30/ligolo-ng/releases.atom", htmlUrl: "https://github.com/nicocha30/ligolo-ng/releases" },
  { name: "SpecterOps", url: "https://specterops.io/feed", htmlUrl: "https://specterops.io/" },
  { name: "TrustedSec", url: "https://trustedsec.com/feed.rss", htmlUrl: "https://trustedsec.com/" },
  { name: "Podalirius", url: "https://podalirius.net/fr/articles/index.xml", htmlUrl: "https://podalirius.net/fr/articles/" },
  { name: "HTB Blog", url: "https://www.hackthebox.com/rss/blog/all", htmlUrl: "https://www.hackthebox.com/rss/blog/all" },
  { name: "Rasta Mouse", url: "https://rastamouse.me/feed/", htmlUrl: "https://rastamouse.me/" },
  { name: "Exploit-DB Updates", url: "https://www.exploit-db.com/rss.xml", htmlUrl: "https://www.exploit-db.com/" },
  { name: "Rapid7 Blog", url: "https://blog.rapid7.com/rss/", htmlUrl: "https://blog.rapid7.com/" },
  { name: "harmj0y", url: "https://blog.harmj0y.net/feed/", htmlUrl: "https://blog.harmj0y.net/" },
  { name: "C.S. by G.B.", url: "https://csbygb.github.io/blog/atom.xml", htmlUrl: "http://csbygb.github.io/blog" },
].map((f) => ({ ...f, id: feedIdFromUrl(f.url) }));

/**
 * Instructions pour intégrer des newsletters via kill-the-newsletter.com :
 *
 * 1. Aller sur https://kill-the-newsletter.com
 * 2. Créer une boîte aux lettres (un nom au choix, ex: "secwatch-tldr")
 * 3. Le service fournit :
 *    - Une adresse email : xxxxx@kill-the-newsletter.com
 *    - Un flux Atom : https://kill-the-newsletter.com/feeds/xxxxx.xml
 * 4. S'abonner à la newsletter avec cette adresse email
 * 5. Ajouter le flux Atom dans SecWatch via /admin > Flux RSS
 *
 * Chaque email reçu devient automatiquement une entrée dans le flux Atom,
 * et sera affiché dans l'onglet RSS de SecWatch comme n'importe quel autre flux.
 */
