import { eq, and, sql, isNotNull, desc, asc } from 'drizzle-orm'
import { useDB } from '../../../database'
import { userBooks, books } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const yearParam = getRouterParam(event, 'year')
  const year = Number(yearParam) || new Date().getFullYear()

  const yearFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.dateFinished),
    sql`extract(year from ${userBooks.dateFinished})::int = ${year}`,
  )

  const [
    [summary],
    monthlyRows,
    topRated,
    genreRows,
    fastestRead,
    firstBook,
    lastBook,
    shortestBook,
    longestBook,
  ] = await Promise.all([
    // Summary totals
    db.select({
      totalBooks: sql<number>`count(*)::int`,
      totalPages: sql<number>`coalesce(sum(${books.pageCount}), 0)::int`,
      avgRating: sql<number | null>`round(avg(${userBooks.rating})::numeric, 2)`,
      avgPages: sql<number | null>`round(avg(${books.pageCount})::numeric, 0)::int`,
      uniqueAuthors: sql<number>`count(distinct ${books.author})::int`,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId)).where(yearFilter),

    // Monthly breakdown
    db.select({
      month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
      count: sql<number>`count(*)::int`,
    }).from(userBooks).where(yearFilter)
      .groupBy(sql`extract(month from ${userBooks.dateFinished})`)
      .orderBy(sql`extract(month from ${userBooks.dateFinished})`),

    // Top rated books
    db.select({
      title: books.title,
      author: books.author,
      rating: userBooks.rating,
      coverUrlSmall: books.coverUrlSmall,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(yearFilter, isNotNull(userBooks.rating)))
      .orderBy(desc(userBooks.rating), desc(userBooks.dateFinished))
      .limit(5),

    // Genre breakdown
    db.select({
      genre: sql<string>`unnest(${books.genres})`,
      count: sql<number>`count(distinct ${userBooks.id})::int`,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(yearFilter, sql`${books.genres} is not null`))
      .groupBy(sql`unnest(${books.genres})`)
      .orderBy(sql`count(distinct ${userBooks.id}) desc`)
      .limit(8),

    // Fastest read (fewest days with both dates)
    db.select({
      title: books.title,
      author: books.author,
      days: sql<number>`extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted})) / 86400`,
      coverUrlSmall: books.coverUrlSmall,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(yearFilter, isNotNull(userBooks.dateStarted), sql`${userBooks.dateFinished} > ${userBooks.dateStarted}`))
      .orderBy(asc(sql`extract(epoch from (${userBooks.dateFinished} - ${userBooks.dateStarted}))`))
      .limit(1),

    // First book finished that year
    db.select({
      title: books.title,
      author: books.author,
      coverUrlSmall: books.coverUrlSmall,
      dateFinished: sql<string>`to_char(${userBooks.dateFinished}, 'Month DD')`,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter)
      .orderBy(asc(userBooks.dateFinished))
      .limit(1),

    // Last book finished that year
    db.select({
      title: books.title,
      author: books.author,
      coverUrlSmall: books.coverUrlSmall,
      dateFinished: sql<string>`to_char(${userBooks.dateFinished}, 'Month DD')`,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(yearFilter)
      .orderBy(desc(userBooks.dateFinished))
      .limit(1),

    // Shortest book
    db.select({
      title: books.title,
      author: books.author,
      pageCount: books.pageCount,
      coverUrlSmall: books.coverUrlSmall,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(yearFilter, isNotNull(books.pageCount)))
      .orderBy(asc(books.pageCount))
      .limit(1),

    // Longest book
    db.select({
      title: books.title,
      author: books.author,
      pageCount: books.pageCount,
      coverUrlSmall: books.coverUrlSmall,
    }).from(userBooks).innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(yearFilter, isNotNull(books.pageCount)))
      .orderBy(desc(books.pageCount))
      .limit(1),
  ])

  // Fill monthly data
  const now = new Date()
  const maxMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const months: { month: number; count: number }[] = []
  for (let m = 1; m <= maxMonth; m++) {
    months.push({ month: m, count: monthlyRows.find(r => r.month === m)?.count ?? 0 })
  }

  // Best month
  const bestMonth = months.length ? months.reduce((best, m) => m.count > best.count ? m : best, months[0]!) : null

  return {
    year,
    isCurrentYear: year === now.getFullYear(),
    summary: {
      totalBooks: summary?.totalBooks ?? 0,
      totalPages: summary?.totalPages ?? 0,
      avgRating: summary?.avgRating ? Number(summary.avgRating) : null,
      avgPages: summary?.avgPages ? Number(summary.avgPages) : null,
      uniqueAuthors: summary?.uniqueAuthors ?? 0,
    },
    months,
    bestMonth: bestMonth ? {
      month: bestMonth.month,
      count: bestMonth.count,
    } : null,
    topRated: topRated.map(b => ({
      title: b.title,
      author: b.author,
      rating: b.rating,
      coverUrlSmall: b.coverUrlSmall,
    })),
    genres: genreRows.map(g => ({
      genre: g.genre,
      count: g.count,
    })),
    fastestRead: fastestRead[0] ? {
      title: fastestRead[0].title,
      author: fastestRead[0].author,
      days: Math.round(Number(fastestRead[0].days)),
      coverUrlSmall: fastestRead[0].coverUrlSmall,
    } : null,
    firstBook: firstBook[0] ? {
      title: firstBook[0].title,
      author: firstBook[0].author,
      coverUrlSmall: firstBook[0].coverUrlSmall,
      dateFinished: firstBook[0].dateFinished?.trim(),
    } : null,
    lastBook: lastBook[0] && lastBook[0].title !== firstBook[0]?.title ? {
      title: lastBook[0].title,
      author: lastBook[0].author,
      coverUrlSmall: lastBook[0].coverUrlSmall,
      dateFinished: lastBook[0].dateFinished?.trim(),
    } : null,
    shortestBook: shortestBook[0] ? {
      title: shortestBook[0].title,
      pageCount: shortestBook[0].pageCount,
      coverUrlSmall: shortestBook[0].coverUrlSmall,
    } : null,
    longestBook: longestBook[0] ? {
      title: longestBook[0].title,
      pageCount: longestBook[0].pageCount,
      coverUrlSmall: longestBook[0].coverUrlSmall,
    } : null,
  }
})
