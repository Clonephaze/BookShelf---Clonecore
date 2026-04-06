import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../../database'
import { friendRequests, friendships } from '../../../../database/schema'
import { requireServerSession } from '../../../../utils/session'

/** Accept a friend request */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const requestId = getRouterParam(event, 'id')

  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request ID' })
  }

  // Find the request — must be addressed to the current user
  const [request] = await db
    .select()
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

  // Update request status
  await db
    .update(friendRequests)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(friendRequests.id, requestId))

  // Create bidirectional friendship
  await db.insert(friendships).values([
    { userId: request.fromUserId, friendId: request.toUserId },
    { userId: request.toUserId, friendId: request.fromUserId },
  ])

  return { ok: true }
})
