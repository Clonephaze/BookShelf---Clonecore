import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const query = getQuery(event)
  const year = Number(query.year) || new Date().getFullYear()
  const prevYear = year - 1

  function yearFilter(y: number) {
    return and(
      eq(userBooks.userId, userId),
      isNotNull(userBooks.dateFinished),
      sql`extract(year from ${userBooks.dateFinished})::int = ${y}`,
    )
  }

  const [currentRows, prevRows] = await Promise.all([
    db
      .select({
        totalBooks: sql<number>`count(*)::int`,
        totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
        avgRating: sql<number | null>`round(avg(${userBooks.rating})::numeric, 2)`,
        avgPages: sql<number>`coalesce(round(avg(${books.pageCount})::numeric, 0), 0)::int`,
        avgDaysToFinish: sql<number | null>`round(avg(
          case when ${userBooks.dateStarted} is not null and ${userBooks.dateFinished} > ${userBooks.dateStarted}
          then extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400
          else null end
        )::numeric, 1)`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter(year)),

    db
      .select({
        totalBooks: sql<number>`count(*)::int`,
        totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
        avgRating: sql<number | null>`round(avg(${userBooks.rating})::numeric, 2)`,
        avgPages: sql<number>`coalesce(round(avg(${books.pageCount})::numeric, 0), 0)::int`,
        avgDaysToFinish: sql<number | null>`round(avg(
          case when ${userBooks.dateStarted} is not null and ${userBooks.dateFinished} > ${userBooks.dateStarted}
          then extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400
          else null end
        )::numeric, 1)`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter(prevYear)),
  ])

  const current = currentRows[0] ?? { totalBooks: 0, totalPages: 0, avgRating: null, avgPages: 0, avgDaysToFinish: null }
  const previous = prevRows[0] ?? { totalBooks: 0, totalPages: 0, avgRating: null, avgPages: 0, avgDaysToFinish: null }

  function delta(curr: number | null, prev: number | null): number | null {
    if (curr == null || prev == null || prev === 0) return null
    return Math.round(((curr - prev) / prev) * 100)
  }

  return {
    year,
    previousYear: prevYear,
    current,
    previous,
    deltas: {
      totalBooks: delta(current.totalBooks, previous.totalBooks),
      totalPages: delta(current.totalPages, previous.totalPages),
      avgRating: delta(current.avgRating, previous.avgRating),
      avgPages: delta(current.avgPages, previous.avgPages),
      avgDaysToFinish: delta(current.avgDaysToFinish, previous.avgDaysToFinish),
    },
  }
})
