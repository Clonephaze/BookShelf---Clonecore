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

  const yearFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.dateFinished),
    sql`extract(year from ${userBooks.dateFinished})::int = ${year}`,
  )

  // Parallel queries
  const [monthlyRows, [totals], [paceCalc]] = await Promise.all([
    // Books per month for trend
    db
      .select({
        month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
        count: sql<number>`count(*)::int`,
        totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter)
      .groupBy(sql`extract(month from ${userBooks.dateFinished})`)
      .orderBy(sql`extract(month from ${userBooks.dateFinished})`),

    // Overall pace for the year
    db
      .select({
        totalBooks: sql<number>`count(*)::int`,
        totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter),

    // Days with dates, for pages-per-day calculation
    db
      .select({
        totalDaysReading: sql<number | null>`
          round(coalesce(sum(
            extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400
          ), 0)::numeric, 0)::int
        `,
      })
      .from(userBooks)
      .where(and(
        yearFilter,
        isNotNull(userBooks.dateStarted),
        sql`${userBooks.dateFinished} > ${userBooks.dateStarted}`,
      )),
  ])

  // Build monthly trend (fill zeros)
  const now = new Date()
  const currentMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const booksPerMonth: number[] = []
  for (let m = 1; m <= currentMonth; m++) {
    const found = monthlyRows.find(r => r.month === m)
    booksPerMonth.push(found?.count ?? 0)
  }

  const totalBooks = totals?.totalBooks ?? 0
  const totalPages = totals?.totalPages ?? 0
  const totalDaysReading = paceCalc?.totalDaysReading ?? 0

  // Pages per day (across actual reading days)
  const pagesPerDay = totalDaysReading > 0 ? Math.round(totalPages / totalDaysReading) : null

  // Books per month average
  const booksPerMonthAvg = currentMonth > 0 ? +(totalBooks / currentMonth).toFixed(1) : 0

  // Trend: compare last 3 months vs previous 3
  let trend: 'up' | 'down' | 'steady' = 'steady'
  if (booksPerMonth.length >= 6) {
    const recent = booksPerMonth.slice(-3).reduce((a, b) => a + b, 0)
    const previous = booksPerMonth.slice(-6, -3).reduce((a, b) => a + b, 0)
    if (recent > previous) trend = 'up'
    else if (recent < previous) trend = 'down'
  }

  setResponseHeader(event, 'Cache-Control', 'private, max-age=300')
  return {
    year,
    totalBooks,
    totalPages,
    pagesPerDay,
    booksPerMonthAvg,
    booksPerMonth,
    trend,
  }
})
