import { eq, and, or, desc } from 'drizzle-orm'
import { useDB } from '../../../database'
import { friendRequests, user } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

/** Get pending friend requests (both sent and received) */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const requests = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
      status: friendRequests.status,
      createdAt: friendRequests.createdAt,
    })
    .from(friendRequests)
    .where(and(
      or(
        eq(friendRequests.fromUserId, userId),
        eq(friendRequests.toUserId, userId),
      ),
      eq(friendRequests.status, 'pending'),
    ))
    .orderBy(desc(friendRequests.createdAt))

  // Enrich with user info
  const enriched = await Promise.all(requests.map(async (r) => {
    const otherId = r.fromUserId === userId ? r.toUserId : r.fromUserId
    const [other] = await db
      .select({ id: user.id, username: user.username, name: user.name, avatar: user.avatar })
      .from(user)
      .where(eq(user.id, otherId))
      .limit(1)

    return {
      id: r.id,
      direction: r.fromUserId === userId ? 'sent' as const : 'received' as const,
      user: other ?? { id: otherId, username: null, name: 'Unknown', avatar: null },
      createdAt: r.createdAt.toISOString(),
    }
  }))

  return enriched
})
