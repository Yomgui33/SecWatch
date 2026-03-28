# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint + TypeScript check
```

No test framework is configured.

## Environment Variables (.env.local)

```env
NVD_API_KEY=          # Optional — raises NVD rate limit from 5 to 50 req/30s
KV_REST_API_URL=      # Upstash Redis REST API URL
KV_REST_API_TOKEN=    # Upstash Redis API token
X_AUTH_TOKEN=         # Optional fallback Twitter/X cookie
X_CT0=                # Optional fallback Twitter/X cookie
```

Twitter/X credentials are primarily managed at runtime via the `/admin` page, which stores them in Upstash Redis. Environment variables serve as fallback only.

## Architecture

**SecWatch** is a Next.js 15 (App Router) cybersecurity dashboard that aggregates two data sources:
- **CVE feed** — NIST NVD API (`/api/cves`)
- **Security tweets** — Twitter/X GraphQL API (`/api/news/tweets`)

### Data flow

**CVE pipeline:**
`/` → `CveDashboard` (client) → `GET /api/cves` → `fetchCves()` in [src/lib/sources/nvd/api.ts](src/lib/sources/nvd/api.ts) → NVD REST API → normalized `CveEntry[]` → client-side filter/sort

**Tweet pipeline:**
`/news` → `NewsDashboard` (client) → `GET /api/news/tweets` → `fetchHomeTimeline()` in [src/lib/sources/twitter/api.ts](src/lib/sources/twitter/api.ts) → X GraphQL `HomeLatestTimeline` → parsed `TweetEntry[]` → client-side filter

**Admin / credential flow:**
`/admin` → `XCredentialsForm` → `POST /api/admin/x-credentials` → `verifyCredentials()` → `saveXCredentials()` → Upstash Redis

Credential resolution priority: **Redis → env vars**.

### Key directories

| Path | Purpose |
|------|---------|
| [src/app/](src/app/) | Next.js pages and API routes |
| [src/components/](src/components/) | React components (cve/, news/, admin/, ui/) |
| [src/lib/sources/nvd/](src/lib/sources/nvd/) | NVD API client and types |
| [src/lib/sources/twitter/](src/lib/sources/twitter/) | X API client, response parser, credential storage |
| [src/lib/](src/lib/) | Shared utilities: Redis singleton (`kv.ts`), CVSS severity config (`severity.ts`) |

### Patterns

- **Server vs. client components**: Dashboard/filter/form components are `"use client"`. API routes handle all external calls server-side.
- **Caching**: CVE route uses 30-minute ISR (`revalidate = 1800`). Tweet route uses `dynamic = "force-dynamic"`.
- **Styling**: Tailwind CSS 4 with CSS custom properties for theming (`var(--color-surface)`, `var(--color-accent)`, etc.). Theme preference persisted in `localStorage`; an inline script in `layout.tsx` prevents flash on load.
- **Redis singleton**: `getRedis()` in [src/lib/kv.ts](src/lib/kv.ts) returns a cached instance.
- **Type contracts**: Each source exposes normalized types (`CveEntry`, `TweetEntry`) consumed by frontend components.
