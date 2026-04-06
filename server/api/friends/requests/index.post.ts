import { eq, and, or } from 'drizzle-orm'
import { useDB } from '../../../database'
import { friendRequests, friendships, user } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

/** Send a friend request */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const body = await readBody<{ username: string }>(event)
  const username = body.username?.trim().toLowerCase()

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username is required' })
  }

  // Find the target user
  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (target.id === userId) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot add yourself' })
  }

  // Check if already friends
  const [existing] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(
      eq(friendships.userId, userId),
      eq(friendships.friendId, target.id),
    ))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Already friends' })
  }

  // Check if a request already exists in either direction
  const [existingRequest] = await db
    .select({ id: friendRequests.id, status: friendRequests.status })
    .from(friendRequests)
    .where(and(
      or(
        and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, target.id)),
        and(eq(friendRequests.fromUserId, target.id), eq(friendRequests.toUserId, userId)),
      ),
      eq(friendRequests.status, 'pending'),
    ))
    .limit(1)

  if (existingRequest) {
    throw createError({ statusCode: 409, statusMessage: 'A pending request already exists' })
  }

  const [request] = await db
    .insert(friendRequests)
    .values({
      fromUserId: userId,
      toUserId: target.id,
    })
    .returning({ id: friendRequests.id })

  return { id: request!.id, status: 'pending' }
})
