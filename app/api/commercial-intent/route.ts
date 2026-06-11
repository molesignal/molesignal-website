import { NextResponse } from "next/server";

import { createCmsLead } from "@/lib/cms";
import { foundersEmail, sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { commercialIntentSchema } from "@/lib/schemas/commercial-intent";

/**
 * POST /api/commercial-intent
 *
 * Backend of the floating assistant widget (commercial-edition interest +
 * support messages). Validates with Zod, rate-limits per IP (5 per hour),
 * drops honeypot submissions silently, then — for genuine submissions — does
 * two things in parallel, both fire-and-forget:
 * (a) stores the lead in the CMS (`leads` collection) where the sales/content
 *     team triages it, and
 * (b) emails the founders alias.
 * Either sink failing alone never loses the lead and never blocks the 200 —
 * availability over completeness (mirrors design-partner / cloud-waitlist).
 *
 * Returns 200 on success or silent honeypot trip, 400 on bad input,
 * 429 on rate-limit.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = await rateLimit({
    key: `commercial-intent:${ip}`,
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

  const parsed = commercialIntentSchema.safeParse(body);
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

  const subject = `[${data.type}] ${data.name}${data.company ? ` @ ${data.company}` : ""}${
    data.teamSize ? ` (${data.teamSize})` : ""
  }`;
  const text = [
    `Type:       ${data.type}`,
    `Name:       ${data.name}`,
    `Email:      ${data.email}`,
    `Company:    ${data.company ?? "(not provided)"}`,
    `Team size:  ${data.teamSize ?? "(not provided)"}`,
    `Locale:     ${data.locale ?? "?"}`,
    `Page:       ${data.page ?? "?"}`,
    "",
    "Message:",
    data.message,
    "",
    "---",
    `IP: ${ip}`,
    `Sent: ${new Date().toISOString()}`,
  ].join("\n");

  // Forensics log (no message body — it may contain sensitive details).
  console.info("[commercial-intent]", {
    type: data.type,
    email: data.email,
    company: data.company,
    teamSize: data.teamSize,
  });

  await Promise.allSettled([
    createCmsLead({
      type: data.type,
      name: data.name,
      email: data.email,
      company: data.company,
      teamSize: data.teamSize,
      message: data.message,
      locale: data.locale,
      page: data.page,
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
