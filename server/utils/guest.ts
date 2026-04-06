import { readFileSync } from 'fs'
import { join } from 'path'

let guestData: Record<string, unknown> | null = null

/**
 * Load and cache guest data from the static JSON file.
 * Returns null if the file doesn't exist (dev without seed).
 */
export function getGuestData(): Record<string, unknown> | null {
  if (guestData) return guestData
  try {
    const raw = readFileSync(join(process.cwd(), 'public/guest-data.json'), 'utf-8')
    guestData = JSON.parse(raw)
    return guestData
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
