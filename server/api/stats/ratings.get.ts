import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const ratedFilter = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.rating),
  )

  // Rating distribution (1-5) and avg rating
  const [distribution, [avgRow]] = await Promise.all([
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
  ])

  // Fill in missing ratings (1-5) with zero counts
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of distribution) {
    if (row.rating != null && row.rating >= 1 && row.rating <= 5) {
      counts[row.rating] = row.count
    }
  }

  return {
    distribution: [1, 2, 3, 4, 5].map(star => ({
      rating: star,
      count: counts[star],
    })),
    avgRating: avgRow?.avg ? Number(avgRow.avg) : null,
    totalRated: avgRow?.total ?? 0,
  }
})
