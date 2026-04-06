import type { ShelfData } from '~/stores/library'

/**
 * Client-side search across the user's library.
 * Filters books by title and author, returning matching shelves
 * with only the books that match the query.
 */
export function useLibrarySearch(shelves: Ref<ShelfData[]>) {
  const query = ref('')

  const normalise = (s: string) => s.toLowerCase().replace(/['']/g, "'").trim()

  const filteredShelves = computed(() => {
    const q = normalise(query.value)
    if (!q || q.length < 2) return shelves.value

    return shelves.value
      .map((shelf) => {
        const matchingBooks = shelf.books.filter((book) => {
          return normalise(book.title).includes(q)
            || normalise(book.author).includes(q)
        })
        return { ...shelf, books: matchingBooks, bookCount: matchingBooks.length }
      })
      .filter(shelf => shelf.books.length > 0)
  })

  const totalMatches = computed(() =>
    filteredShelves.value.reduce((sum, s) => sum + s.books.length, 0),
  )

  const isFiltering = computed(() => normalise(query.value).length >= 2)

  function clear() {
    query.value = ''
  }

  return { query, filteredShelves, totalMatches, isFiltering, clear }
}
