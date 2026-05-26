# SecWatch

SecWatch est un tableau de bord de veille cybersécurité pensé pour un usage quotidien : suivi des CVE récentes, agrégation RSS netsec, consultation du fil Twitter / X et lecture d'un brief consolidé.

Cette branche correspond à la version de référence actuellement déployable et optimisée pour Vercel.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Upstash Redis

## Fonctionnalités

- ` / ` : brief du jour avec les nouveautés des dernières 24h
- ` /brief ` : suivi des vulnérabilités issues de VulnCheck
- ` /news ` : onglets Twitter / X et RSS
- ` /admin ` : configuration technique et préférences

Le brief agrège :

- les CVE selon le niveau de gravité configuré
- les articles RSS non lus
- les tweets / X non lus

Fonctions principales déjà en place :

- authentification par mot de passe avec option `rester connecté`
- mot de passe modifiable depuis `/admin`
- stockage des préférences, états de lecture, flux RSS et cookies X dans Redis
- configuration runtime plus robuste pour Vercel
- interface responsive avec ajustements mobile récents

## Pages principales

- `/` : brief du jour
- `/brief` : vulnérabilités
- `/news` : veille Twitter / X + RSS
- `/admin` : services, sécurité, préférences, flux RSS
- `/login` : accès protégé

## Prérequis

- Node.js 18+
- un compte Upstash Redis
- un token VulnCheck Community (gratuit sur [vulncheck.com](https://vulncheck.com))

## Installation locale

```bash
git clone https://github.com/Yomgui33/SecWatch.git
cd SecWatch
npm install
```

## Configuration locale

Créer un fichier `.env.local` à la racine :

```env
# VulnCheck (requis — token gratuit sur vulncheck.com)
VULNCHECK_API_TOKEN=

# Redis
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Optionnel : bootstrap du mot de passe sans Redis
SECWATCH_PASSWORD=
# ou hash déjà préparé
SECWATCH_PASSWORD_HASH=

# Optionnel : fallback X si besoin
X_AUTH_TOKEN=
X_CT0=
X_SCREEN_NAME=
```

Notes :

- en local, la page `/admin` peut écrire dans `.env.local` et `.secwatch-config.json`
- les aliases `KV_REST_API_URL` / `KV_REST_API_TOKEN` restent pratiques en développement
- le mot de passe par défaut au tout premier lancement reste `SecWatch4you` tant qu'il n'a pas été remplacé

## Déploiement Vercel

Cette version est préparée en priorité pour Vercel.

Sur Vercel, l'application ne peut pas écrire dans `.env.local` au runtime. La configuration doit donc être fournie via les variables d'environnement du projet.

Variables recommandées :

```env
VULNCHECK_API_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SECWATCH_PASSWORD=
SECWATCH_PASSWORD_HASH=
```

Comportement attendu :

- `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont les noms recommandés sur Vercel
- `SECWATCH_PASSWORD` ou `SECWATCH_PASSWORD_HASH` permettent un bootstrap sécurisé si Redis n'est pas encore branché
- Redis reste nécessaire pour stocker :
  - les cookies Twitter / X
  - les préférences utilisateur
  - les flux RSS personnalisés
  - les états de lecture

Important :

- après ajout ou modification d'une variable d'environnement dans Vercel, il faut redéployer
- si Redis est indisponible sur Vercel, l'authentification échoue proprement au lieu de retomber silencieusement sur un mot de passe par défaut

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

`npm run lint` exécute actuellement :

```bash
tsc --noEmit
```

## Authentification

- accès protégé par mot de passe
- option `rester connecté` via cookie de session persistant
- changement du mot de passe depuis `/admin`
- sur Vercel, le stockage de l'auth repose sur Redis ou sur `SECWATCH_PASSWORD(_HASH)` pour le bootstrap

## Sources de données

### VulnCheck

- source principale des vulnérabilités affichées dans `/brief` et `/`
- remplace NIST NVD (arrêt de publication constaté en mai 2026)
- tier Community gratuit, 1 000 req/min
- les CVE sont requêtés par date de dernière modification (décalage de 2 jours) afin de ne retourner que des CVE ayant déjà reçu leur score CVSS
- `VULNCHECK_API_TOKEN` est requis (token gratuit sur [vulncheck.com](https://vulncheck.com))

### RSS

- un ensemble de flux RSS par défaut est amorcé automatiquement
- les flux peuvent être ajoutés, supprimés ou réinitialisés depuis `/admin`
- les newsletters sans RSS natif peuvent être intégrées via `kill-the-newsletter.com`

### Twitter / X

- SecWatch utilise les cookies `auth_token` et `ct0`
- la connexion se configure depuis `/admin`
- le `screenName` est mémorisé pour garder un affichage plus fiable dans l'admin

## Flux RSS par défaut

Au premier lancement, SecWatch charge automatiquement un set de flux netsec de référence. Ils peuvent ensuite être ajustés dans `/admin > Flux RSS`.

## Intégrer des newsletters

Si une newsletter fournit déjà un flux :

- Substack : `newsletter.substack.com/feed`
- Ghost : `/rss/`
- Beehiiv : `/feed`

Sinon :

1. créer une boîte sur [kill-the-newsletter.com](https://kill-the-newsletter.com)
2. récupérer l'adresse email générée et le flux Atom associé
3. s'abonner à la newsletter avec cette adresse
4. ajouter le flux Atom dans `/admin > Flux RSS`

## État du projet

Déjà implémenté :

- protection par mot de passe
- branchement propre sur Vercel
- gestion des erreurs de bootstrap et de stockage plus robuste
- support mobile amélioré
- migration de la source CVE vers VulnCheck NVD++ (Community)

Reste à faire :

1. finaliser complètement la stratégie de bootstrap sans Redis pour les fonctions non liées à l'auth
2. continuer à affiner l'expérience mobile sur les écrans les plus étroits

## Branche de déploiement

La branche `main` est actuellement la branche de référence pour le déploiement.
