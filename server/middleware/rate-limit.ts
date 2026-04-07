import { enforceRateLimit } from '../utils/rate-limit'

/**
 * Rate-limit sensitive endpoints:
 * - Auth (sign-in, sign-up, password reset): 10 requests / 60s per IP
 * - Book search: 30 requests / 60s per IP
 */
export default defineEventHandler((event) => {
  const path = event.path

  // Auth endpoints — strict limit
  if (path.startsWith('/api/auth/sign-in') || path.startsWith('/api/auth/sign-up')) {
    enforceRateLimit(event, 'auth-login', 10, 60)
  }
  else if (path.startsWith('/api/auth/forget-password') || path.startsWith('/api/auth/reset-password')) {
    enforceRateLimit(event, 'auth-reset', 5, 60)
  }

  // Book search / cover lookups — moderate limit
  else if (path.startsWith('/api/books/search')) {
    enforceRateLimit(event, 'book-search', 30, 60)
  }
  else if (path.match(/^\/api\/books\/[^/]+\/covers/)) {
    enforceRateLimit(event, 'book-covers', 20, 60)
  }
})
