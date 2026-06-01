# QA — A11y, perf, manual checks

Manual verification checklist for the molesignal-website. Most items have
not yet been automated; they're run by a human against a deployed preview
URL (or `pnpm dev` locally). Items marked with `pnpm` are scripted.

## Automated

| Check | Command | Pass criteria |
|---|---|---|
| TypeScript | `pnpm typecheck` | exit 0, no errors |
| Lint | `pnpm lint` | exit 0, no warnings |
| Formatting | `pnpm format:check` | exit 0 |
| **WCAG contrast** | `pnpm a11y:contrast` | 0 failures across 26 token pairs (light + dark) |
| Build | `pnpm build` | exit 0; all 28 SSG pages prerender; `/sitemap.xml`, `/robots.txt`, `/changelog/rss.xml` materialize |

Run the full suite before tagging a release:

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm a11y:contrast && pnpm build
```

## Lighthouse (manual, M7.2)

Run Chrome DevTools → **Lighthouse** against the production build (`pnpm build && pnpm start`, or a Vercel preview URL). Use **Desktop** profile first, then **Mobile**.

Pages to audit (priority order):

- `/` — home
- `/why` — heaviest page (CostCalculator + CompareTable + 5 scenario cards)
- `/architecture` — interactive diagram + sticky TOC
- `/start` — multiple CodeBlock (Shiki SSR) + tabs
- `/blog/why-parquet-for-three-signals` — MDX-style prose page
- `/zh` — ZH locale baseline

Target scores (desktop):

| Category | Target | Notes |
|---|---|---|
| Performance | **≥ 90** | LCP under 2.5s; the Hero gradient + CrossSignalDemo are the heavy items. |
| Accessibility | **≥ 95** | 100 is achievable; the only typical miss is `[hidden]` toggles on the mobile drawer. |
| Best Practices | **≥ 95** | No console errors. The single warning we tolerate is `<img>` for GitHub avatars (we don't run them through `next/image`). |
| SEO | **100** | All pages have `<title>`, `<meta description>`, canonical, OG. |

Mobile target subtracts ~10 from Performance, ~0 from the rest.

If Performance falls short: first look at the OG image route invocation count, then at the Plausible script load. Both are intentionally `defer` / `afterInteractive` — if a recent change moved them earlier, revert.

## prefers-reduced-motion QA (M7.3)

1. macOS: **System Settings → Accessibility → Display → Reduce motion** (on).
   Windows: **Settings → Accessibility → Visual effects → Animation effects** (off).
2. Reload `/`.
3. Verify:
   - [ ] **CrossSignalDemo** does NOT auto-rotate tabs. Manually clicking a tab still works.
   - [ ] **Hero gradient text** still visible; no shimmer or animation.
   - [ ] **Smooth scroll** is gone — anchor links jump immediately.
   - [ ] **PreReleaseBanner pink arrow** does not slide on hover.
   - [ ] **ScrollToTop** still appears/disappears; the appearance is non-animated.
   - [ ] **Sonner toasts** still slide in (sonner ignores reduce-motion by default — acceptable).

If any item above animates, file a bug and reproduce — the relevant component is missing the `useReducedMotion()` guard.

## Keyboard navigation QA (M7.4)

Unplug your mouse. Run this script on `/`:

1. Hit `Tab`. The first focusable element should be **"Skip to content"** (visually appears at the top-left).
2. Hit `Tab` again. Focus moves into the PreReleaseBanner link.
3. Continue `Tab`-ing through the TopNav: Logo, Why, Architecture, Quick Start, Docs↗, Blog, GitHub stats chip, LocaleSwitcher, ThemeToggle, "Try it" CTA.
4. Each focused element shows a **visible 2px indigo outline + 2px offset**.
5. `Enter` on a nav item navigates.
6. `Tab` into the CrossSignalDemo `Trace / Logs / Metric` tabs. `Space` or `Enter` switches the tab; the active tab is announced by `aria-selected="true"`.
7. `Tab` to a CodeBlock copy button. `Enter` triggers copy; toast appears.
8. Open the mobile drawer via the hamburger (`Enter`). `Tab` cycles through items inside the sheet. `Esc` closes.

Repeat on `/design-partner`:

- [ ] Tab through the 5 form fields in order.
- [ ] Each field has a visible label association.
- [ ] Submit with valid input. Form transitions to "Thank you" without losing focus.
- [ ] Submit with invalid email. Error message announces below the field.

Repeat on `/why`:

- [ ] CostCalculator sliders are keyboard-operable (`←`/`→` adjust value).
- [ ] Number display updates as you adjust.

## Screen-reader smoke test (M7.5)

Use **macOS VoiceOver** (`Cmd+F5`) or **NVDA** (Windows). Read `/` from the top.

Expected announcements:

1. "Skip to content, link" — first focusable element.
2. "Pre-release announcement, region" — banner identifies its purpose.
3. "Banner navigation, main" — TopNav lands cleanly.
4. "Heading level 1: What you'd build if you had time. Without the Datadog bill."
5. "Five-second demo, badge. One trace_id, three views." — CrossSignalDemo announces.
6. Each section H2 reads at level 2.
7. Form field labels announce: "Email address, edit text, required" on `/design-partner`.
8. Buttons announce their accessible name: "Try it, link" or "Copy, button".

Red flags that mean filing a bug:

- "Unlabeled button" anywhere.
- An icon-only button with no `aria-label`.
- A region called "graphic" with no `aria-label` (typically a missing alt on an SVG).

## Pre-launch QA (M8 — separate doc)

The launch-day checklist lives in [`LAUNCH.md`](./LAUNCH.md) (created in M8.5). This document focuses on the recurring a11y/perf checks; LAUNCH.md adds content-sync, OG-validator, social-proof verification, and the `/design-review` run.
