import { eq, and, sql, isNotNull, desc } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const ratedFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.rating),
  )

  // Rating distribution (1-5), avg rating, total books, highest rated author
  const [distribution, [avgRow], [totalRow], topRatedAuthor] = await Promise.all([
    db
      .select({
        rating: userBooks.rating,
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(ratedFilter)
      .groupBy(userBooks.rating)
      .orderBy(userBooks.rating),

    db
      .select({
        avg: sql<number | null>`round(avg(${userBooks.rating})::numeric, 2)`,
        total: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(ratedFilter),

    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(eq(userBooks.userId, userId)),

    db
      .select({
        author: books.author,
        avgRating: sql<number>`round(avg(${userBooks.rating})::numeric, 2)`,
        bookCount: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .where(ratedFilter)
      .groupBy(books.author)
      .orderBy(desc(sql`avg(${userBooks.rating})`), desc(sql`count(*)`))
      .limit(1),
  ])

  // Fill in missing ratings (1-5) with zero counts
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of distribution) {
    if (row.rating != null && row.rating >= 1 && row.rating <= 5) {
      counts[row.rating] = row.count
    }
  }

  const topAuthor = topRatedAuthor[0] ?? null

  return {
    distribution: [1, 2, 3, 4, 5].map(star => ({
      rating: star,
      count: counts[star],
    })),
    avgRating: avgRow?.avg ? Number(avgRow.avg) : null,
    totalRated: avgRow?.total ?? 0,
    totalBooks: totalRow?.count ?? 0,
    highestRatedAuthor: topAuthor
      ? { author: topAuthor.author, avgRating: Number(topAuthor.avgRating), bookCount: topAuthor.bookCount }
      : null,
  }
})
