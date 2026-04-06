let guestDataCache: Record<string, unknown> | null = null

/**
 * Load and cache guest data.
 * Uses Nitro's useStorage (server assets) so it works on Vercel serverless.
 * Falls back to the public/ copy in dev if the asset isn't found.
 */
export async function getGuestData(): Promise<Record<string, unknown> | null> {
  if (guestDataCache) return guestDataCache

  try {
    // Nitro bundles server/assets/ into the production build
    const data = await useStorage('assets:server').getItem<Record<string, unknown>>('guest-data.json')
    if (data) {
      guestDataCache = data
      return guestDataCache
    }
  }
  catch {
    // Storage not available — try filesystem fallback (dev)
  }

  // Dev fallback: read from public/ via filesystem
  try {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    const raw = readFileSync(resolve(process.cwd(), 'public/guest-data.json'), 'utf-8')
    guestDataCache = JSON.parse(raw)
    return guestDataCache
  }
  catch {
    return null
  }
}

/**
 * Check if the current request is from a guest session.
 */
export function isGuestRequest(event: Parameters<typeof getCookie>[0]): boolean {
  return getCookie(event, 'bookshelf-guest') === 'true'
}
