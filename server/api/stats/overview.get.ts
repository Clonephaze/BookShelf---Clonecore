import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const now = new Date()
  const currentYear = now.getFullYear()

  const finishedFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.dateFinished),
  )

  // Run all aggregate queries in parallel
  const [
    [totals],
    [thisYear],
    [avgDays],
  ] = await Promise.all([
    // Total books, pages, avg rating, avg pages
    db
      .select({
        totalBooks: sql<number>`count(*)::int`,
        totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
        avgRating: sql<number | null>`round(avg(${userBooks.rating})::numeric, 2)`,
        avgPages: sql<number | null>`round(avg(${books.pageCount})::numeric, 0)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(finishedFilter),

    // Books finished this year
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(and(
        finishedFilter,
        sql`extract(year from ${userBooks.dateFinished})::int = ${currentYear}`,
      )),

    // Average days to finish (only where both dates exist)
    db
      .select({
        avgDays: sql<number | null>`round(avg(
          extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400
        )::numeric, 1)`,
      })
      .from(userBooks)
      .where(and(
        finishedFilter,
        isNotNull(userBooks.dateStarted),
        sql`${userBooks.dateFinished} > ${userBooks.dateStarted}`,
      )),
  ])

  // Books per month this year (for sparkline)
  const booksPerMonthThisYear = await db
    .select({
      month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(userBooks)
    .where(and(
      finishedFilter,
      sql`extract(year from ${userBooks.dateFinished})::int = ${currentYear}`,
    ))
    .groupBy(sql`extract(month from ${userBooks.dateFinished})`)
    .orderBy(sql`extract(month from ${userBooks.dateFinished})`)

  // Fill in all months up to current
  const currentMonth = now.getMonth() + 1
  const sparkline: number[] = []
  for (let m = 1; m <= currentMonth; m++) {
    const found = booksPerMonthThisYear.find(r => r.month === m)
    sparkline.push(found?.count ?? 0)
  }

  return {
    totalBooks: totals?.totalBooks ?? 0,
    totalPages: totals?.totalPages ?? 0,
    avgRating: totals?.avgRating ? Number(totals.avgRating) : null,
    avgPages: totals?.avgPages ? Number(totals.avgPages) : null,
    avgDaysToFinish: avgDays?.avgDays ? Number(avgDays.avgDays) : null,
    booksThisYear: thisYear?.count ?? 0,
    currentYear,
    sparkline,
  }
})
