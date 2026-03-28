# SecWatch

Dashboard de veille cybersecurite : suivi des CVE (NVD) et fil d'actualite securite via Twitter/X.

Built with Next.js, Tailwind CSS and Upstash Redis.

## Prerequis

- Node.js >= 18
- Un compte [Upstash](https://console.upstash.com/) (Redis gratuit)

## Installation

```bash
git clone https://github.com/Yomgui33/SecWatch.git
cd SecWatch
npm install
```

## Configuration

Creer un fichier `.env.local` a la racine du projet :

```env
# Cle API NVD (optionnelle, augmente le rate limit de 5 a 50 req/30s)
# Demander une cle sur : https://nvd.nist.gov/developers/request-an-api-key
NVD_API_KEY=

# Upstash Redis (pour stocker les comptes Twitter ajoutes)
# Creer un store gratuit sur https://console.upstash.com/
# Puis copier les valeurs REST depuis l'onglet "REST API"
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Les credentials Twitter/X se configurent depuis la page `/admin` de l'application.

## Lancement en mode dev

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).
