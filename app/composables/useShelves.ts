export interface ShelfItem {
  id: string
  name: string
  slug: string
  icon: string | null
  isDefault: boolean
  position: number
}

// Module-level fetch promise prevents simultaneous duplicate fetches
let _fetchPromise: Promise<void> | null = null

export function useShelves() {
  const shelves = useState<ShelfItem[]>('shelves', () => [])
  const loaded = useState<boolean>('shelves:loaded', () => false)

  async function fetchShelves(force = false) {
    if (loaded.value && !force) return

    // Collapse simultaneous calls into one request
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = (async () => {
      try {
        const data = await $fetch<ShelfItem[]>('/api/shelves')
        shelves.value = data
        loaded.value = true
      }
      catch {
        // Leave previous data in place; caller handles error display
      }
      finally {
        _fetchPromise = null
      }
    })()

    return _fetchPromise
  }

  /** Call after creating, renaming, or deleting a shelf to get fresh data */
  async function invalidateShelves() {
    loaded.value = false
    await fetchShelves(true)
  }

  return { shelves, loaded, fetchShelves, invalidateShelves }
}
