import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { friendships } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

/** Remove a friend (bidirectional) */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const friendId = getRouterParam(event, 'id')

  if (!friendId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing friend ID' })
  }

  // Delete both directions
  await db
    .delete(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)))

  await db
    .delete(friendships)
    .where(and(eq(friendships.userId, friendId), eq(friendships.friendId, userId)))

  return { ok: true }
})
