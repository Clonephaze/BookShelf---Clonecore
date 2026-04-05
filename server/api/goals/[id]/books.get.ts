import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../../database'
import { readingGoals, userBooks, books } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

type PeriodType = 'yearly' | 'monthly' | 'weekly'

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
  const goalId = getRouterParam(event, 'id')

  if (!goalId) {
    throw createError({ statusCode: 400, statusMessage: 'Goal ID is required' })
  }

  // Fetch the goal and verify ownership
  const [goal] = await db
    .select()
    .from(readingGoals)
    .where(and(
      eq(readingGoals.id, goalId),
      eq(readingGoals.userId, session.user.id),
    ))
    .limit(1)

  if (!goal) {
    throw createError({ statusCode: 404, statusMessage: 'Goal not found' })
  }

  const pt = goal.periodType as PeriodType

  // Fetch books that count toward this goal's period
  const rows = await db
    .select({
      userBookId: userBooks.id,
      bookId: books.id,
      title: books.title,
      author: books.author,
      coverUrl: books.coverUrl,
      coverUrlSmall: books.coverUrlSmall,
      pageCount: books.pageCount,
      rating: userBooks.rating,
      dateAdded: userBooks.dateAdded,
      dateFinished: userBooks.dateFinished,
      currentPage: userBooks.currentPage,
      progressPercent: userBooks.progressPercent,
      totalMinutes: userBooks.totalMinutes,
      currentMinutes: userBooks.currentMinutes,
      updatedAt: userBooks.updatedAt,
    })
    .from(userBooks)
    .innerJoin(books, eq(books.id, userBooks.bookId))
    .where(
      and(
        eq(userBooks.userId, session.user.id),
        isNotNull(userBooks.dateFinished),
        periodDateFilter(pt, goal.year, goal.periodValue),
      ),
    )
    .orderBy(userBooks.dateFinished)

  return rows
})
