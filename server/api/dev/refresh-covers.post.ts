import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { books } from '../../database/schema'
import { searchBooks } from '../../services/book-api'
import { searchOpenLibrary } from '../../services/book-api/open-library'

const OL_COVER_BASE = 'https://covers.openlibrary.org/b'

/** HEAD-check an OL cover URL. Returns true if a real image exists. */
async function coverExists(url: string): Promise<boolean> {
  try {
    const resp = await $fetch.raw(url, { method: 'HEAD', timeout: 4000 })
    return resp.status === 200
  }
  catch {
    return false
  }
}

/**
 * Try to find a valid OL cover for a book. Tries multiple strategies:
 * 1. ISBN-based URL (book's ISBNs, then any ISBNs from search)
 * 2. Cover ID from OL search results
 * Returns { coverUrl, coverUrlSmall } or null.
 */
async function findOLCover(
  bookIsbns: string[],
  olQuery: string,
): Promise<{ coverUrl: string, coverUrlSmall: string } | null> {
  // Strategy 1: Search OL and use cover_i-based URLs (most reliable)
  try {
    const olResults = await searchOpenLibrary(olQuery, 5)
    for (const result of olResults) {
      if (result.coverUrl && await coverExists(result.coverUrl)) {
        return {
          coverUrl: result.coverUrl,
          coverUrlSmall: result.coverUrlSmall || result.coverUrl.replace('-L.', '-M.'),
        }
      }
    }
  }
  catch {
    // OL search failed, try ISBN fallback
  }

  // Strategy 2: Try ISBN-based URLs (may work when search doesn't return cover_i)
  for (const isbn of bookIsbns) {
    const url = `${OL_COVER_BASE}/isbn/${isbn}-L.jpg?default=false`
    if (await coverExists(url)) {
      return {
        coverUrl: `${OL_COVER_BASE}/isbn/${isbn}-L.jpg?default=false`,
        coverUrlSmall: `${OL_COVER_BASE}/isbn/${isbn}-M.jpg?default=false`,
      }
    }
  }

  return null
}

/**
 * Try upgrading a Google Books cover to zoom=3. Returns the zoom=3 URL
 * if it's a real image, null if it's the "image not available" placeholder.
 * Google's placeholder is exactly 9,103 bytes.
 */
async function tryGoogleZoom3(coverUrl: string): Promise<string | null> {
  const zoom3Url = coverUrl.replace(/zoom=\d/, 'zoom=3')
  if (zoom3Url === coverUrl) return null

  try {
    const resp = await $fetch.raw(zoom3Url, { method: 'HEAD', timeout: 4000 })
    const contentLength = parseInt(resp.headers.get('content-length') || '0')
    // Placeholder is 9,103 bytes; real covers are larger
    if (resp.status === 200 && contentLength > 0 && contentLength !== 9103) {
      return zoom3Url
    }
  }
  catch {
    // zoom=3 not available
  }

  return null
}

export default defineEventHandler(async (_event) => {
  if (process.env.BOOKSHELF_DEV !== 'true') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const db = useDB()
  const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY

  const allBooks = await db.select().from(books)

  const results: { id: string, title: string, status: string, coverSource?: string }[] = []

  for (const book of allBooks) {
    try {
      // Collect all known ISBNs for this book
      const isbns = [book.isbn13, book.isbn10].filter(Boolean) as string[]

      // Search merged APIs for metadata enrichment
      const query = book.isbn13 || book.isbn10 || `${book.title} ${book.author}`
      const { results: searchResults } = await searchBooks(query, 5, googleApiKey)

      const match = searchResults.find(r =>
        (book.isbn13 && r.isbn13 === book.isbn13)
        || (book.isbn10 && r.isbn10 === book.isbn10),
      ) || searchResults[0]

      // Add ISBNs from search match too
      if (match?.isbn13 && !isbns.includes(match.isbn13)) isbns.push(match.isbn13)
      if (match?.isbn10 && !isbns.includes(match.isbn10)) isbns.push(match.isbn10)

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      // --- Cover resolution: validate OL covers first, fall back to Google ---
      const olCover = await findOLCover(isbns, `${book.title} ${book.author}`)
      let coverSource = 'none'

      if (olCover) {
        updates.coverUrl = olCover.coverUrl
        updates.coverUrlSmall = olCover.coverUrlSmall
        coverSource = 'open-library'
      }
      else if (match?.coverUrl) {
        // Try zoom=3 for higher resolution, validate it's not the placeholder
        const zoom3Cover = await tryGoogleZoom3(match.coverUrl)
        updates.coverUrl = zoom3Cover || match.coverUrl
        updates.coverUrlSmall = match.coverUrlSmall || match.coverUrl
        coverSource = 'google-books'
      }

      // Fill in missing metadata (don't overwrite existing good data)
      if (match) {
        if (!book.description && match.description) updates.description = match.description
        if (!book.pageCount && match.pageCount) updates.pageCount = match.pageCount
        if (!book.publisher && match.publisher) updates.publisher = match.publisher
        if (!book.publishedDate && match.publishedDate) updates.publishedDate = match.publishedDate
        if (!book.genres?.length && match.genres?.length) updates.genres = match.genres
        if (!book.openLibraryKey && match.openLibraryKey) updates.openLibraryKey = match.openLibraryKey
        if (!book.googleBooksId && match.googleBooksId) updates.googleBooksId = match.googleBooksId
      }

      await db.update(books).set(updates).where(eq(books.id, book.id))

      const coverChanged = updates.coverUrl !== undefined && updates.coverUrl !== book.coverUrl
      results.push({
        id: book.id,
        title: book.title,
        status: coverChanged ? 'updated' : 'unchanged',
        coverSource,
      })

      // Be polite to Open Library's rate limit (~1 req/sec)
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error'
      results.push({ id: book.id, title: book.title, status: `error: ${message}` })
    }
  }

  return {
    total: allBooks.length,
    updated: results.filter(r => r.status === 'updated').length,
    unchanged: results.filter(r => r.status === 'unchanged').length,
    errors: results.filter(r => r.status.startsWith('error')).length,
    results,
  }
})
