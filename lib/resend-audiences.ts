/**
 * Resend Audiences — list-insert provider (ISSUE-8 / T01).
 *
 * Shared by the cloud waitlist (T01) and design-partner application (T02) so
 * both routes add contacts through ONE provider. This is the T01↔T02 contract
 * surface defined in `06-技术架构.md` §4.6.
 *
 * Mirrors the fire-and-forget degradation philosophy of `lib/email.ts`: this
 * function NEVER throws and NEVER blocks the user-facing form. A signup must
 * still return 200 even when the list insert is skipped (missing env) or fails
 * (network/5xx) — availability over completeness, by design.
 *
 * Security (ISSUE-8 AC5): `audienceId` and the API key come ONLY from the
 * caller's env — never from request bodies — so there's no SSRF/injection
 * surface. Error logs print the HTTP status and a truncated body, never the
 * full API key.
 *
 * Set RESEND_API_KEY (reused from email.ts) and the relevant audience id env
 * (RESEND_CLOUD_AUDIENCE_ID / RESEND_PARTNER_AUDIENCE_ID) in env to enable.
 * Without them the function logs a warning and skips — useful in local dev.
 */

export type AddContactResult =
  | { ok: true }
  | { ok: false; skipped?: true; error?: string };

export async function addContact({
  audienceId,
  email,
  firstName,
  lastName,
  unsubscribed,
}: {
  audienceId: string | undefined;
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}): Promise<AddContactResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[audiences] RESEND_API_KEY missing — skipping list insert");
    return { ok: false, skipped: true };
  }

  // The caller passes the audience id straight from env; an empty/undefined id
  // means the list isn't configured for this form yet. Never hit the API with
  // an empty id (it would produce a malformed URL / 404).
  if (!audienceId) {
    console.warn("[audiences] audience id missing — skipping list insert");
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          ...(firstName ? { first_name: firstName } : {}),
          ...(lastName ? { last_name: lastName } : {}),
          unsubscribed: unsubscribed ?? false,
        }),
      },
    );

    if (res.ok) {
      return { ok: true };
    }

    // Idempotency: a duplicate email surfaces as 409 or an "already exists"
    // message. Treat it as success — the contact is on the list, which is all
    // we wanted.
    const body = await res.text();
    if (res.status === 409 || /already exists/i.test(body)) {
      return { ok: true };
    }

    // Truncate the body so an upstream error can't smuggle secrets into logs.
    console.error("[audiences] resend failed", res.status, body.slice(0, 200));
    return { ok: false, error: `resend ${res.status}` };
  } catch (err) {
    console.error("[audiences] resend threw", err);
    return { ok: false, error: String(err) };
  }
}
