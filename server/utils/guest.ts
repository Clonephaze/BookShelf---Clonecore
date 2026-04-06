import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

let guestData: Record<string, unknown> | null = null

/**
 * Load and cache guest data from the static JSON file.
 * Tries multiple resolution strategies to work in both dev and production.
 */
export function getGuestData(): Record<string, unknown> | null {
  if (guestData) return guestData

  const candidates = [
    resolve(process.cwd(), 'public/guest-data.json'),
    resolve(process.cwd(), '.output/public/guest-data.json'),
  ]

  // In dev, Nitro's CWD may differ — try dirname of this file
  try {
    const thisDir = dirname(fileURLToPath(import.meta.url))
    candidates.push(resolve(thisDir, '../../public/guest-data.json'))
    candidates.push(resolve(thisDir, '../../../public/guest-data.json'))
  }
  catch {
    // import.meta.url may not resolve in all environments
  }

  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, 'utf-8')
      guestData = JSON.parse(raw)
      return guestData
    }
    catch {
      continue
    }
  }

  return null
}

/**
 * Check if the current request is from a guest session.
 */
export function isGuestRequest(event: Parameters<typeof getCookie>[0]): boolean {
  return getCookie(event, 'bookshelf-guest') === 'true'
}
