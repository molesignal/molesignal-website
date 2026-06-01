import { NextResponse } from "next/server";

import { foundersEmail, sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { addContact } from "@/lib/resend-audiences";
import { cloudWaitlistSchema } from "@/lib/schemas/cloud-waitlist";

/**
 * POST /api/cloud-waitlist
 *
 * Single-field email capture. Rate-limited per IP (10/hour — lighter than
 * design-partner since the cost of a spam signup is lower). On success we do
 * two things in parallel, both fire-and-forget: (a) add the email to the
 * Resend cloud audience so the contact is actually reachable, and (b) notify
 * founders. Neither failure blocks the 200 — availability over completeness
 * (mirrors lib/email.ts). The audience id comes only from env; a missing key
 * or id degrades to a warn + skip, never a 5xx.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = await rateLimit({
    key: `cloud-waitlist:${ip}`,
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(0, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = cloudWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  console.info("[cloud-waitlist]", { email: parsed.data.email });

  // Fire-and-forget, in parallel: real list insert + founders notification.
  // Cloud side passes email only (no name) — just a reachable list. Both
  // settle regardless of outcome; we always return 200.
  await Promise.allSettled([
    addContact({
      audienceId: process.env.RESEND_CLOUD_AUDIENCE_ID,
      email: parsed.data.email,
    }),
    sendEmail({
      to: foundersEmail(),
      subject: `[cloud-waitlist] ${parsed.data.email}`,
      text: `${parsed.data.email}\n\n---\nIP: ${ip}\nSent: ${new Date().toISOString()}`,
      replyTo: parsed.data.email,
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
