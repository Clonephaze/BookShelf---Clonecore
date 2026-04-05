import { eq, and } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingGoals } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

const VALID_PERIOD_TYPES = ['yearly', 'monthly', 'weekly'] as const
type PeriodType = typeof VALID_PERIOD_TYPES[number]

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const body = await readBody<{
    year: number
    targetBooks: number
    periodType?: PeriodType
    periodValue?: number
  }>(event)

  if (!body?.year || !body?.targetBooks) {
    throw createError({ statusCode: 400, statusMessage: 'year and targetBooks are required' })
  }

  const year = Number(body.year)
  const targetBooks = Number(body.targetBooks)
  const periodType: PeriodType = body.periodType && VALID_PERIOD_TYPES.includes(body.periodType) ? body.periodType : 'yearly'
  const periodValue = periodType === 'yearly' ? 0 : Number(body.periodValue ?? 0)

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createError({ statusCode: 400, statusMessage: 'Year must be a valid year between 2000 and 2100' })
  }

  if (!Number.isInteger(targetBooks) || targetBooks < 1 || targetBooks > 999) {
    throw createError({ statusCode: 400, statusMessage: 'Target must be between 1 and 999 books' })
  }

  // Validate periodValue range
  if (periodType === 'monthly' && (!Number.isInteger(periodValue) || periodValue < 1 || periodValue > 12)) {
    throw createError({ statusCode: 400, statusMessage: 'Month must be between 1 and 12' })
  }
  if (periodType === 'weekly' && (!Number.isInteger(periodValue) || periodValue < 1 || periodValue > 53)) {
    throw createError({ statusCode: 400, statusMessage: 'Week must be between 1 and 53' })
  }

  // Check for existing goal for this period
  const [existing] = await db
    .select({ id: readingGoals.id })
    .from(readingGoals)
    .where(and(
      eq(readingGoals.userId, session.user.id),
      eq(readingGoals.periodType, periodType),
      eq(readingGoals.year, year),
      eq(readingGoals.periodValue, periodValue),
    ))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'A goal for this period already exists' })
  }

  const [goal] = await db.insert(readingGoals).values({
    userId: session.user.id,
    periodType,
    year,
    periodValue,
    targetBooks,
  }).returning()

  return goal
})
