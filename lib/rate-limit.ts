/**
 * In-memory rate limiter — adequate for v1 form submission protection.
 *
 * Per-IP token bucket: N requests per window. Buckets are stored in a
 * Map keyed by IP. Memory grows linearly with unique IPs in the window;
 * Vercel serverless instances are short-lived so growth is bounded.
 *
 * For higher reliability under abuse, swap for @upstash/ratelimit + Redis
 * in M5 v1.x (open question in TASKS.md).
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const STORE = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit({
  key,
  max,
  windowMs,
}: {
  key: string;
  max: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = STORE.get(key);

  if (!existing || existing.resetAt <= now) {
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
 * Best-effort IP extraction. Vercel injects `x-forwarded-for`; behind other
 * proxies fall back to the remote address. The exact IP doesn't have to be
 * unique — we just need a stable key per client for the rate window.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
