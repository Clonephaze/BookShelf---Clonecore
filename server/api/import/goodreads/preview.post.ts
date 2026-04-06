// ============================================
// Goodreads Import — Preview Endpoint
// ============================================
// POST /api/import/goodreads/preview
// Accepts CSV text, parses it, returns preview data
// with shelf mappings and detected issues.
// ============================================

import { eq, or } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'
import { parseGoodreadsCsv, mapGoodreadsShelf } from '../../../utils/goodreads-parser'
import type { GoodreadsRow } from '../../../utils/goodreads-parser'

export interface ImportPreviewBook {
  index: number
  title: string
  author: string
  additionalAuthors: string[]
  isbn10: string | null
  isbn13: string | null
  rating: number | null
  pageCount: number | null
  dateRead: string | null
  dateAdded: string | null
  targetShelf: string // slug
  review: string | null
  notes: string | null
  readCount: number
  existsInLibrary: boolean
  issues: string[]
}

export interface ImportPreviewResponse {
  books: ImportPreviewBook[]
  totalParsed: number
  totalNew: number
  totalExisting: number
  issues: string[]
}

export default defineEventHandler(async (event) => {
  const _session = await requireServerSession(event)
  const db = useDB()

  const body = await readBody<{ csv: string }>(event)
  if (!body?.csv || typeof body.csv !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing CSV data',
    })
  }

  // Cap CSV size at 5MB
  if (body.csv.length > 5 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      statusMessage: 'CSV file too large (max 5MB)',
    })
  }

  let rows: GoodreadsRow[]
  try {
    rows = parseGoodreadsCsv(body.csv)
  }
  catch {
    throw createError({
      statusCode: 422,
      statusMessage: 'Could not parse CSV. Make sure this is a Goodreads export file.',
    })
  }

  if (rows.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'No books found in CSV. Make sure this is a Goodreads export file.',
    })
  }

  // Gather all ISBNs from the CSV to batch-check existing books
  const isbn13s = rows.map(r => r.isbn13).filter((v): v is string => !!v)
  const isbn10s = rows.map(r => r.isbn10).filter((v): v is string => !!v)

  // Find existing books in DB by ISBN
  const existingBooks = new Set<string>()

  if (isbn13s.length > 0 || isbn10s.length > 0) {
    const conditions = []
    if (isbn13s.length > 0) {
      for (const isbn of isbn13s) {
        conditions.push(eq(books.isbn13, isbn))
      }
    }
    if (isbn10s.length > 0) {
      for (const isbn of isbn10s) {
        conditions.push(eq(books.isbn10, isbn))
      }
    }

    if (conditions.length > 0) {
      const found = await db
        .select({
          isbn13: books.isbn13,
          isbn10: books.isbn10,
          bookId: books.id,
        })
        .from(books)
        .where(or(...conditions))

      // Check which of those are already in *this user's* library
      const bookIds = found.map(b => b.bookId)
      if (bookIds.length > 0) {
        const userBookEntries = await db
          .select({ bookId: userBooks.bookId })
          .from(userBooks)
          .where(or(...bookIds.map(id => eq(userBooks.bookId, id))))

        const userBookSet = new Set(userBookEntries
          .filter(ub => ub.bookId !== null)
          .map(ub => ub.bookId))

        for (const fb of found) {
          if (userBookSet.has(fb.bookId)) {
            if (fb.isbn13) existingBooks.add(fb.isbn13)
            if (fb.isbn10) existingBooks.add(fb.isbn10)
          }
        }
      }
    }
  }

  const globalIssues: string[] = []
  const previewBooks: ImportPreviewBook[] = []

  for (const row of rows) {
    const i = rows.indexOf(row)
    const issues: string[] = []

    if (!row.title) {
      issues.push('Missing title')
    }
    if (!row.isbn10 && !row.isbn13) {
      issues.push('No ISBN — will search by title/author')
    }
    if (!row.pageCount) {
      issues.push('No page count')
    }

    const existsInLibrary = !!(
      (row.isbn13 && existingBooks.has(row.isbn13))
      || (row.isbn10 && existingBooks.has(row.isbn10))
    )

    previewBooks.push({
      index: i,
      title: row.title,
      author: row.author,
      additionalAuthors: row.additionalAuthors,
      isbn10: row.isbn10,
      isbn13: row.isbn13,
      rating: row.myRating,
      pageCount: row.pageCount,
      dateRead: row.dateRead?.toISOString() ?? null,
      dateAdded: row.dateAdded?.toISOString() ?? null,
      targetShelf: mapGoodreadsShelf(row.exclusiveShelf),
      review: row.myReview,
      notes: row.privateNotes,
      readCount: row.readCount,
      existsInLibrary,
      issues,
    })
  }

  const totalExisting = previewBooks.filter(b => b.existsInLibrary).length
  if (totalExisting > 0) {
    globalIssues.push(`${totalExisting} book(s) already in your library — these will be skipped`)
  }

  const noBooksWithIsbn = previewBooks.filter(b => !b.isbn10 && !b.isbn13).length
  if (noBooksWithIsbn > 0) {
    globalIssues.push(`${noBooksWithIsbn} book(s) have no ISBN — enrichment will use title/author search`)
  }

  return {
    books: previewBooks,
    totalParsed: rows.length,
    totalNew: rows.length - totalExisting,
    totalExisting,
    issues: globalIssues,
  } satisfies ImportPreviewResponse
})
