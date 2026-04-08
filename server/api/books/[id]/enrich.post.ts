import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'
import { fetchBookByISBN } from '../../../services/book-api/hardcover'

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
      hardcoverSlug: books.hardcoverSlug,
      audioSeconds: books.audioSeconds,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  // Fully enriched — nothing to do
  if (row.hardcoverSlug && row.audioSeconds != null) {
    return { enriched: false, reason: 'already-enriched' }
  }

  // No ISBN to look up
  if (!row.isbn13) {
    return { enriched: false, reason: 'no-isbn' }
  }

  // Fetch from Hardcover
  const enrichment = await fetchBookByISBN(row.isbn13)
  if (!enrichment) {
    return { enriched: false, reason: 'not-found' }
  }

  // Update the book record
  await db.update(books).set({
    hardcoverSlug: enrichment.hardcoverSlug,
    hardcoverId: enrichment.hardcoverId,
    audioSeconds: enrichment.audioSeconds,
    hasAudiobook: enrichment.hasAudiobook ?? false,
    contentWarnings: enrichment.contentWarnings,
    moods: enrichment.moods,
    updatedAt: new Date(),
  }).where(eq(books.id, row.bookId))

  return {
    enriched: true,
    data: enrichment,
  }
})
