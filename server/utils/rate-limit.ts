import type { H3Event } from 'h3'
import { getHeader, setHeader, createError } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const buckets = new Map<string, Map<string, RateLimitEntry>>()

// Periodic cleanup to prevent memory growth
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [name, bucket] of buckets) {
    for (const [key, entry] of bucket) {
      if (now > entry.resetAt) bucket.delete(key)
    }
    if (bucket.size === 0) buckets.delete(name)
  }
}

function getClientIp(event: H3Event): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return getHeader(event, 'x-real-ip') || '127.0.0.1'
}

/**
 * Simple in-memory rate limiter keyed by IP.
 *
 * NOTE: On serverless (Vercel), each cold start gets fresh memory.
 * This still protects against sustained abuse within a single instance.
 * For production-grade limiting, back with Redis/Upstash.
 *
 * @returns true if rate limit exceeded (caller should reject)
 */
export function checkRateLimit(
  event: H3Event,
  /** Namespace to separate different limiters */
  name: string,
  /** Max requests allowed per window */
  maxRequests: number,
  /** Window size in seconds */
  windowSeconds: number,
): boolean {
  cleanup()

  const ip = getClientIp(event)
  const key = ip

  if (!buckets.has(name)) buckets.set(name, new Map())
  const bucket = buckets.get(name)!

  const now = Date.now()
  const entry = bucket.get(key)

  if (!entry || now > entry.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return false
  }

  entry.count++
  if (entry.count > maxRequests) {
    // Set Retry-After header
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    setHeader(event, 'Retry-After', String(retryAfter))
    return true
  }

  return false
}

/**
 * Throws a 429 if rate limit is exceeded. Use in event handlers.
 */
export function enforceRateLimit(
  event: H3Event,
  name: string,
  maxRequests: number,
  windowSeconds: number,
): void {
  if (checkRateLimit(event, name, maxRequests, windowSeconds)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    })
  }
}
