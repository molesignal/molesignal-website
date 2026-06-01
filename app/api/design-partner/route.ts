import { NextResponse } from "next/server";

import { foundersEmail, sendEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { designPartnerSchema } from "@/lib/schemas/design-partner";

/**
 * POST /api/design-partner
 *
 * Accepts a Design Partner application, validates with Zod, rate-limits
 * per IP (5 per hour), drops honeypot submissions silently, and emails
 * the founders alias via Resend.
 *
 * Returns 200 on success or silent honeypot trip. Returns 400 on bad
 * input, 429 on rate-limit, 500 on unexpected server failure.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = rateLimit({
    key: `design-partner:${ip}`,
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
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

  // Fire-and-forget — log on failure but still return 200 so the form UX
  // stays clean. The submission is also logged here for forensics.
  console.info("[design-partner]", {
    email: data.email,
    size: data.companySize,
    stack: data.currentStack,
  });
  await sendEmail({
    to: foundersEmail(),
    subject,
    text,
    replyTo: data.email,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
