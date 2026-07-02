// Lightweight in-memory fixed-window rate limiter.
// Note: per-instance only — fine as a basic guard. For multi-instance/serverless
// production, back this with Redis/Upstash.
type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const h = store.get(key);
  if (!h || now > h.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }
  if (h.count >= limit) return { ok: false, retryAfter: Math.ceil((h.reset - now) / 1000) };
  h.count++;
  return { ok: true };
}

// Best-effort client IP from proxy headers.
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}
