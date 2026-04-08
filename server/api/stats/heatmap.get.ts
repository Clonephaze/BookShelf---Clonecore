import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const query = getQuery(event)
  const year = Number(query.year) || new Date().getFullYear()

  // Books finished per day in the given year
  const rows = await db
    .select({
      date: sql<string>`to_char(${userBooks.dateFinished}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(userBooks)
    .where(and(
      eq(userBooks.userId, userId),
      isNotNull(userBooks.dateFinished),
      sql`extract(year from ${userBooks.dateFinished})::int = ${year}`,
    ))
    .groupBy(sql`to_char(${userBooks.dateFinished}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${userBooks.dateFinished}, 'YYYY-MM-DD')`)

  // Convert to a map { 'YYYY-MM-DD': count }
  const days: Record<string, number> = {}
  for (const row of rows) {
    if (row.date) days[row.date] = row.count
  }

  setResponseHeader(event, 'Cache-Control', 'private, max-age=300')
  return { year, days }
})
