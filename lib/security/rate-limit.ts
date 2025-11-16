// Rate limiting to prevent abuse
import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  request: NextRequest,
  options: { windowMs: number; max: number } = {
    windowMs: 60000, // 1 minute
    max: 10, // 10 requests per minute
  }
): { allowed: boolean; remaining: number } {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `${ip}-${request.nextUrl.pathname}`;
  const now = Date.now();

  // Clean up expired entries
  if (store[key] && store[key].resetAt < now) {
    delete store[key];
  }

  // Initialize or update counter
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    return { allowed: true, remaining: options.max - 1 };
  }

  store[key].count++;
  const remaining = Math.max(0, options.max - store[key].count);

  return {
    allowed: store[key].count <= options.max,
    remaining,
  };
}

// Clean up old entries periodically (run this in a background job)
export function cleanupRateLimitStore() {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}
