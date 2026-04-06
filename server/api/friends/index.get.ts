import { eq, desc } from 'drizzle-orm'
import { useDB } from '../../database'
import { friendships, user } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

/** List all friends */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const friends = await db
    .select({
      friendshipId: friendships.id,
      friendId: friendships.friendId,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      friendsSince: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(user, eq(user.id, friendships.friendId))
    .where(eq(friendships.userId, userId))
    .orderBy(desc(friendships.createdAt))

  return friends.map(f => ({
    friendshipId: f.friendshipId,
    id: f.friendId,
    username: f.username,
    name: f.name,
    avatar: f.avatar,
    friendsSince: f.friendsSince.toISOString(),
  }))
})
