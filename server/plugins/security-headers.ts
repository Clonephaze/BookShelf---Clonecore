const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Open Library: covers.openlibrary.org
  // Google Books: books.google.com initial request, then CDN via *.googleusercontent.com and *.gstatic.com
  "img-src 'self' data: blob: https://covers.openlibrary.org https://*.google.com https://*.googleusercontent.com https://*.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response) => {
    response.headers['x-content-type-options'] ??= 'nosniff'
    response.headers['x-frame-options'] ??= 'DENY'
    response.headers['x-xss-protection'] ??= '0'
    response.headers['referrer-policy'] ??= 'strict-origin-when-cross-origin'
    response.headers['permissions-policy'] ??= 'camera=(), microphone=(), geolocation=(), payment=()'
    response.headers['content-security-policy'] ??= CSP
  })
})
