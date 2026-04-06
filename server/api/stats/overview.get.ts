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

  const finishedFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.dateFinished),
  )

  const yearFilter = and(
    finishedFilter,
    sql`extract(year from ${userBooks.dateFinished})::int = ${year}`,
  )

  // Run all aggregate queries in parallel
  const [
    [totals],
    [thisYear],
    [avgDays],
    [allTime],
  ] = await Promise.all([
    // Total books, pages, avg rating, avg pages (for selected year)
    db
      .select({
        totalBooks: sql<number>`count(*)::int`,
        totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
        avgRating: sql<number | null>`round(avg(${userBooks.rating})::numeric, 2)`,
        avgPages: sql<number | null>`round(avg(${books.pageCount})::numeric, 0)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter),

    // Books finished this year (same as totals for selected year)
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(yearFilter),

    // Average days to finish (for selected year)
    db
      .select({
        avgDays: sql<number | null>`round(avg(
          extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400
        )::numeric, 1)`,
      })
      .from(userBooks)
      .where(and(
        yearFilter,
        isNotNull(userBooks.dateStarted),
        sql`${userBooks.dateFinished} > ${userBooks.dateStarted}`,
      )),

    // All-time finished count (for empty state detection)
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(finishedFilter),
  ])

  // Books per month for selected year (for sparkline)
  const now = new Date()
  const booksPerMonthThisYear = await db
    .select({
      month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(userBooks)
    .where(yearFilter)
    .groupBy(sql`extract(month from ${userBooks.dateFinished})`)
    .orderBy(sql`extract(month from ${userBooks.dateFinished})`)

  // Fill in all months up to current (or 12 if viewing past year)
  const maxMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const sparkline: number[] = []
  for (let m = 1; m <= maxMonth; m++) {
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
    allTimeTotalBooks: allTime?.count ?? 0,
    currentYear: year,
    sparkline,
  }
})
