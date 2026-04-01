import { defineStore } from 'pinia'
import type { BookSearchResult } from '~~/server/services/book-api/types'

export type SearchSortBy = 'best-match' | 'relevance' | 'title' | 'author' | 'newest'

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const results = ref<BookSearchResult[]>([])
  const loading = ref(false)
  const searched = ref(false)
  const errorMessage = ref('')
  const libraryBookIds = ref(new Set<string>())
  const sortBy = ref<SearchSortBy>('best-match')

  const filters = reactive({
    hasCover: false,
    hasPages: false,
    genre: '',
  })

  const availableGenres = computed(() => {
    const genres = new Set<string>()
    for (const book of results.value) {
      book.genres?.forEach(g => genres.add(g))
    }
    return [...genres].sort()
  })

  const filteredResults = computed(() => {
    let list = results.value
    if (filters.hasCover) list = list.filter(b => b.coverUrl)
    if (filters.hasPages) list = list.filter(b => b.pageCount)
    if (filters.genre) list = list.filter(b => b.genres?.includes(filters.genre))

    // Client-side sorts (best-match and relevance ordering comes from the server)
    if (sortBy.value === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    }
    else if (sortBy.value === 'author') {
      list = [...list].sort((a, b) => a.author.localeCompare(b.author))
    }
    else if (sortBy.value === 'newest') {
      list = [...list].sort((a, b) => {
        const da = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0
        const db = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0
        return db - da
      })
    }

    return list
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.hasCover) count++
    if (filters.hasPages) count++
    if (filters.genre) count++
    return count
  })

  function clearFilters() {
    filters.hasCover = false
    filters.hasPages = false
    filters.genre = ''
  }

  async function doSearch(q: string) {
    if (!q || q.length < 2) return
    query.value = q
    loading.value = true
    searched.value = true
    errorMessage.value = ''
    results.value = []
    sortBy.value = 'best-match'
    clearFilters()
    try {
      const data = await $fetch<{ results: BookSearchResult[], total: number }>('/api/books/search', {
        params: { q, limit: 20, sort: 'best-match' },
      })
      results.value = data.results
    }
    catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Search failed'
    }
    finally {
      loading.value = false
    }
  }

  /** Re-fetch with relevance sort when user switches to it */
  async function refetchWithSort(sort: 'best-match' | 'relevance') {
    if (!query.value || query.value.length < 2) return
    loading.value = true
    errorMessage.value = ''
    try {
      const data = await $fetch<{ results: BookSearchResult[], total: number }>('/api/books/search', {
        params: { q: query.value, limit: 20, sort },
      })
      results.value = data.results
    }
    catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Search failed'
    }
    finally {
      loading.value = false
    }
  }

  function markInLibrary(key: string) {
    libraryBookIds.value.add(key)
  }

  function isInLibrary(book: BookSearchResult): boolean {
    const key = book.isbn13 || book.isbn10 || book.title
    return libraryBookIds.value.has(key)
  }

  function isAdding(book: BookSearchResult, addingBooks: Set<string>): boolean {
    const key = book.isbn13 || book.isbn10 || book.title
    return addingBooks.has(key)
  }

  return {
    query,
    results,
    loading,
    searched,
    errorMessage,
    sortBy,
    filters,
    libraryBookIds,
    availableGenres,
    filteredResults,
    activeFilterCount,
    clearFilters,
    doSearch,
    refetchWithSort,
    markInLibrary,
    isInLibrary,
    isAdding,
  }
})
