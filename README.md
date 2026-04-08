# SecWatch

Dashboard de veille cybersecurite : suivi des CVE critiques, flux RSS netsec, fil Twitter/X et brief quotidien.

Built with Next.js, Tailwind CSS and Upstash Redis.

## Fonctionnalites

- **Brief quotidien** (`/brief`) — vue consolidee des dernieres 24h : CVE critiques, articles RSS non lus, tweets. Chaque element peut etre marque comme lu individuellement ou par section.
- **Vulnerabilites** (`/`) — suivi des CVE depuis la National Vulnerability Database (NVD), filtrables par severite, periode et tri.
- **News** (`/news`) — deux onglets :
  - **Twitter / X** — fil "Following" (chronologique, sans suggestions). Supporte les tweets longs, retweets complets, quote tweets, link preview cards et avatars.
  - **RSS** — agregation de flux RSS/Atom avec suivi lu/non-lu, filtre par source, masquage des lus.
  - **LinkedIn** — lien direct vers le feed LinkedIn.
- **Administration** (`/admin`) — preferences (marquage automatique au clic), gestion des cookies Twitter/X, gestion des flux RSS (ajout, suppression, reinitialisation des flux par defaut).

## Prerequis

- Node.js >= 18
- Un compte [Upstash](https://console.upstash.com/) (Redis gratuit)

## Installation

```bash
git clone https://github.com/Yomgui33/SecWatch.git
cd SecWatch
npm install
```

## Configuration locale

Creer un fichier `.env.local` a la racine du projet :

```env
# Cle API NVD (optionnelle, augmente le rate limit de 5 a 50 req/30s)
# Demander une cle sur : https://nvd.nist.gov/developers/request-an-api-key
NVD_API_KEY=

# Upstash Redis (pour stocker les credentials, flux RSS, etats de lecture)
# Creer un store gratuit sur https://console.upstash.com/
# Puis copier les valeurs REST depuis l'onglet "REST API"
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

En local, les credentials Redis et la cle NVD peuvent aussi etre saisis depuis la page `/admin` : l'application les persiste alors dans `.env.local` et `.secwatch-config.json`.

Les credentials Twitter/X se configurent depuis la page `/admin` de l'application.

## Deploiement Vercel

Sur Vercel, l'application ne peut pas ecrire dans `.env.local` au runtime. Il faut donc definir les variables d'environnement dans le dashboard Vercel avant le deploiement :

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NVD_API_KEY=
```

Notes :

- `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont les noms recommandes sur Vercel.
- Les aliases `KV_REST_API_URL` et `KV_REST_API_TOKEN` restent supportes pour le developpement local.
- Les cookies Twitter/X continuent d'etre stockes dans Redis via `/admin`, donc Redis doit etre configure des le premier deploy.
- Apres ajout ou modification des variables d'environnement sur Vercel, redeployer l'application.

## Lancement en mode dev

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Flux RSS par defaut

Au premier lancement, SecWatch charge automatiquement 17 flux RSS de la communaute netsec (Krebs on Security, PortSwigger Research, Synacktiv, TrustedSec, Rapid7, etc.). Ils peuvent etre geres depuis `/admin` > Flux RSS.

## Integrer des newsletters

Pour integrer des newsletters cybersecurite dans le module RSS :

1. Verifier si la newsletter propose un flux RSS natif (Substack : `newsletter.substack.com/feed`, Ghost : `/rss/`, Beehiiv : `/feed`). Si oui, l'ajouter directement dans `/admin` > Flux RSS.

2. Si la newsletter n'a pas de RSS, utiliser [kill-the-newsletter.com](https://kill-the-newsletter.com) :
   - Creer une boite aux lettres (ex: "secwatch-tldr")
   - Le service fournit une adresse email (`xxxxx@kill-the-newsletter.com`) et un flux Atom (`https://kill-the-newsletter.com/feeds/xxxxx.xml`)
   - S'abonner a la newsletter avec cette adresse email
   - Ajouter le flux Atom dans `/admin` > Flux RSS > Ajouter un flux

Chaque email recu apparaitra automatiquement dans l'onglet RSS de SecWatch.

## Todo

1. Ajouter une vraie stratégie "bootstrap" pour le premier déploiement Vercel si Redis n'est pas encore configuré, car la connexion Redis reste nécessaire avant de pouvoir stocker les cookies X ou les préférences.

2. Ajouter des options de configuration dans la page /admin pour le contenu du brief : quelles sources doivent être affichées ou non (X/RSS/Vulns) et le niveau de gravité des vulns.

3. Protéger l'accès au site par un mot de passe avec l'option "rester connecté" afin de le saisir une seule fois sur une machine donnée. Ce mot de passe doit être défini et modifiable dans la section /admin avec un mot de passe par défaut lors du premier lancement "SecWatch4you". 
