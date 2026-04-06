import { eq, and, desc, sql } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingSessions, userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0
  const userBookId = query.bookId as string | undefined

  const conditions = [
    eq(readingSessions.userId, userId),
    sql`${readingSessions.status} IN ('completed', 'abandoned')`,
  ]

  if (userBookId) {
    conditions.push(eq(readingSessions.userBookId, userBookId))
  }

  const rows = await db
    .select({
      id: readingSessions.id,
      userBookId: readingSessions.userBookId,
      startedAt: readingSessions.startedAt,
      endedAt: readingSessions.endedAt,
      durationSeconds: readingSessions.durationSeconds,
      timerMode: readingSessions.timerMode,
      startPage: readingSessions.startPage,
      endPage: readingSessions.endPage,
      pagesRead: readingSessions.pagesRead,
      status: readingSessions.status,
      notes: readingSessions.notes,
      // Book info
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverSmall: books.coverUrlSmall,
    })
    .from(readingSessions)
    .innerJoin(userBooks, eq(readingSessions.userBookId, userBooks.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(...conditions))
    .orderBy(desc(readingSessions.startedAt))
    .limit(limit)
    .offset(offset)

  return rows
})
