// ============================================
// Hardcover Outbound Rate Limiter
// ============================================
// Token bucket: 40 req/min (of 60 allowed by HC API).
// Leaves 20 req/min headroom for safety.
// ============================================

const MAX_TOKENS = 40
const REFILL_INTERVAL_MS = 60_000 // 1 minute

let tokens = MAX_TOKENS
let lastRefill = Date.now()

function refillTokens() {
  const now = Date.now()
  const elapsed = now - lastRefill
  if (elapsed >= REFILL_INTERVAL_MS) {
    tokens = MAX_TOKENS
    lastRefill = now
  }
  else {
    // Partial refill based on elapsed time
    const refillAmount = Math.floor((elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS)
    if (refillAmount > 0) {
      tokens = Math.min(MAX_TOKENS, tokens + refillAmount)
      lastRefill = now
    }
  }
}

/**
 * Check if a Hardcover API call is allowed.
 * Returns `true` if within rate limit, `false` if exhausted.
 * Consumes one token on success.
 */
export function checkHardcoverRateLimit(): boolean {
  refillTokens()
  if (tokens > 0) {
    tokens--
    return true
  }
  return false
}
