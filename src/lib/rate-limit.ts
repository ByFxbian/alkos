type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, value] of buckets) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: config.limit - 1, resetAt };
  }

  if (current.count >= config.limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    ok: true,
    remaining: config.limit - current.count,
    resetAt: current.resetAt,
  };
}
