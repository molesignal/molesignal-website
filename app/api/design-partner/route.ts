import { NextResponse } from "next/server";

import { foundersEmail, sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { addContact } from "@/lib/resend-audiences";
import { designPartnerSchema } from "@/lib/schemas/design-partner";
import { splitName } from "@/lib/split-name";

/**
 * POST /api/design-partner
 *
 * Accepts a Design Partner application, validates with Zod, rate-limits
 * per IP (5 per hour), drops honeypot submissions silently, then — only for
 * genuine submissions — does two things in parallel, both fire-and-forget:
 * (a) adds the applicant to the Resend partner audience so they're actually
 * reachable (the `name` is split into first/last via `splitName`), and
 * (b) emails the founders alias. Neither failure blocks the 200 —
 * availability over completeness (mirrors lib/email.ts / cloud-waitlist).
 * The audience id comes ONLY from env; a missing key or id degrades to a
 * warn + skip, never a 5xx.
 *
 * Returns 200 on success or silent honeypot trip. Returns 400 on bad
 * input, 429 on rate-limit, 500 on unexpected server failure.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = await rateLimit({
    key: `design-partner:${ip}`,
    max: 5,
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

  const parsed = designPartnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot trip → silent success
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const subject = `[design-partner] ${data.name} (${data.companySize}) — ${data.currentStack}`;
  const text = [
    `Name:          ${data.name}`,
    `Email:         ${data.email}`,
    `Company size:  ${data.companySize}`,
    `Current stack: ${data.currentStack}`,
    "",
    "Biggest pain:",
    data.biggestPain?.trim() || "(not provided)",
    "",
    "---",
    `IP: ${ip}`,
    `Sent: ${new Date().toISOString()}`,
  ].join("\n");

  // Forensics log (no PII beyond what founders already get in the notice).
  console.info("[design-partner]", {
    email: data.email,
    size: data.companySize,
    stack: data.currentStack,
  });

  // Fire-and-forget, in parallel: real list insert + founders notification.
  // The list insert carries ONLY email + first/last name (PII minimal — the
  // structured fields stay in the founders notice, never the audience). Both
  // settle regardless of outcome; we always return 200 so the form UX stays
  // clean even if the list/email is down.
  const { firstName, lastName } = splitName(data.name);
  await Promise.allSettled([
    addContact({
      audienceId: process.env.RESEND_PARTNER_AUDIENCE_ID,
      email: data.email,
      firstName,
      lastName,
    }),
    sendEmail({
      to: foundersEmail(),
      subject,
      text,
      replyTo: data.email,
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
