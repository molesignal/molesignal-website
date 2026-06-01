/**
 * splitName — deterministic first/last split for Resend Audiences (ISSUE-9 / T02).
 *
 * The Design Partner form collects a single free-text `name`. Resend Contacts
 * store `first_name` / `last_name` separately, so the route maps `name` here
 * before calling `addContact`.
 *
 * Rule (06-技术架构.md §3.1): trim, collapse internal whitespace to single
 * spaces, then split on the FIRST space — the first token is `firstName`, the
 * remainder (middle names / surnames preserved verbatim) is `lastName`. A
 * single-word name yields only `firstName` (no `lastName` key). A blank string
 * yields `firstName: ""`, which `addContact` skips via its `firstName ? {...}`
 * guard — defensive against zod `min(1)` letting through all-whitespace.
 *
 * Mapping lives here (not in the provider) to keep `addContact`'s signature
 * stable across the cloud-waitlist (email only) and design-partner (with name)
 * call sites.
 */
export function splitName(raw: string): { firstName: string; lastName?: string } {
  const t = raw.trim().replace(/\s+/g, " ");
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1) };
}
