import { defineStore } from 'pinia'

export interface ShelfItem {
  id: string
  name: string
  slug: string
  icon: string | null
  isDefault: boolean
  position: number
}

export const useShelvesStore = defineStore('shelves', () => {
  const shelves = ref<ShelfItem[]>([])
  const loaded = ref(false)

  // Collapses simultaneous calls into one request
  let _fetchPromise: Promise<void> | null = null

  async function fetch(force = false) {
    if (loaded.value && !force) return
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = (async () => {
      try {
        const { isGuest } = useGuest()
        const url = isGuest.value ? '/api/guest/shelves' : '/api/shelves'
        const data = await $fetch<ShelfItem[]>(url)
        shelves.value = data
        loaded.value = true
      }
      catch {
        // Leave stale data in place
      }
      finally {
        _fetchPromise = null
      }
    })()

    return _fetchPromise
  }

  async function invalidate() {
    loaded.value = false
    await fetch(true)
  }

  return { shelves, loaded, fetch, invalidate }
})
