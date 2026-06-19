import type { Request, Response, NextFunction } from "express";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

/**
 * Simple in-memory sliding-window rate limiter.
 * Rejects when a client exceeds `maxRequests` within `windowMs`.
 */
export function rateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const { windowMs, maxRequests, message = "Too many requests. Please slow down." } = options;

  // Purge stale entries every minute to avoid unbounded growth
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 60_000);

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);
    const now = Date.now();
    const win = store.get(ip);

    if (!win || win.resetAt < now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    win.count++;

    if (win.count > maxRequests) {
      const retryAfter = Math.ceil((win.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({ error: message, retryAfter });
      return;
    }

    return next();
  };
}

/** General API rate limit — 120 req / min per IP */
export const generalLimiter = rateLimiter({ windowMs: 60_000, maxRequests: 120 });

/** AI endpoints (analyze, outfits, capsule, chat) — 20 req / min per IP */
export const aiLimiter = rateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  message: "AI requests are rate limited. Please wait before sending another request.",
});
