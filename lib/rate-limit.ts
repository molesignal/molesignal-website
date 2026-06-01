/**
 * Reliable per-IP rate limiter for form submission protection.
 *
 * Primary path: `@upstash/ratelimit` sliding window over Upstash Redis REST.
 * Shared across Vercel serverless instances, so the limit holds even though
 * instances are short-lived and don't share process memory.
 *
 * Fallback path: in-memory token bucket (the original v1 implementation),
 * used only when `UPSTASH_*` env is absent — adequate for local dev / no-key
 * environments, but NOT reliable under multi-instance serverless (kept solely
 * so the app degrades gracefully instead of erroring).
 *
 * Contract (06-技术架构 §4.3): `rateLimit()` is async and returns
 * `Promise<RateLimitResult>`; `RateLimitResult` shape is unchanged, so the 429
 * response body and all downstream consumers are unaffected.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = {
  count: number;
  resetAt: number;
};

const STORE = new Map<string, Bucket>();

/**
 * Cap on distinct keys held in the in-memory fallback store. Combined with
 * lazy eviction this bounds memory so a flood of unique (spoofed) IPs can't
 * grow the Map without limit (M1 — DoS hardening). When exceeded we drop the
 * oldest-resetting entries. Generous enough that legitimate traffic within a
 * window is never evicted prematurely.
 */
const STORE_MAX_KEYS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Upstash is enabled only when BOTH REST env vars are present. We read them
 * once at module load — never instantiating the client when env is missing, so
 * import never throws in no-key environments.
 */
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstashEnabled = Boolean(upstashUrl && upstashToken);

const redis = upstashEnabled
  ? new Redis({
      url: upstashUrl,
      token: upstashToken,
      // Fail fast: don't let the default 5-retry exponential backoff hang a
      // form submission for seconds during an Upstash outage. One retry, then
      // we fail open (see catch in rateLimit). Availability > strictness.
      retry: { retries: 1 },
    })
  : null;

/**
 * `Ratelimit` instances are cached per `(max, windowMs)` combination so we
 * don't rebuild the limiter (and its client wiring) on every request.
 */
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(max: number, windowMs: number): Ratelimit {
  const cacheKey = `${max}:${windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
    // Namespaced so different forms don't collide in Redis keyspace; the
    // per-form `key` we pass to limit() already carries `{form}:{ip}`.
    prefix: "molesignal:rl",
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

// Module-level flag so the "falling back to memory" warning is emitted at most
// once per process, not on every request (AC2).
let warnedFallback = false;

function warnFallbackOnce(): void {
  if (warnedFallback) return;
  warnedFallback = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to " +
      "in-memory rate limiting. This is NOT reliable under multi-instance " +
      "serverless and is intended for local/dev only.",
  );
}

/**
 * In-memory token bucket. Original v1 logic, with a bounded store: expired
 * entries are evicted lazily and the Map is capped (M1).
 */
function memoryRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = STORE.get(key);

  if (!existing || existing.resetAt <= now) {
    evictIfNeeded(now);
    STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (existing.count >= max) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Drop expired entries; if still over the cap, evict the entries that reset
 * soonest (closest to expiry / already expired) until back under the limit.
 */
function evictIfNeeded(now: number): void {
  if (STORE.size < STORE_MAX_KEYS) return;

  for (const [k, bucket] of STORE) {
    if (bucket.resetAt <= now) STORE.delete(k);
  }
  if (STORE.size < STORE_MAX_KEYS) return;

  const entries = [...STORE.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );
  const toRemove = STORE.size - STORE_MAX_KEYS + 1;
  for (let i = 0; i < toRemove && i < entries.length; i++) {
    STORE.delete(entries[i][0]);
  }
}

export async function rateLimit({
  key,
  max,
  windowMs,
}: {
  key: string;
  max: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (!upstashEnabled) {
    warnFallbackOnce();
    return memoryRateLimit(key, max, windowMs);
  }

  try {
    const { success, remaining, reset } = await getLimiter(max, windowMs).limit(
      key,
    );
    // `reset` is an epoch-ms timestamp → maps directly onto resetAt.
    return { ok: success, remaining, resetAt: reset };
  } catch (err) {
    // fail-open: infra hiccup (network/timeout/quota) must never surface as a
    // 5xx or block a legitimate submission. Allow the request and warn (AC6).
    console.warn(
      "[rate-limit] Upstash limit() failed — failing open (request allowed):",
      err,
    );
    return { ok: true, remaining: max - 1, resetAt: Date.now() + windowMs };
  }
}

/**
 * Best-effort IP extraction for the rate-limit key.
 *
 * On Vercel, `x-real-ip` and the LAST segment of `x-forwarded-for` are injected
 * by the edge from the real connection and cannot be spoofed by the client.
 * The leftmost XFF segment, by contrast, is fully client-controlled — using it
 * would let an attacker rotate a header value to bypass the limit (H1,
 * CWE-290/307). We therefore prefer `x-real-ip`, then the rightmost XFF entry.
 */
export function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return "unknown";
}
