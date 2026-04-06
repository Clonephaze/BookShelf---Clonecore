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
    isNotNull(userBooks.dateStarted),
    sql`extract(year from ${userBooks.dateFinished})::int = ${year}`,
    sql`${userBooks.dateFinished} > ${userBooks.dateStarted}`,
  )

  const [bucketRows, extremeRows, monthlyRows] = await Promise.all([
    // Distribution buckets: how many days to finish
    db
      .select({
        bucket: sql<string>`case
          when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 7 then 'Under a week'
          when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 14 then '1–2 weeks'
          when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 30 then '2–4 weeks'
          when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 90 then '1–3 months'
          else '3+ months'
        end`,
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(yearFilter)
      .groupBy(sql`case
        when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 7 then 'Under a week'
        when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 14 then '1–2 weeks'
        when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 30 then '2–4 weeks'
        when extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400 < 90 then '1–3 months'
        else '3+ months'
      end`),

    // Fastest and slowest books
    db
      .select({
        title: books.title,
        author: books.author,
        pageCount: books.pageCount,
        coverUrlSmall: books.coverUrlSmall,
        days: sql<number>`round(extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400)::int`,
        pagesPerDay: sql<number>`round((${books.pageCount}::numeric / nullif(extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400, 0))::numeric, 1)`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter)
      .orderBy(sql`extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400`),

    // Monthly average days to finish (trend over the year)
    db
      .select({
        month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
        avgDays: sql<number>`round(avg(extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400)::numeric, 1)`,
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(yearFilter)
      .groupBy(sql`extract(month from ${userBooks.dateFinished})`)
      .orderBy(sql`extract(month from ${userBooks.dateFinished})`),
  ])

  // Sort buckets in natural order
  const bucketOrder = ['Under a week', '1–2 weeks', '2–4 weeks', '1–3 months', '3+ months']
  const distribution = bucketOrder
    .map(label => ({
      label,
      count: bucketRows.find(b => b.bucket === label)?.count ?? 0,
    }))
    .filter(b => b.count > 0 || bucketRows.length > 0)

  // Build monthly trend with zeros for missing months
  const currentMonth = year === new Date().getFullYear() ? new Date().getMonth() + 1 : 12
  const monthlyTrend = Array.from({ length: currentMonth }, (_, i) => {
    const m = i + 1
    const row = monthlyRows.find(r => r.month === m)
    return {
      month: m,
      label: new Date(year, m - 1).toLocaleString('en-US', { month: 'short' }),
      avgDays: row?.avgDays ?? null,
      count: row?.count ?? 0,
    }
  })

  const fastest = extremeRows.length > 0 ? extremeRows[0] : null
  const slowest = extremeRows.length > 1 ? extremeRows[extremeRows.length - 1] : null

  // Overall avg
  const totalDays = extremeRows.reduce((sum, r) => sum + r.days, 0)
  const avgDays = extremeRows.length > 0 ? Math.round((totalDays / extremeRows.length) * 10) / 10 : null
  const totalPagesPerDay = extremeRows.reduce((sum, r) => sum + (r.pagesPerDay ?? 0), 0)
  const avgPagesPerDay = extremeRows.length > 0 ? Math.round((totalPagesPerDay / extremeRows.length) * 10) / 10 : null

  return {
    year,
    totalTracked: extremeRows.length,
    avgDays,
    avgPagesPerDay,
    distribution,
    fastest,
    slowest,
    monthlyTrend,
  }
})
