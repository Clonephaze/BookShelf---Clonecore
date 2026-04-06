import { eq, and } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingSessions, userBooks } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const body = await readBody<{
    userBookId: string
    timerMode?: 'countdown' | 'open'
    timerDurationSeconds?: number
    startPage?: number
  }>(event)

  if (!body?.userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing userBookId' })
  }

  // Verify the book belongs to this user
  const [ub] = await db
    .select({ id: userBooks.id, currentPage: userBooks.currentPage })
    .from(userBooks)
    .where(and(eq(userBooks.id, body.userBookId), eq(userBooks.userId, userId)))
    .limit(1)

  if (!ub) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found in your library' })
  }

  // Check for existing active/paused session
  const [existing] = await db
    .select({ id: readingSessions.id })
    .from(readingSessions)
    .where(and(
      eq(readingSessions.userId, userId),
      eq(readingSessions.status, 'active'),
    ))
    .limit(1)

  if (!existing) {
    const [paused] = await db
      .select({ id: readingSessions.id })
      .from(readingSessions)
      .where(and(
        eq(readingSessions.userId, userId),
        eq(readingSessions.status, 'paused'),
      ))
      .limit(1)

    if (paused) {
      throw createError({ statusCode: 409, statusMessage: 'You have a paused session. Resume or end it first.' })
    }
  }

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'You already have an active session' })
  }

  const timerMode = body.timerMode === 'countdown' ? 'countdown' : 'open'
  const startPage = body.startPage ?? ub.currentPage ?? null

  const [created] = await db.insert(readingSessions).values({
    userId,
    userBookId: body.userBookId,
    timerMode,
    timerDurationSeconds: timerMode === 'countdown' ? (body.timerDurationSeconds ?? 1800) : null,
    startPage,
    status: 'active',
  }).returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create session' })
  }

  return created
})
