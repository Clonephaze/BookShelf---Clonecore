import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { readingGoals } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const goalId = getRouterParam(event, 'id')

  if (!goalId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing goal ID' })
  }

  const body = await readBody<{ targetBooks: number }>(event)

  if (!body?.targetBooks) {
    throw createError({ statusCode: 400, statusMessage: 'targetBooks is required' })
  }

  const targetBooks = Number(body.targetBooks)

  if (!Number.isInteger(targetBooks) || targetBooks < 1 || targetBooks > 999) {
    throw createError({ statusCode: 400, statusMessage: 'Target must be between 1 and 999 books' })
  }

  // Verify ownership
  const [existing] = await db
    .select({ id: readingGoals.id })
    .from(readingGoals)
    .where(and(eq(readingGoals.id, goalId), eq(readingGoals.userId, session.user.id)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Goal not found' })
  }

  const [updated] = await db
    .update(readingGoals)
    .set({ targetBooks, updatedAt: new Date() })
    .where(eq(readingGoals.id, goalId))
    .returning()

  return updated
})
