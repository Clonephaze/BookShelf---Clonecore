import { eq, and, or } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingSessions, userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  // Find active or paused session
  const [active] = await db
    .select({
      id: readingSessions.id,
      userBookId: readingSessions.userBookId,
      startedAt: readingSessions.startedAt,
      durationSeconds: readingSessions.durationSeconds,
      timerMode: readingSessions.timerMode,
      timerDurationSeconds: readingSessions.timerDurationSeconds,
      startPage: readingSessions.startPage,
      endPage: readingSessions.endPage,
      status: readingSessions.status,
      notes: readingSessions.notes,
      createdAt: readingSessions.createdAt,
      // Book info
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverSmall: books.coverUrlSmall,
      bookCover: books.coverUrl,
      bookPageCount: books.pageCount,
      currentPage: userBooks.currentPage,
    })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(
      eq(readingSessions.userId, userId),
      or(
        eq(readingSessions.status, 'active'),
        eq(readingSessions.status, 'paused'),
      ),
    ))
    .limit(1)

  if (!active) {
    return null
  }

  return active
})
