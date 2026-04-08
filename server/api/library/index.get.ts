import { eq, asc } from 'drizzle-orm'
import { useDB } from '../../database'
import { books, userBooks, userBookShelves, shelves } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()

  // Get all shelves with their book counts and books
  const userShelves = await db
    .select()
    .from(shelves)
    .where(eq(shelves.userId, session.user.id))
    .orderBy(shelves.position)

  const shelfData = await Promise.all(
    userShelves.map(async (shelf) => {
      const shelfBooks = await db
        .select({
          userBookId: userBooks.id,
          bookId: books.id,
          title: books.title,
          author: books.author,
          coverUrl: books.coverUrl,
          coverUrlSmall: books.coverUrlSmall,
          pageCount: books.pageCount,
          rating: userBooks.rating,
          dateAdded: userBooks.dateAdded,
          dateFinished: userBooks.dateFinished,
          currentPage: userBooks.currentPage,
          progressPercent: userBooks.progressPercent,
          totalMinutes: userBooks.totalMinutes,
          currentMinutes: userBooks.currentMinutes,
          updatedAt: userBooks.updatedAt,
        })
        .from(userBookShelves)
        .innerJoin(userBooks, eq(userBookShelves.userBookId, userBooks.id))
        .innerJoin(books, eq(userBooks.bookId, books.id))
        .where(eq(userBookShelves.shelfId, shelf.id))
        .orderBy(asc(userBooks.dateAdded))

      return {
        ...shelf,
        books: shelfBooks,
        bookCount: shelfBooks.length,
      }
    })
  )

  setResponseHeader(event, 'Cache-Control', 'private, no-cache')
  return shelfData
})
