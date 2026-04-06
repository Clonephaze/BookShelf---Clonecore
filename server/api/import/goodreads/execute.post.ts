// ============================================
// Goodreads Import — Execute Endpoint
// ============================================
// POST /api/import/goodreads/execute
// Accepts parsed CSV rows (from preview), enriches via
// Book APIs with rate limiting, and imports into the user's
// library. Returns import statistics.
// ============================================

import { eq, or, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks, userBookShelves, shelves } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'
import { parseGoodreadsCsv, mapGoodreadsShelf } from '../../../utils/goodreads-parser'
import { searchBooks } from '../../../services/book-api'

interface ImportResult {
  imported: number
  skippedExisting: number
  skippedError: number
  enriched: number
  notMatched: number
  details: ImportBookDetail[]
}

interface ImportBookDetail {
  title: string
  author: string
  status: 'imported' | 'skipped-existing' | 'error'
  enriched: boolean
  error?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()

  const body = await readBody<{ csv: string; skipExisting?: boolean }>(event)
  if (!body?.csv || typeof body.csv !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing CSV data',
    })
  }

  // Parse CSV
  const rows = parseGoodreadsCsv(body.csv)
  if (rows.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'No books found in CSV',
    })
  }

  // Cap at 1000 books per import
  if (rows.length > 1000) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Import limited to 1000 books at a time',
    })
  }

  const config = useRuntimeConfig()

  // Ensure user's default shelves exist
  const userShelves = await db
    .select({ id: shelves.id, slug: shelves.slug })
    .from(shelves)
    .where(eq(shelves.userId, session.user.id))

  const shelfMap = new Map(userShelves.map(s => [s.slug, s.id]))

  // Create default shelves if they don't exist
  const defaultShelves = [
    { slug: 'want-to-read', name: 'Want to Read', position: 0 },
    { slug: 'currently-reading', name: 'Currently Reading', position: 1 },
    { slug: 'read', name: 'Read', position: 2 },
  ]

  for (const def of defaultShelves) {
    if (!shelfMap.has(def.slug)) {
      const [created] = await db.insert(shelves).values({
        userId: session.user.id,
        name: def.name,
        slug: def.slug,
        position: def.position,
        isDefault: true,
      }).returning({ id: shelves.id })
      if (created) {
        shelfMap.set(def.slug, created.id)
      }
    }
  }

  const result: ImportResult = {
    imported: 0,
    skippedExisting: 0,
    skippedError: 0,
    enriched: 0,
    notMatched: 0,
    details: [],
  }

  // Process books in batches with rate limiting
  const BATCH_SIZE = 5
  const BATCH_DELAY_MS = 1000 // 1 second between batches to respect API limits

  for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + BATCH_SIZE)

    // Rate limit: pause between batches (except the first)
    if (batchStart > 0) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }

    // Process each book in the batch concurrently
    await Promise.all(batch.map(async (row) => {
      const detail: ImportBookDetail = {
        title: row.title,
        author: row.author,
        status: 'imported',
        enriched: false,
      }

      try {
        // Step 1: Find or enrich book via API
        let bookId: string | null = null
        let enrichedData = null

        // Check if book already exists in DB by ISBN
        const conditions = []
        if (row.isbn13) conditions.push(eq(books.isbn13, row.isbn13))
        if (row.isbn10) conditions.push(eq(books.isbn10, row.isbn10))

        if (conditions.length > 0) {
          const [existing] = await db
            .select({ id: books.id })
            .from(books)
            .where(or(...conditions))
            .limit(1)

          if (existing) {
            bookId = existing.id
          }
        }

        // If book not in DB, search API to enrich metadata
        if (!bookId) {
          const searchQuery = row.isbn13 || row.isbn10 || `${row.title} ${row.author}`
          try {
            const searchResult = await searchBooks(
              searchQuery,
              1,
              config.googleBooksApiKey as string | undefined,
            )
            if (searchResult.results.length > 0) {
              enrichedData = searchResult.results[0]
              detail.enriched = true
            }
          }
          catch {
            // API search failed — we'll use CSV data only
            result.notMatched++
          }
        }

        // Step 2: Insert or find the book record
        if (!bookId) {
          const bookValues = {
            title: enrichedData?.title || row.title,
            author: enrichedData?.author || row.author,
            additionalAuthors: enrichedData?.additionalAuthors?.length
              ? enrichedData.additionalAuthors
              : row.additionalAuthors.length > 0 ? row.additionalAuthors : null,
            isbn13: enrichedData?.isbn13 || row.isbn13,
            isbn10: enrichedData?.isbn10 || row.isbn10,
            coverUrl: enrichedData?.coverUrl ?? null,
            coverUrlSmall: enrichedData?.coverUrlSmall ?? null,
            pageCount: enrichedData?.pageCount || row.pageCount,
            publishedDate: enrichedData?.publishedDate
              || (row.originalPublicationYear?.toString() ?? row.yearPublished?.toString() ?? null),
            genres: enrichedData?.genres ?? null,
            description: enrichedData?.description ?? null,
            publisher: enrichedData?.publisher || row.publisher,
            openLibraryKey: enrichedData?.openLibraryKey ?? null,
            googleBooksId: enrichedData?.googleBooksId ?? null,
          }

          const [inserted] = await db.insert(books).values(bookValues).returning({ id: books.id })
          if (!inserted) {
            detail.status = 'error'
            detail.error = 'Failed to insert book record'
            result.skippedError++
            result.details.push(detail)
            return
          }
          bookId = inserted.id
          if (detail.enriched) result.enriched++
        }

        // Step 3: Check if already in user's library
        const [existingUserBook] = await db
          .select({ id: userBooks.id })
          .from(userBooks)
          .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, bookId)))
          .limit(1)

        if (existingUserBook) {
          detail.status = 'skipped-existing'
          result.skippedExisting++
          result.details.push(detail)
          return
        }

        // Step 4: Create user-book entry
        const targetShelfSlug = mapGoodreadsShelf(row.exclusiveShelf)
        const shelfId = shelfMap.get(targetShelfSlug)
        if (!shelfId) {
          detail.status = 'error'
          detail.error = `Shelf not found: ${targetShelfSlug}`
          result.skippedError++
          result.details.push(detail)
          return
        }

        const [newUserBook] = await db.insert(userBooks).values({
          userId: session.user.id,
          bookId,
          rating: row.myRating,
          notes: row.myReview || row.privateNotes || null,
          dateAdded: row.dateAdded ? new Date(row.dateAdded) : new Date(),
          dateFinished: row.dateRead ? new Date(row.dateRead) : null,
          currentPage: targetShelfSlug === 'read' ? (row.pageCount ?? null) : null,
        }).returning({ id: userBooks.id })

        if (!newUserBook) {
          detail.status = 'error'
          detail.error = 'Failed to create user book entry'
          result.skippedError++
          result.details.push(detail)
          return
        }

        // Step 5: Add to shelf
        await db.insert(userBookShelves).values({
          userBookId: newUserBook.id,
          shelfId,
          isPrimary: true,
        })

        detail.status = 'imported'
        result.imported++
      }
      catch (err) {
        detail.status = 'error'
        detail.error = err instanceof Error ? err.message : 'Unknown error'
        result.skippedError++
      }

      result.details.push(detail)
    }))
  }

  return result
})
