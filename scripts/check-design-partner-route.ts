/**
 * Verifies the Design Partner route wiring (app/api/design-partner/route.ts)
 * and the name-split helper (lib/split-name.ts) without real Resend creds —
 * ISSUE-9 / T02. Covers AC1 (zod 400), AC2 (real list insert + name split),
 * AC3/AC4 (graceful env degradation, still 200 + warn), AC5 (PII minimal,
 * honeypot silent, secret-safe) by mocking global fetch and injecting fake env.
 *
 * Usage:
 *   pnpm test:design-partner
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import { POST } from "../app/api/design-partner/route";
import { splitName } from "../lib/split-name";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${msg}`);
  }
}

const TEST_KEY = "re_test_secret_key_DO_NOT_LOG";
const AUDIENCE = "aud_partner_456";

type Captured = { url: string; init: RequestInit };

/** Replace global fetch with a stub; returns captured calls + a restore fn. */
function stubFetch(
  handler: (url: string, init: RequestInit) => Response,
): { calls: Captured[]; restore: () => void } {
  const calls: Captured[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init: init ?? {} });
    return handler(url, init ?? {});
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

/** Capture console.warn/error/info output for warn + secret-leak assertions. */
function captureConsole(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;
  const sink = (...args: unknown[]) =>
    lines.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  console.warn = sink;
  console.error = sink;
  console.info = sink;
  return {
    lines,
    restore: () => {
      console.warn = origWarn;
      console.error = origError;
      console.info = origInfo;
    },
  };
}

