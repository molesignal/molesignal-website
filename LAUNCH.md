# Launch checklist

Run end-to-end before flipping `main` to production. The checklist is the
final gate after `pnpm check` and the QA passes in [QA.md](./QA.md).

## 0. Pre-flight scripts

Run all in sequence; each must exit 0.

```bash
pnpm check                # typecheck + lint + a11y:contrast + i18n parity
pnpm build                # ensure SSG works and all 28 routes prerender
pnpm lint:quickstart      # README ↔ /start command sync
pnpm dev &                # leave running in another shell
sleep 4
pnpm lint:links           # crawl all internal links return 2xx
```

If any fail, fix before continuing.

## 1. Brief promises — verify each one is delivered

The brief makes 3 principles concrete (`DESIGN_BRIEF.md` §Experience Principles).
Walk through them as a visitor would:

### Principle 1 — Proof over promise

- [ ] Hero stats chip shows a real GitHub star count (not "Star on GitHub" fallback).
- [ ] Cost calculator on `/why` updates numbers as sliders move; the disclaimer cites a date.
- [ ] `/architecture` data path diagram nodes show tooltips on hover/click.
- [ ] Every cross-link in the body of `/why`, `/architecture`, `/start` resolves.
- [ ] `docker compose` command is one click → toast confirmation; the copy is the README's.

### Principle 2 — Brand continuous, voice distinct

- [ ] Logo on TopNav uses the ECG indigo→blue→green gradient (matches `web/src/shell/LogoMark.tsx`).
- [ ] Hero "Without the Datadog bill." gradient is indigo→pink-magenta.
- [ ] No `text-marketing-accent` shows up in dark mode without the display-only rule (cross-check with `pnpm a11y:contrast`).
- [ ] Theme toggle Light/Dark switches the palette without layout shift.

### Principle 3 — Pre-1.0 as feature, not apology

- [ ] Top banner is present and dismissable, returns after 7 days.
- [ ] `/design-partner` form submits and shows the "48-hour reply" confirmation.
- [ ] `/roadmap` Now/Next/Later/Done tabs sync to URL hash.
- [ ] `/changelog` shows at least 3 entries; RSS feed validates.

## 2. Social proof — verify GitHub data lands

The website ISR-caches GitHub data for 1 hour. Re-deploy or wait 1h to see fresh.

- [ ] Star count > 0 on `/` Hero (small chip) and Live stats (large card).
- [ ] Last-commit string reads as a relative age ("3h ago", not "—").
- [ ] Contributor wall renders at least 1 avatar.
- [ ] If Discord is configured (env var?), the CommunityCallout shows the real invite link, not `#`.

If any of these are empty/fallback in production:

1. Check `GITHUB_TOKEN` is set in Vercel env.
2. Trigger a rebuild via Vercel → Deployments → "Redeploy".
3. If still empty, the repo may not be public yet — verify `https://api.github.com/repos/molesignal/molesignal` returns 200.

## 3. OG image / social card preview

- [ ] Twitter Card Validator: paste `https://molesignal.io/` → see the indigo+pink Hero card.
- [ ] Twitter Card Validator: paste `https://molesignal.io/blog/why-parquet-for-three-signals` → see the per-post card with the post title.
- [ ] Facebook Sharing Debugger: same two URLs, OG image preview renders.
- [ ] Slack unfurl test: paste each URL into a private channel → check the preview embeds.

## 4. SEO basics

- [ ] `https://molesignal.io/sitemap.xml` validates at https://www.xml-sitemaps.com/validate-xml-sitemap.html
- [ ] `https://molesignal.io/robots.txt` includes the sitemap URL and `Disallow: /api/`.
- [ ] Every page's `<title>` is unique and includes "molesignal".
- [ ] Every page has a `<meta name="description">` ≤ 160 chars.
- [ ] `hreflang` alternates appear for EN/ZH pairs (curl `/sitemap.xml | head -50` and inspect).
- [ ] Plausible script loads in production (devtools Network panel filter `plausible.io`).

## 5. Performance baseline

Capture once at launch as a "before" baseline so regressions are visible.

```bash
# Lighthouse desktop
npx lighthouse https://molesignal.io --preset=desktop --output=html --output-path=./lighthouse-home.html
npx lighthouse https://molesignal.io/why --preset=desktop --output=html --output-path=./lighthouse-why.html
npx lighthouse https://molesignal.io/architecture --preset=desktop --output=html --output-path=./lighthouse-arch.html
```

Targets (see [QA.md](./QA.md) §Lighthouse): Perf ≥90, A11y ≥95, BP ≥95, SEO 100.

## 6. Manual flows

Walk through end-to-end as a stranger, with no muscle memory:

### Flow A — Cold visitor → Try it

1. Open `/`. Within 5 seconds: spot the Hero, read the CrossSignalDemo, identify the Try-it CTA.
2. Click Try-it. Land on `/start`.
3. Copy the docker compose command. Confirm Sonner toast says "Copied".
4. (Optionally) actually paste into a terminal and verify it boots.

### Flow B — Skeptical evaluator → ROI

1. From `/`, click "See full comparison →" in the Why teaser.
2. Scroll to the CostCalculator. Tug both sliders. Confirm numbers update.
3. Land on the bottom dual-CTA. Click "Become Design Partner".
4. Fill the 5 fields. Submit. Confirm the "Thank you" message replaces the form.
5. Check the founders inbox — message arrived within 60 seconds.

### Flow C — OSS contributor

1. From `/`, notice "★ 1.2k · 3h ago" in the TopNav.
2. Click → land on the repo.
3. Return to `/roadmap`. Click "Now" tab. Click any milestone — opens GitHub issue.

### Flow D — Future Cloud customer

1. From `/`, scroll to footer. Click "Cloud coming · Join waitlist →".
2. Land on `/cloud`. Fill the single email field. Submit.
3. Confirm the "You're on the list ★ Star us to support" UI swap.

### Flow E — Language switch

1. From `/architecture`, click the EN/中文 switcher → ZH.
2. Confirm scroll position is preserved.
3. Confirm the URL is `/zh/architecture`.
4. Confirm the page is fully translated (no English fall-through).

## 7. Design review

After all of the above pass:

```
/design-review
```

This runs the design-review skill against the live preview URL, captures
screenshots for desktop / tablet / mobile / dark mode, and writes
`.design/molesignal-website/DESIGN_REVIEW.md` with prioritized findings.

Fix any **must-fix** items before flipping the domain to production.

## 8. Cutover

- [ ] Vercel → Production deployment promoted from a green commit on `main`.
- [ ] DNS A record on `molesignal.io` resolves to Vercel.
- [ ] TLS cert active (visit `https://molesignal.io`, no browser warning).
- [ ] Submit `https://molesignal.io/sitemap.xml` to Google Search Console.
- [ ] Submit the same URL to Bing Webmaster Tools.
- [ ] Tweet announcing v1 of the website + link to `/design-partner`.

## 9. Day-after observability

- [ ] Plausible shows pageviews from real (non-Vercel) referrers.
- [ ] No 5xx in Vercel function logs.
- [ ] At least one organic Design Partner form submission OR one Cloud waitlist signup within 48h. (Soft target — not blocking.)

---

If anything in §1–§7 is unchecked, the v1 launch is not ready. If §8 is
unchecked, the website is not live.
