/**
 * Verifies the Resend Audiences provider (lib/resend-audiences.ts) without
 * needing real Resend credentials. Covers ISSUE-8 AC1/AC3/AC4 + AC5 (PII /
 * secret-safety) and the runtime fail-soft path, by mocking global fetch.
 *
 * Usage:
 *   pnpm test:audiences
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import { addContact } from "../lib/resend-audiences";

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
const AUDIENCE = "aud_cloud_123";

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

/** Capture console.warn/error output for secret-leak + warn assertions. */
function captureConsole(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const origWarn = console.warn;
  const origError = console.error;
  const sink = (...args: unknown[]) => lines.push(args.map(String).join(" "));
  console.warn = sink;
  console.error = sink;
  return {
    lines,
    restore: () => {
      console.warn = origWarn;
      console.error = origError;
    },
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function testSuccess(): Promise<void> {
  console.log("[AC2] success path: 200 → ok, correct URL/body/auth");
  process.env.RESEND_API_KEY = TEST_KEY;
  const { calls, restore } = stubFetch(() =>
    jsonResponse(200, { id: "contact_1" }),
  );

  const r = await addContact({ audienceId: AUDIENCE, email: "a@b.com" });
  restore();

  assert(r.ok === true, "returns { ok: true } on 200");
  assert(calls.length === 1, "exactly one fetch call");
  const call = calls[0];
  assert(
    call.url === `https://api.resend.com/audiences/${AUDIENCE}/contacts`,
    "POSTs to /audiences/{id}/contacts with the env audience id",
  );
  assert(call.init.method === "POST", "uses POST");
  const headers = call.init.headers as Record<string, string>;
  assert(
    headers.Authorization === `Bearer ${TEST_KEY}`,
    "sends Bearer auth from RESEND_API_KEY",
  );
  const body = JSON.parse(String(call.init.body));
  assert(body.email === "a@b.com", "request body contains the email");
  assert(
    body.first_name === undefined && body.last_name === undefined,
    "cloud side sends no name fields (PII minimal)",
  );
  assert(body.unsubscribed === false, "defaults unsubscribed=false");
}

async function testNameFields(): Promise<void> {
  console.log("[T02 reuse] firstName/lastName map to snake_case body fields");
  process.env.RESEND_API_KEY = TEST_KEY;
  const { calls, restore } = stubFetch(() => jsonResponse(201, { id: "c2" }));

  const r = await addContact({
    audienceId: "aud_partner",
    email: "p@q.com",
    firstName: "Ada",
    lastName: "Lovelace",
  });
  restore();

  assert(r.ok === true, "returns ok on 201");
  const body = JSON.parse(String(calls[0].init.body));
  assert(body.first_name === "Ada", "maps firstName → first_name");
  assert(body.last_name === "Lovelace", "maps lastName → last_name");
}

async function testIdempotent409(): Promise<void> {
  console.log("[AC1] idempotency: 409 duplicate → success, no throw");
  process.env.RESEND_API_KEY = TEST_KEY;
  const { restore } = stubFetch(() =>
    jsonResponse(409, { error: "Contact already exists" }),
  );

  let threw = false;
  let r;
  try {
    r = await addContact({ audienceId: AUDIENCE, email: "dup@b.com" });
  } catch {
    threw = true;
  }
  restore();

  assert(!threw, "does not throw on 409");
  assert(r?.ok === true, "409 is treated as { ok: true }");
}

async function testIdempotentAlreadyExistsBody(): Promise<void> {
  console.log('[AC1] idempotency: non-409 "already exists" body → success');
  process.env.RESEND_API_KEY = TEST_KEY;
  const { restore } = stubFetch(() =>
    jsonResponse(422, { message: "Contact already exists in audience" }),
  );

  const r = await addContact({ audienceId: AUDIENCE, email: "dup2@b.com" });
  restore();

  assert(r.ok === true, 'matches "already exists" semantics regardless of code');
}

async function testMissingAudienceId(): Promise<void> {
  console.log("[AC3] missing audience id → skip, no request, warn");
  process.env.RESEND_API_KEY = TEST_KEY;
  const { calls, restore } = stubFetch(() => jsonResponse(200, {}));
  const cap = captureConsole();

  const r = await addContact({ audienceId: undefined, email: "x@y.com" });

  cap.restore();
  restore();

  assert(
    r.ok === false && r.skipped === true,
    "returns { ok: false, skipped: true }",
  );
  assert(calls.length === 0, "does NOT hit the API with an empty id");
  assert(
    cap.lines.some((l) => /audience id missing/i.test(l)),
    "warns 'audience id missing — skipping list insert'",
  );
}

async function testMissingApiKey(): Promise<void> {
  console.log("[AC4] missing RESEND_API_KEY → skip, no request, warn");
  delete process.env.RESEND_API_KEY;
  const { calls, restore } = stubFetch(() => jsonResponse(200, {}));
  const cap = captureConsole();

  const r = await addContact({ audienceId: AUDIENCE, email: "x@y.com" });

  cap.restore();
  restore();

  assert(
    r.ok === false && r.skipped === true,
    "returns { ok: false, skipped: true }",
  );
  assert(calls.length === 0, "does NOT call fetch without a key");
  assert(
    cap.lines.some((l) => /RESEND_API_KEY missing/i.test(l)),
    "warns about the missing key",
  );
}

async function testRuntimeFailSoft(): Promise<void> {
  console.log("[fail-soft] fetch throws → { ok: false, error }, no throw");
  process.env.RESEND_API_KEY = TEST_KEY;
  const { restore } = stubFetch(() => {
    throw new Error("ECONNREFUSED");
  });
  const cap = captureConsole();

  let threw = false;
  let r;
  try {
    r = await addContact({ audienceId: AUDIENCE, email: "x@y.com" });
  } catch {
    threw = true;
  }

  cap.restore();
  restore();

  assert(!threw, "never throws to the caller on network failure");
  assert(r?.ok === false, "returns { ok: false } so route can still 200");
}

async function testSecretNotLogged(): Promise<void> {
  console.log("[AC5] error log never prints the full API key + truncates body");
  process.env.RESEND_API_KEY = TEST_KEY;
  // 500 with a long body that (maliciously) echoes the key — provider must
  // truncate and must never log the key from its own state.
  const longBody = "server error ".repeat(50) + TEST_KEY;
  const { restore } = stubFetch(() => jsonResponse(500, { msg: longBody }));
  const cap = captureConsole();

  const r = await addContact({ audienceId: AUDIENCE, email: "x@y.com" });

  cap.restore();
  restore();

  assert(r.ok === false, "5xx → { ok: false, error }");
  const joined = cap.lines.join("\n");
  assert(
    !joined.includes(TEST_KEY),
    "logged output does not contain the API key",
  );
  assert(
    cap.lines.some((l) => l.length <= 300),
    "error body is truncated (no unbounded upstream echo)",
  );
}

async function main(): Promise<void> {
  await testSuccess();
  await testNameFields();
  await testIdempotent409();
  await testIdempotentAlreadyExistsBody();
  await testMissingAudienceId();
  await testMissingApiKey();
  await testRuntimeFailSoft();
  await testSecretNotLogged();

  console.log("");
  if (failures === 0) {
    console.log("✅ resend-audiences checks passed");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} resend-audiences check(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("check-resend-audiences crashed:", err);
  process.exit(1);
});
