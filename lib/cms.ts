import type { BlogPostMeta } from "@/components/blog-post-card";

/**
 * Read-side client for molesignal-cms (Payload v3 REST on Postgres).
 *
 * Resilience contract: every helper returns `null`/`[]` when `CMS_URL` is
 * unset, the CMS is down, or a response doesn't parse — so the site always
 * renders fully from its built-in static content (MDX posts, i18n copy,
 * static footer). The CMS is an overlay, never a hard dependency.
 *
 * All fetches are server-side (RSC / route handlers) with ISR revalidation;
 * nothing here may be imported into client components.
 */

const CMS_URL = (process.env.CMS_URL ?? "").replace(/\/$/, "");

/** How long CMS-driven content may be stale (seconds). */
export const CMS_REVALIDATE_SECONDS = 300;

export type CmsLocale = "en" | "zh";

async function cmsFetch<T>(path: string): Promise<T | null> {
  if (!CMS_URL) return null;
  try {
    const res = await fetch(`${CMS_URL}${path}`, {
      next: { revalidate: CMS_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** CMS-relative asset URL (e.g. `/api/media/file/x.png`) → absolute. */
function absUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? `${CMS_URL}${url}` : url;
}

/** Make CMS-relative media references inside projected HTML absolute. */
function absHtml(html: string): string {
  return html.replace(
    /(src|href)="(\/api\/media\/[^"]*)"/g,
    `$1="${CMS_URL}$2"`,
  );
}

// ── Blog ────────────────────────────────────────────────────────────────────

export type CmsPost = BlogPostMeta & {
  /** Projected HTML (from Lexical) — rendered by `CmsBody`, not MDX. */
  bodyHtml: string;
  source: "cms";
};

type CmsPostDoc = {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  author?: string | null;
  readTimeMinutes?: number | null;
  tags?: { tag: string }[] | null;
  heroImage?:
    | { url?: string | null; sizes?: { card?: { url?: string | null } } }
    | number
    | null;
  contentHtml?: string | null;
};

function mapPost(doc: CmsPostDoc): CmsPost {
  const hero = typeof doc.heroImage === "object" ? doc.heroImage : undefined;
  return {
    slug: doc.slug ?? "",
    title: doc.title ?? "",
    excerpt: doc.excerpt ?? "",
    date: doc.publishedAt ?? doc.createdAt,
    author: doc.author ?? "molesignal team",
    readTimeMinutes: doc.readTimeMinutes ?? 3,
    tags: (doc.tags ?? []).map((t) => t.tag),
    coverUrl: absUrl(hero?.sizes?.card?.url ?? hero?.url),
    bodyHtml: absHtml(doc.contentHtml ?? ""),
    source: "cms",
  };
}

/** Published CMS posts, newest first. Blog is EN-only in v1. */
export async function getCmsPosts(): Promise<CmsPost[]> {
  const data = await cmsFetch<{ docs?: CmsPostDoc[] }>(
    "/api/posts?locale=en&sort=-publishedAt&limit=100&depth=1",
  );
  if (!data?.docs) return [];
  return data.docs.filter((d) => d.slug && d.title).map(mapPost);
}

export async function getCmsPostBySlug(slug: string): Promise<CmsPost | null> {
  const data = await cmsFetch<{ docs?: CmsPostDoc[] }>(
    `/api/posts?locale=en&depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}`,
  );
  const doc = data?.docs?.[0];
  return doc?.slug && doc.title ? mapPost(doc) : null;
}

// ── Footer navigation (Navigation global) ──────────────────────────────────

export type CmsFooterLink = {
  label: string;
  href?: string;
  external: boolean;
  comingSoon: boolean;
};
export type CmsFooterColumn = { title: string; links: CmsFooterLink[] };
export type CmsFooterNav = {
  columns: CmsFooterColumn[];
  badges: { label: string; href?: string }[];
};

type CmsNavDoc = {
  footerColumns?: {
    title: string;
    links?: {
      label: string;
      href?: string | null;
      external?: boolean | null;
      comingSoon?: boolean | null;
    }[];
  }[];
  footerBadges?: { label: string; href?: string | null }[];
};

export async function getCmsFooterNav(
  locale: CmsLocale,
): Promise<CmsFooterNav | null> {
  const data = await cmsFetch<CmsNavDoc>(
    `/api/globals/navigation?locale=${locale}`,
  );
  if (!data?.footerColumns?.length) return null;
  return {
    columns: data.footerColumns.map((col) => ({
      title: col.title,
      links: (col.links ?? []).map((link) => ({
        label: link.label,
        href: link.href ?? undefined,
        external: Boolean(link.external),
        // A link without a destination can only be an honest "soon" state.
        comingSoon: Boolean(link.comingSoon) || !link.href,
      })),
    })),
    badges: (data.footerBadges ?? []).map((b) => ({
      label: b.label,
      href: b.href ?? undefined,
    })),
  };
}

// ── Pricing (Plans collection + PricingPage global) ─────────────────────────

export type CmsPlan = {
  slug: string;
  tier: "oss" | "cloud" | "enterprise" | null;
  name: string;
  priceDisplay?: string;
  priceNote?: string;
  features: string[];
};

type CmsPlanDoc = {
  slug: string;
  websiteTier?: CmsPlan["tier"];
  name: string;
  display?: { priceDisplay?: string | null; priceNote?: string | null };
  features?: { feature: string }[] | null;
};

export async function getCmsPlans(locale: CmsLocale): Promise<CmsPlan[]> {
  const data = await cmsFetch<{ docs?: CmsPlanDoc[] }>(
    `/api/plans?locale=${locale}&depth=0&sort=order&limit=20&where[active][equals]=true`,
  );
  if (!data?.docs) return [];
  return data.docs.map((d) => ({
    slug: d.slug,
    tier: d.websiteTier ?? null,
    name: d.name,
    priceDisplay: d.display?.priceDisplay || undefined,
    priceNote: d.display?.priceNote || undefined,
    features: (d.features ?? []).map((f) => f.feature),
  }));
}

export type CmsPricingCopy = {
  pill?: string;
  title?: string;
  lede?: string;
  faq: { question: string; answer: string }[];
};

type CmsPricingDoc = {
  intro?: { pill?: string | null; title?: string | null; lede?: string | null };
  faq?: { question: string; answer: string }[] | null;
};

export async function getCmsPricingCopy(
  locale: CmsLocale,
): Promise<CmsPricingCopy | null> {
  const data = await cmsFetch<CmsPricingDoc>(
    `/api/globals/pricing-page?locale=${locale}`,
  );
  if (!data) return null;
  return {
    pill: data.intro?.pill || undefined,
    title: data.intro?.title || undefined,
    lede: data.intro?.lede || undefined,
    faq: data.faq ?? [],
  };
}

// ── Site settings (contact channels for the floating assistant) ─────────────

export type CmsContact = {
  supportEmail?: string;
  salesEmail?: string;
  github?: string;
};

type CmsSettingsDoc = {
  supportEmail?: string | null;
  salesEmail?: string | null;
  social?: { github?: string | null } | null;
};

export async function getCmsContact(): Promise<CmsContact | null> {
  const data = await cmsFetch<CmsSettingsDoc>("/api/globals/site-settings");
  if (!data) return null;
  return {
    supportEmail: data.supportEmail || undefined,
    salesEmail: data.salesEmail || undefined,
    github: data.social?.github || undefined,
  };
}

// ── Leads (write path for /api/commercial-intent) ───────────────────────────

export type CmsLeadInput = {
  type: "commercial" | "support";
  name?: string;
  email: string;
  company?: string;
  teamSize?: string;
  message: string;
  locale?: string;
  page?: string;
};

/**
 * Stores a lead in the CMS. Returns false (never throws) when the CMS is
 * unreachable — the caller pairs this with an email notification so a CMS
 * outage degrades to "email only", not a lost lead.
 */
export async function createCmsLead(input: CmsLeadInput): Promise<boolean> {
  if (!CMS_URL) return false;
  try {
    const res = await fetch(`${CMS_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
