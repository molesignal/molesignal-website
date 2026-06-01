/**
 * Transactional email — Resend by default (Phase 5 M5.2 decision).
 *
 * Why Resend: developer-friendly API, free tier (100/day, 3k/month) covers
 * pre-1.0 launch volume, native React Email if we want richer templates
 * later. The route handlers below treat the email as fire-and-forget — if
 * the call fails we log but still return 200, so the user-facing form
 * doesn't error out (we don't want a transient email outage to cost us
 * a Design Partner application).
 *
 * Set RESEND_API_KEY and FOUNDERS_EMAIL in .env.local / Vercel env.
 * Without RESEND_API_KEY the function returns `{skipped: true}` — useful
 * in local dev when nobody has configured email yet.
 */

const RESEND_FROM = "molesignal Website <noreply@updates.molesignal.io>";

type SendResult = { ok: true } | { ok: false; skipped?: true; error?: string };

export async function sendEmail({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing — skipping send");
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email] resend failed", res.status, body);
      return { ok: false, error: `resend ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] resend threw", err);
    return { ok: false, error: String(err) };
  }
}

export function foundersEmail(): string {
  return process.env.FOUNDERS_EMAIL ?? "founders@molesignal.io";
}
