import { defineStore } from 'pinia'

export interface ShelfBook {
  userBookId: string
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  coverUrlSmall: string | null
  pageCount: number | null
  rating: number | null
  dateAdded: string | null
  dateFinished: string | null
  currentPage: number | null
  progressPercent: string | null
  totalMinutes: number | null
  currentMinutes: number | null
}

export interface ShelfData {
  id: string
  name: string
  slug: string
  position: number
  isDefault: boolean
  icon: string | null
  books: ShelfBook[]
  bookCount: number
}

export const useLibraryStore = defineStore('library', () => {
  const data = ref<ShelfData[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const revalidating = ref(false)

  async function fetch(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      data.value = await $fetch<ShelfData[]>('/api/library')
      loaded.value = true
    }
    catch {
      // Leave stale data in place
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Silent background refresh — shows cached data immediately, updates if server
   * returns different data. No loading skeleton shown.
   */
  async function revalidate() {
    if (!loaded.value) return fetch()
    if (revalidating.value) return
    revalidating.value = true
    try {
      const fresh = await $fetch<ShelfData[]>('/api/library')
      // Only update if something actually changed (book counts or IDs)
      const oldSig = JSON.stringify(data.value.map(s => ({ id: s.id, bookCount: s.bookCount, books: s.books.map(b => ({ id: b.userBookId, r: b.rating, p: b.currentPage, pp: b.progressPercent, cm: b.currentMinutes })) })))
      const newSig = JSON.stringify(fresh.map(s => ({ id: s.id, bookCount: s.bookCount, books: s.books.map(b => ({ id: b.userBookId, r: b.rating, p: b.currentPage, pp: b.progressPercent, cm: b.currentMinutes })) })))
      if (oldSig !== newSig) {
        data.value = fresh
      }
    }
    catch {
      // Keep stale data, stay silent
    }
    finally {
      revalidating.value = false
    }
  }

  async function invalidate() {
    loaded.value = false
    await fetch(true)
  }

  return { data, loaded, loading, revalidating, fetch, revalidate, invalidate }
})
