import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingGoals, userBooks } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

type PeriodType = 'yearly' | 'monthly' | 'weekly'

/** Build a SQL condition to match dateFinished within the given period */
function periodDateFilter(periodType: PeriodType, year: number, periodValue: number) {
  switch (periodType) {
    case 'yearly':
      return sql`extract(year from ${userBooks.dateFinished})::int = ${year}`
    case 'monthly':
      return sql`extract(year from ${userBooks.dateFinished})::int = ${year}
        AND extract(month from ${userBooks.dateFinished})::int = ${periodValue}`
    case 'weekly':
      return sql`extract(isoyear from ${userBooks.dateFinished})::int = ${year}
        AND extract(week from ${userBooks.dateFinished})::int = ${periodValue}`
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()

  const query = getQuery(event)
  const yearParam = query.year ? Number(query.year) : undefined
  const periodType = (query.periodType as PeriodType) || undefined
  const periodValue = query.periodValue !== undefined ? Number(query.periodValue) : undefined

  // Build where clauses
  const conditions = [eq(readingGoals.userId, session.user.id)]
  if (yearParam !== undefined) conditions.push(eq(readingGoals.year, yearParam))
  if (periodType) conditions.push(eq(readingGoals.periodType, periodType))
  if (periodValue !== undefined) conditions.push(eq(readingGoals.periodValue, periodValue))

  const isSingleQuery = periodType && yearParam !== undefined && periodValue !== undefined

  const goalRows = await db
    .select()
    .from(readingGoals)
    .where(and(...conditions))
    .orderBy(readingGoals.year)

  if (goalRows.length === 0) {
    return isSingleQuery ? null : []
  }

  // Count completed books for each goal's period
  const goalsWithCounts = await Promise.all(
    goalRows.map(async (g) => {
      const pt = g.periodType as PeriodType
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(userBooks)
        .where(
          and(
            eq(userBooks.userId, session.user.id),
            isNotNull(userBooks.dateFinished),
            periodDateFilter(pt, g.year, g.periodValue),
          ),
        )
      return { ...g, booksCompleted: result?.count ?? 0 }
    }),
  )

  return isSingleQuery ? goalsWithCounts[0] : goalsWithCounts
})
