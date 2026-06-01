# molesignal-website

Official website for [molesignal](https://github.com/molesignal/molesignal) — self-hosted, OpenTelemetry-native observability without the Datadog bill.

## Stack

- **Next.js 16** App Router · **React 19**
- **Tailwind v4** (CSS `@theme` based — no `tailwind.config.ts`)
- **shadcn/ui** (new-york style) · **lucide-react** icons
- **next-intl** for EN / ZH routing (EN default, ZH at `/zh/...`)
- **next-themes** for light / dark theme toggle (light default)
- **Inter Variable** font via `@fontsource-variable/inter`
- **Framer Motion** for interactive demos and micro-animations
- **MDX** for blog and changelog
- **React Hook Form + Zod** for forms
- **Shiki** for server-side syntax highlighting

## Design provenance

All design decisions live in [`.design/molesignal-website/`](../.design/molesignal-website/) at the parent monorepo root:

- `DESIGN_BRIEF.md` — problem, solution, principles, aesthetic direction
- `INFORMATION_ARCHITECTURE.md` — sitemap, nav, user flows, SEO
- `DESIGN_TOKENS.md` — 4-layer cascade decisions
- `TASKS.md` — ordered v1 build checklist

The token cascade inherits brand identity from the product UI at `../web/` (Indigo brand, Inter + `tnum/ss01`, OKLCH-calibrated). The website adds a Layer 4 "marketing accent" (pink-magenta `chart-5`) for hero gradients, CTA glow, and badges.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in what you need locally
pnpm dev                     # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |
| `pnpm lint:fix` | ESLint + autofix |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier (writes) |
| `pnpm format:check` | Prettier (check only) |
| `pnpm a11y:contrast` | WCAG contrast audit (added in M7.1) |

## Deployment

Vercel (recommended) — connect this folder as a Vercel project:

- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: `.next` (auto-detected)
- Required env vars (see `.env.example`): `RESEND_API_KEY`, `FOUNDERS_EMAIL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_SITE_URL`. `GITHUB_TOKEN` is optional but recommended to raise the public API rate limit.

Custom domain `molesignal.io` configured at the Vercel project level; `docs.molesignal.io` is a placeholder for the future standalone docs site.

## Relationship to the product UI (`web/`)

The two projects are physically isolated (no shared `node_modules`) but share **brand identity** via a token contract:

- Logo: `LogoMark.tsx` ported from `web/src/shell/`
- Brand color: Indigo `#4F60E0` (dark) / `#3742C7` (light), OKLCH-locked
- Typography: Inter Variable + `tnum + ss01` font-feature
- Theme system: 4-layer cascade with the website adding marketing accents

If brand identity changes in `web/`, audit `app/globals.css` here for synchronization.

## License

Apache 2.0 — same as the parent project. See [LICENSE](./LICENSE).
