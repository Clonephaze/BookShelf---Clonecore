import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../../database'
import { friendRequests } from '../../../../database/schema'
import { requireServerSession } from '../../../../utils/session'

/** Decline a friend request */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const requestId = getRouterParam(event, 'id')

  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request ID' })
  }

  // Find request — must be addressed to current user
  const [request] = await db
    .select({ id: friendRequests.id })
    .from(friendRequests)
    .where(and(
      eq(friendRequests.id, requestId),
      eq(friendRequests.toUserId, userId),
      eq(friendRequests.status, 'pending'),
    ))
    .limit(1)

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Request not found' })
  }

  await db
    .update(friendRequests)
    .set({ status: 'declined', updatedAt: new Date() })
    .where(eq(friendRequests.id, requestId))

  return { ok: true }
})