/** Distinct IP per call so the 5/h in-memory limiter never trips in tests. */
let ipSeq = 0;
function makeRequest(body: unknown): Request {
  ipSeq += 1;
  return new Request("http://localhost/api/design-partner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": `10.0.0.${ipSeq}`,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  companySize: "11-50",
  currentStack: "Datadog",
  biggestPain: "Datadog bill is out of control",
};

function contactsCalls(calls: Captured[]): Captured[] {
  return calls.filter((c) => /\/audiences\/[^/]+\/contacts$/.test(c.url));
}
function emailCalls(calls: Captured[]): Captured[] {
  return calls.filter((c) => c.url === "https://api.resend.com/emails");
}

// ── splitName unit tests (AC2) ──────────────────────────────────────────────
function testSplitName(): void {
  console.log("[AC2] splitName — deterministic first/last split");
  const two = splitName("Ada Lovelace");
  assert(two.firstName === "Ada" && two.lastName === "Lovelace", '"Ada Lovelace" → Ada / Lovelace');

  const one = splitName("Ada");
  assert(one.firstName === "Ada" && one.lastName === undefined, '"Ada" → first only, no last');

  const three = splitName("Ada B. Lovelace");
  assert(
    three.firstName === "Ada" && three.lastName === "B. Lovelace",
    '"Ada B. Lovelace" → Ada / "B. Lovelace"',
  );

  const padded = splitName("  Ada   Lovelace  ");
  assert(
    padded.firstName === "Ada" && padded.lastName === "Lovelace",
    "surrounding + internal whitespace collapses",
  );

  const blank = splitName("   ");
  assert(
    blank.firstName === "" && blank.lastName === undefined,
    "all-whitespace → empty firstName (addContact will skip it)",
  );
}

// ── AC1: zod 400 on bad input ───────────────────────────────────────────────
async function testZod400(): Promise<void> {
  console.log("[AC1] zod validation → 400 on bad input, 200 on valid");
  process.env.RESEND_API_KEY = TEST_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const { restore } = stubFetch(() => new Response("{}", { status: 200 }));

  const missing = await POST(makeRequest({ email: "a@b.com" }));
  assert(missing.status === 400, "missing required fields → 400");

  const badEmail = await POST(makeRequest({ ...VALID, email: "not-an-email" }));
  assert(badEmail.status === 400, "invalid email → 400");

  const badEnum = await POST(makeRequest({ ...VALID, companySize: "huge" }));
  assert(badEnum.status === 400, "non-enum companySize → 400");

  const longName = await POST(makeRequest({ ...VALID, name: "x".repeat(121) }));
  assert(longName.status === 400, "name > 120 → 400");

  const longPain = await POST(makeRequest({ ...VALID, biggestPain: "x".repeat(401) }));
  assert(longPain.status === 400, "biggestPain > 400 → 400");

  const badJson = await POST(makeRequest("{not json"));
  assert(badJson.status === 400, "malformed JSON → 400");

  const ok = await POST(makeRequest(VALID));
  assert(ok.status === 200, "valid 5-field submission → 200");

  const okNoPain = await POST(makeRequest({ ...VALID, biggestPain: undefined }));
  assert(okNoPain.status === 200, "biggestPain omitted (optional) → 200");

  restore();
}

// ── AC2: real list insert + name split + notification ───────────────────────
async function testInsertAndNotify(): Promise<void> {
  console.log("[AC2] valid submit → POST contacts (split name) + founders email");
  process.env.RESEND_API_KEY = TEST_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const { calls, restore } = stubFetch(() => new Response("{}", { status: 200 }));

  const res = await POST(makeRequest(VALID));
  restore();

  assert(res.status === 200, "route returns 200");
  const contacts = contactsCalls(calls);
  assert(contacts.length === 1, "exactly one contacts POST");
  assert(
    contacts[0].url === `https://api.resend.com/audiences/${AUDIENCE}/contacts`,
    "POSTs to the env audience id",
  );
  const body = JSON.parse(String(contacts[0].init.body));
  assert(body.email === VALID.email, "contact body carries email");
  assert(body.first_name === "Ada", 'first_name = "Ada"');
  assert(body.last_name === "Lovelace", 'last_name = "Lovelace"');
  assert(emailCalls(calls).length === 1, "founders notification email also sent");

  // single-word name → no last_name key
  const { calls: c2, restore: r2 } = stubFetch(() => new Response("{}", { status: 200 }));
  await POST(makeRequest({ ...VALID, name: "Madonna" }));
  r2();
  const b2 = JSON.parse(String(contactsCalls(c2)[0].init.body));
  assert(b2.first_name === "Madonna" && b2.last_name === undefined, "single-word name → first only");
}

// ── AC5①: PII minimal — only email + first/last in the audience body ────────
async function testPiiMinimal(): Promise<void> {
  console.log("[AC5①] audience body excludes companySize/currentStack/pain/IP");
  process.env.RESEND_API_KEY = TEST_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const { calls, restore } = stubFetch(() => new Response("{}", { status: 200 }));

  await POST(makeRequest(VALID));
  restore();

  const body = JSON.parse(String(contactsCalls(calls)[0].init.body));
  const keys = Object.keys(body).sort().join(",");
  assert(
    keys === "email,first_name,last_name,unsubscribed",
    `body keys minimal (got: ${keys})`,
  );
  const blob = JSON.stringify(body);
  assert(!blob.includes("11-50"), "companySize NOT in audience body");
  assert(!blob.includes("Datadog"), "currentStack NOT in audience body");
  assert(!blob.includes("out of control"), "biggestPain NOT in audience body");
}

// ── AC3: missing audience id → skip insert, still notify, still 200 + warn ──
async function testMissingAudience(): Promise<void> {
  console.log("[AC3] missing RESEND_PARTNER_AUDIENCE_ID → skip insert, still 200 + warn");
  process.env.RESEND_API_KEY = TEST_KEY;
  delete process.env.RESEND_PARTNER_AUDIENCE_ID;
  const { calls, restore } = stubFetch(() => new Response("{}", { status: 200 }));
  const cap = captureConsole();

  const res = await POST(makeRequest(VALID));

  cap.restore();
  restore();

  assert(res.status === 200, "still returns 200");
  assert(contactsCalls(calls).length === 0, "no contacts request made");
  assert(emailCalls(calls).length === 1, "founders notification still sent");
  assert(
    cap.lines.some((l) => /audience id missing/i.test(l)),
    "warns 'audience id missing — skipping list insert'",
  );
}

// ── AC4: missing API key → insert + notify skip, still 200 + warn ───────────
async function testMissingApiKey(): Promise<void> {
  console.log("[AC4] missing RESEND_API_KEY → insert + email skip, still 200 + warn");
  delete process.env.RESEND_API_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const { calls, restore } = stubFetch(() => new Response("{}", { status: 200 }));
  const cap = captureConsole();

  const res = await POST(makeRequest(VALID));

  cap.restore();
  restore();

  assert(res.status === 200, "still returns 200 (no 5xx)");
  assert(calls.length === 0, "no upstream calls at all without a key");
  assert(
    cap.lines.some((l) => /RESEND_API_KEY missing/i.test(l)) &&
      cap.lines.some((l) => /\[audiences\]|\[email\]/i.test(l)),
    "both audiences + email warn about the missing key",
  );
}

// ── AC4: notification body contains all 5 fields + replyTo + IP/timestamp ───
async function testNotificationBody(): Promise<void> {
  console.log("[AC4] founders notice carries all 5 fields + replyTo + IP/timestamp");
  process.env.RESEND_API_KEY = TEST_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const { calls, restore } = stubFetch(() => new Response("{}", { status: 200 }));

  await POST(makeRequest(VALID));
  restore();

  const email = JSON.parse(String(emailCalls(calls)[0].init.body));
  const text: string = email.text;
  assert(text.includes(VALID.name), "notice includes Name");
  assert(text.includes(VALID.email), "notice includes Email");
  assert(text.includes(VALID.companySize), "notice includes Company size");
  assert(text.includes(VALID.currentStack), "notice includes Current stack");
  assert(text.includes(VALID.biggestPain), "notice includes Biggest pain");
  assert(/IP:/.test(text) && /Sent:/.test(text), "notice keeps IP + timestamp footer");
  assert(email.reply_to === VALID.email, "replyTo = applicant email");
}

// ── AC5③: honeypot trip → zero insert, zero email (no side effects) ─────────
// NB: the shared schema enforces the honeypot at the zod layer
// (`website: z.string().max(0)`), so a filled honeypot is REJECTED as 400 —
// the route's `if (data.website…)` silent-200 branch is dead under this schema
// (identical to the cloud-waitlist route, ISSUE-8 / QA PASS). Either way the
// security-critical guarantee holds: a bot submission triggers no list insert,
// no notification, and (frontend, ISSUE-2) no track — because the 200 branch
// is never reached.
async function testHoneypot(): Promise<void> {
  console.log("[AC5③] honeypot filled → rejected, ZERO insert + ZERO email");
  process.env.RESEND_API_KEY = TEST_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const { calls, restore } = stubFetch(() => new Response("{}", { status: 200 }));

  const res = await POST(makeRequest({ ...VALID, website: "http://spam.example" }));
  restore();

  assert(
    res.status === 400,
    "honeypot rejected at zod layer (400) — no 2xx success path for bots",
  );
  assert(calls.length === 0, "honeypot → ZERO upstream calls (no insert, no email)");

  // An EMPTY honeypot (real user) passes zod and is processed normally.
  const { calls: c2, restore: r2 } = stubFetch(() => new Response("{}", { status: 200 }));
  const ok = await POST(makeRequest({ ...VALID, website: "" }));
  r2();
  assert(ok.status === 200, "empty honeypot (human) → processed, 200");
  assert(contactsCalls(c2).length === 1, "empty honeypot → genuine submission inserted");
}

// ── AC5④: list-insert failure never leaks the key, never 5xx ────────────────
// Scope: this exercises the path T02 wires — `addContact` → Resend
// /contacts. The contacts endpoint returns a malicious 500 whose body echoes
// the key; the provider must truncate (slice 0..200) so the key (appended past
// char 200) never reaches the logs. The email endpoint returns a benign 500 so
// this stays a focused test of the list-insert wiring, not pre-existing
// lib/email.ts logging (out of T02 scope).
async function testSecretSafeFailSoft(): Promise<void> {
  console.log("[AC5④] contacts 500 echoing key → still 200, key never logged");
  process.env.RESEND_API_KEY = TEST_KEY;
  process.env.RESEND_PARTNER_AUDIENCE_ID = AUDIENCE;
  const maliciousBody = "boom ".repeat(60) + TEST_KEY; // key sits past char 200
  const { restore } = stubFetch((url) => {
    if (/\/contacts$/.test(url)) return new Response(maliciousBody, { status: 500 });
    return new Response("upstream unavailable", { status: 500 }); // /emails, benign
  });
  const cap = captureConsole();

  const res = await POST(makeRequest(VALID));

  cap.restore();
  restore();

  assert(res.status === 200, "contacts 500 → route still 200 (fail-soft)");
  assert(
    !cap.lines.join("\n").includes(TEST_KEY),
    "list-insert error log never contains the API key (truncated body)",
  );
}

async function main(): Promise<void> {
  testSplitName();
  await testZod400();
  await testInsertAndNotify();
  await testPiiMinimal();
  await testMissingAudience();
  await testMissingApiKey();
  await testNotificationBody();
  await testHoneypot();
  await testSecretSafeFailSoft();

  console.log("");
  if (failures === 0) {
    console.log("✅ design-partner route checks passed");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} design-partner route check(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("check-design-partner-route crashed:", err);
  process.exit(1);
});
