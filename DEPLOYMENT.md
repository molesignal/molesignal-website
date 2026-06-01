# Deployment

molesignal-website ships as a static + serverless Next.js app on Vercel. Everything is wired so a single `git push` to `main` rolls a production build, and every PR gets its own preview URL.

## First-time setup

### 1. Create the Vercel project

1. Sign in to Vercel and **Import** the `molesignal/molesignal` repo.
2. **Root Directory**: set to `molesignal-website` (the website is a sub-project of the monorepo).
3. Framework Preset: `Next.js` (autodetected).
4. Build Command, Install Command, Dev Command: already declared in `vercel.json` — leave the project defaults blank.
5. Node version: `20.x` (matches `engines` in `package.json`).

### 2. Environment variables

Configure in **Vercel → Project → Settings → Environment Variables**. Mark each per environment (`Production`, `Preview`, `Development`).

| Variable | Required | Scope | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | all envs | Canonical site URL. `https://molesignal.io` in prod, the preview URL in `Preview`. |
| `RESEND_API_KEY` | recommended | prod + preview | Without it, form submissions log to the function but don't email. Free tier 100/day handles pre-1.0. |
| `FOUNDERS_EMAIL` | recommended | prod + preview | Defaults to `founders@molesignal.io`. Override for staging. |
| `GITHUB_TOKEN` | optional | all envs | Public PAT (no scopes) raises the GitHub API rate limit from 60 → 5000 /hour. Avoids stale star counts during heavy traffic spikes. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | optional | prod only | Enables Plausible analytics in production. Leave empty for preview/dev so analytics stays clean. |
| `NEXT_PUBLIC_PLAUSIBLE_API_HOST` | optional | prod only | Defaults to `https://plausible.io`. Override for self-hosted Plausible. |

Local development: copy `.env.example` to `.env.local` and fill in only what you need to test.

### 3. Custom domain

Configure in **Vercel → Project → Settings → Domains**.

| Hostname | Type | Target |
|---|---|---|
| `molesignal.io` | A record | `76.76.21.21` (Vercel anycast) |
| `www.molesignal.io` | CNAME | `cname.vercel-dns.com` |

Vercel auto-provisions TLS via Let's Encrypt. DNS propagation takes 5–60 min.

#### `docs.molesignal.io` — placeholder

In v1, `/docs` in the TopNav links to `https://docs.molesignal.io` but there's no docs site yet. Two options:

- **Recommended**: configure a 301 redirect at the DNS level (or CNAME to a placeholder page on Vercel) pointing to `https://github.com/molesignal/molesignal/tree/main/docs` so the link doesn't dead-end.
- **Alternative**: leave the link, accept the 5xx, and revisit when the standalone docs site (TASKS S5) lands.

## Branch / deploy mapping

| Branch | Vercel Environment | URL |
|---|---|---|
| `main` | Production | `https://molesignal.io` |
| any PR | Preview | `https://molesignal-website-{hash}-{org}.vercel.app` |
| `vercel-debug` | Preview | same pattern; ignored by indexing |

Preview deploys are automatically protected by Vercel's authentication wall by default. Disable per-project if you want public previews for design review.

## Build verification checklist

Before merging a PR that changes infrastructure or pages:

- [ ] `pnpm build` succeeds locally
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm format:check` exits 0
- [ ] Vercel preview URL renders the home page and at least one ZH page
- [ ] `/sitemap.xml` lists the new pages with correct `hreflang`
- [ ] `/changelog/rss.xml` validates as RSS 2.0

## Rollback

If a release breaks production:

1. Vercel → Deployments → find the last good deployment.
2. Click the menu → **Promote to Production**. Takes ~10 seconds, no rebuild.
3. Open an issue describing what broke before forcing a fix-forward.

## Smoke check after deploy

```bash
node -e "
const SITE = 'https://molesignal.io';
const paths = ['/', '/why', '/architecture', '/start', '/design-partner',
               '/cloud', '/roadmap', '/changelog', '/blog',
               '/zh', '/zh/architecture',
               '/sitemap.xml', '/robots.txt', '/changelog/rss.xml',
               '/opengraph-image'];
(async () => {
  for (const p of paths) {
    const r = await fetch(SITE + p, { redirect: 'manual' });
    console.log(p.padEnd(40) + r.status);
  }
})();
"
```

Expected: all `200`, except `/asdfasdf`-style 404 probes.

## Cost notes

Vercel free tier covers pre-1.0 traffic comfortably:

- 100 GB-hours/month included.
- ISR cache hits don't count against function invocations.
- The GitHub API fetch (revalidate 1h) is one upstream call per cache window, not per request.

Estimated $0–$5/month at <100k monthly pageviews. The line item that grows fastest is OG image generation (function invocations) — if Twitter/X traffic spikes, we'll see it.
