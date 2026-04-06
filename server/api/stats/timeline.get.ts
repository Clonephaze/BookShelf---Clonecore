import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const query = getQuery(event)
  const year = Number(query.year) || null
  const months = Math.min(Math.max(Number(query.months) || 12, 6), 36)

  let rows
  if (year) {
    // Year-scoped: all months in the selected year
    rows = await db
      .select({
        year: sql<number>`extract(year from ${userBooks.dateFinished})::int`,
        month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(and(
        eq(userBooks.userId, userId),
        isNotNull(userBooks.dateFinished),
        sql`extract(year from ${userBooks.dateFinished})::int = ${year}`,
      ))
      .groupBy(
        sql`extract(year from ${userBooks.dateFinished})`,
        sql`extract(month from ${userBooks.dateFinished})`,
      )
      .orderBy(
        sql`extract(year from ${userBooks.dateFinished})`,
        sql`extract(month from ${userBooks.dateFinished})`,
      )
  }
  else {
    // Default: last N months rolling window
    rows = await db
      .select({
        year: sql<number>`extract(year from ${userBooks.dateFinished})::int`,
        month: sql<number>`extract(month from ${userBooks.dateFinished})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(and(
        eq(userBooks.userId, userId),
        isNotNull(userBooks.dateFinished),
        sql`${userBooks.dateFinished} >= date_trunc('month', now()) - interval '${sql.raw(String(months - 1))} months'`,
      ))
      .groupBy(
        sql`extract(year from ${userBooks.dateFinished})`,
        sql`extract(month from ${userBooks.dateFinished})`,
      )
      .orderBy(
        sql`extract(year from ${userBooks.dateFinished})`,
        sql`extract(month from ${userBooks.dateFinished})`,
      )
  }

  // Build full timeline with zeros for empty months
  const now = new Date()
  const timeline: { year: number; month: number; count: number; label: string }[] = []

  if (year) {
    const maxMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
    for (let m = 1; m <= maxMonth; m++) {
      const found = rows.find(r => r.month === m)
      const d = new Date(year, m - 1, 1)
      const label = d.toLocaleString('en-US', { month: 'short' })
      timeline.push({ year, month: m, count: found?.count ?? 0, label })
    }
  }
  else {
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const found = rows.find(r => r.year === y && r.month === m)
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      timeline.push({ year: y, month: m, count: found?.count ?? 0, label })
    }
  }

  return { timeline, months }
})
