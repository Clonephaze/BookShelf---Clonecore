import { eq, and, or, ne } from 'drizzle-orm'
import { useDB } from '../../database'
import { user, friendships, friendRequests } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const query = getQuery(event)
  const q = String(query.q ?? '').trim().toLowerCase()

  if (!q || q.length < 2) {
    return []
  }

  // Require exact username match (case-insensitive)
  const matches = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    })
    .from(user)
    .where(and(
      eq(user.username, q),
      ne(user.id, userId),
    ))
    .limit(1)

  // Get existing friendship/request status for each match
  const results = await Promise.all(matches.map(async (u) => {
    // Check if already friends
    const [friendship] = await db
      .select({ id: friendships.id })
      .from(friendships)
      .where(and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, u.id),
      ))
      .limit(1)

    if (friendship) {
      return { ...u, status: 'friends' as const }
    }

    // Check for pending request in either direction
    const [request] = await db
      .select({ id: friendRequests.id, fromUserId: friendRequests.fromUserId, status: friendRequests.status })
      .from(friendRequests)
      .where(and(
        or(
          and(eq(friendRequests.fromUserId, userId), eq(friendRequests.toUserId, u.id)),
          and(eq(friendRequests.fromUserId, u.id), eq(friendRequests.toUserId, userId)),
        ),
        eq(friendRequests.status, 'pending'),
      ))
      .limit(1)

    if (request) {
      return {
        ...u,
        status: request.fromUserId === userId ? 'request_sent' as const : 'request_received' as const,
        requestId: request.id,
      }
    }

    return { ...u, status: 'none' as const }
  }))

  return results
})
