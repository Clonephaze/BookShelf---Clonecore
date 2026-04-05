import { eq, and, sql, isNotNull, desc } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const finishedFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.dateFinished),
  )

  const [topAuthors, [counts]] = await Promise.all([
    // Top authors by books read (finished), with a representative cover
    db
      .select({
        author: books.author,
        bookCount: sql<number>`count(*)::int`,
        coverUrlSmall: sql<string | null>`(array_agg(${books.coverUrlSmall} order by ${userBooks.dateFinished} desc))[1]`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(finishedFilter)
      .groupBy(books.author)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // Unique vs total
    db
      .select({
        uniqueAuthors: sql<number>`count(distinct ${books.author})::int`,
        totalBooks: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(finishedFilter),
  ])

  const uniqueAuthors = counts?.uniqueAuthors ?? 0
  const totalBooks = counts?.totalBooks ?? 0
  const repeatAuthors = topAuthors.filter(a => a.bookCount > 1).length

  return {
    uniqueAuthors,
    totalBooks,
    repeatAuthors,
    topAuthors: topAuthors.map(a => ({
      author: a.author,
      bookCount: a.bookCount,
      coverUrlSmall: a.coverUrlSmall,
    })),
  }
})
