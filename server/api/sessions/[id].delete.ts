import { eq, and } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingSessions } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing session ID' })
  }

  const [existing] = await db
    .select({ id: readingSessions.id, status: readingSessions.status })
    .from(readingSessions)
    .where(and(eq(readingSessions.id, sessionId), eq(readingSessions.userId, userId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }

  // Only allow deleting completed or abandoned sessions
  if (existing.status === 'active' || existing.status === 'paused') {
    throw createError({ statusCode: 400, statusMessage: 'End the session before deleting it' })
  }

  await db.delete(readingSessions).where(eq(readingSessions.id, sessionId))

  return { success: true }
})
