import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

interface CoverOption {
  url: string
  source: string
  label: string
}

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userBookId = getRouterParam(event, 'id')

  if (!userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing book ID' })
  }

  // Verify ownership and get book identifiers
  const [row] = await db
    .select({
      bookId: books.id,
      isbn13: books.isbn13,
      isbn10: books.isbn10,
      openLibraryKey: books.openLibraryKey,
      googleBooksId: books.googleBooksId,
      coverUrl: books.coverUrl,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  const covers: CoverOption[] = []
  const seen = new Set<string>()

  function addCover(url: string, source: string, label: string) {
    if (!url || seen.has(url)) return
    seen.add(url)
    covers.push({ url, source, label })
  }

  // Current cover
  if (row.coverUrl) {
    addCover(row.coverUrl, 'current', 'Current cover')
  }

  // Open Library covers by ISBN
  const isbn = row.isbn13 || row.isbn10
  if (isbn) {
    addCover(
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`,
      'openlibrary',
      'Open Library (ISBN)',
    )
  }

  // Open Library covers by OLID (works key → editions)
  if (row.openLibraryKey) {
    try {
      const editionsUrl = `https://openlibrary.org${row.openLibraryKey}/editions.json?limit=20`
      const editionsData = await $fetch<{ entries?: Array<{ covers?: number[], title?: string }> }>(editionsUrl)
      const entries = editionsData?.entries || []
      let count = 0
      for (const edition of entries) {
        if (edition.covers?.length && count < 6) {
          for (const coverId of edition.covers) {
            if (coverId > 0 && count < 6) {
              addCover(
                `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`,
                'openlibrary',
                `Open Library edition${edition.title ? ` (${edition.title})` : ''}`,
              )
              count++
            }
          }
        }
      }
    }
    catch {
      // OL editions fetch failed — continue with other sources
    }
  }

  // Google Books cover
  if (row.googleBooksId) {
    try {
      const config = useRuntimeConfig()
      let gbUrl = `https://www.googleapis.com/books/v1/volumes/${row.googleBooksId}`
      if (config.googleBooksApiKey) {
        gbUrl += `?key=${config.googleBooksApiKey}`
      }
      const vol = await $fetch<{ volumeInfo?: { imageLinks?: Record<string, string> } }>(gbUrl)
      const links = vol?.volumeInfo?.imageLinks || {}
      // Google Books provides various sizes
      for (const [key, url] of Object.entries(links)) {
        if (url) {
          const upgraded = url.replace('http://', 'https://').replace('&edge=curl', '')
          addCover(upgraded, 'google', `Google Books (${key})`)
        }
      }
    }
    catch {
      // Google Books fetch failed — continue
    }
  }

  return covers
})
