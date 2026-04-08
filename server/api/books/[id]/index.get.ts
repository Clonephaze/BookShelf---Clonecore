import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks, userBookShelves, shelves } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userBookId = getRouterParam(event, 'id')

  if (!userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing book ID' })
  }

  // Get user-book with full book data
  const [row] = await db
    .select({
      userBookId: userBooks.id,
      bookId: books.id,
      title: books.title,
      author: books.author,
      additionalAuthors: books.additionalAuthors,
      isbn13: books.isbn13,
      isbn10: books.isbn10,
      coverUrl: books.coverUrl,
      coverUrlSmall: books.coverUrlSmall,
      pageCount: books.pageCount,
      publishedDate: books.publishedDate,
      genres: books.genres,
      description: books.description,
      publisher: books.publisher,
      openLibraryKey: books.openLibraryKey,
      googleBooksId: books.googleBooksId,
      hardcoverSlug: books.hardcoverSlug,
      hardcoverId: books.hardcoverId,
      audioSeconds: books.audioSeconds,
      hasAudiobook: books.hasAudiobook,
      contentWarnings: books.contentWarnings,
      moods: books.moods,
      rating: userBooks.rating,
      notes: userBooks.notes,
      currentPage: userBooks.currentPage,
      progressPercent: userBooks.progressPercent,
      totalMinutes: userBooks.totalMinutes,
      currentMinutes: userBooks.currentMinutes,
      dateAdded: userBooks.dateAdded,
      dateStarted: userBooks.dateStarted,
      dateFinished: userBooks.dateFinished,
      updatedAt: userBooks.updatedAt,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  // Get shelves this book is on
  const bookShelves = await db
    .select({
      shelfId: shelves.id,
      shelfName: shelves.name,
      shelfSlug: shelves.slug,
      isPrimary: userBookShelves.isPrimary,
    })
    .from(userBookShelves)
    .innerJoin(shelves, eq(userBookShelves.shelfId, shelves.id))
    .where(eq(userBookShelves.userBookId, userBookId))

  setResponseHeader(event, 'Cache-Control', 'private, max-age=120')
  return { ...row, shelves: bookShelves }
})
