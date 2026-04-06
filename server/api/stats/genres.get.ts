import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const query = getQuery(event)
  const year = Number(query.year) || null

  // Unnest genres array, group by genre, count finished books
  const rows = await db
    .select({
      genre: sql<string>`unnest(${books.genres})`,
      count: sql<number>`count(distinct ${userBooks.id})::int`,
    })
    .from(userBooks)
    .innerJoin(books, eq(books.id, userBooks.bookId))
    .where(and(
      eq(userBooks.userId, userId),
      isNotNull(userBooks.dateFinished),
      sql`${books.genres} is not null`,
      sql`array_length(${books.genres}, 1) > 0`,
      ...(year ? [sql`extract(year from ${userBooks.dateFinished})::int = ${year}`] : []),
    ))
    .groupBy(sql`unnest(${books.genres})`)
    .orderBy(sql`count(distinct ${userBooks.id}) desc`)
    .limit(12)

  const totalBooks = rows.reduce((sum, r) => sum + r.count, 0)

  const genres = rows.map(r => ({
    genre: r.genre,
    count: r.count,
    percentage: totalBooks > 0 ? Math.round((r.count / totalBooks) * 100) : 0,
  }))

  return { genres, totalBooks }
})
