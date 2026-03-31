import { eq } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks, userBookShelves, shelves } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const shelfId = getRouterParam(event, 'id')

  if (!shelfId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing shelf ID' })
  }

  // Verify shelf belongs to user
  const [shelf] = await db
    .select({ id: shelves.id, name: shelves.name, slug: shelves.slug })
    .from(shelves)
    .where(eq(shelves.id, shelfId))
    .limit(1)

  if (!shelf) {
    throw createError({ statusCode: 404, statusMessage: 'Shelf not found' })
  }

  // Get books on this shelf with their user-book data
  const rows = await db
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
      rating: userBooks.rating,
      notes: userBooks.notes,
      currentPage: userBooks.currentPage,
      progressPercent: userBooks.progressPercent,
      dateAdded: userBooks.dateAdded,
      dateStarted: userBooks.dateStarted,
      dateFinished: userBooks.dateFinished,
    })
    .from(userBookShelves)
    .innerJoin(userBooks, eq(userBookShelves.userBookId, userBooks.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBookShelves.shelfId, shelfId))

  return { shelf, books: rows }
})
