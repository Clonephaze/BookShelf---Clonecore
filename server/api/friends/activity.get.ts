import { eq, desc, inArray } from 'drizzle-orm'
import { useDB } from '../../database'
import { friendships, activityLog, userBooks, books, user, userPreferences } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

/** Get activity feed from friends */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  // Get all friend IDs
  const friends = await db
    .select({ friendId: friendships.friendId })
    .from(friendships)
    .where(eq(friendships.userId, userId))

  if (friends.length === 0) {
    return []
  }

  const friendIds = friends.map(f => f.friendId)

  // Get friends who have showActivity enabled
  const privacyRows = await db
    .select({ userId: userPreferences.userId, showActivity: userPreferences.showActivity })
    .from(userPreferences)
    .where(inArray(userPreferences.userId, friendIds))

  const privacyMap = new Map(privacyRows.map(p => [p.userId, p.showActivity]))
  // If no prefs row, default is true
  const visibleFriendIds = friendIds.filter(id => privacyMap.get(id) !== false)

  if (visibleFriendIds.length === 0) {
    return []
  }

  const activities = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      userId: activityLog.userId,
      userName: user.name,
      userUsername: user.username,
      userAvatar: user.avatar,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCover: books.coverUrlSmall,
    })
    .from(activityLog)
    .innerJoin(user, eq(user.id, activityLog.userId))
    .leftJoin(userBooks, eq(userBooks.id, activityLog.userBookId))
    .leftJoin(books, eq(books.id, userBooks.bookId))
    .where(inArray(activityLog.userId, visibleFriendIds))
    .orderBy(desc(activityLog.createdAt))
    .limit(50)

  return activities.map(a => ({
    id: a.id,
    action: a.action,
    metadata: a.metadata ? JSON.parse(a.metadata) : null,
    createdAt: a.createdAt.toISOString(),
    user: {
      id: a.userId,
      name: a.userName,
      username: a.userUsername,
      avatar: a.userAvatar,
    },
    book: a.bookTitle ? {
      title: a.bookTitle,
      author: a.bookAuthor,
      coverUrlSmall: a.bookCover,
    } : null,
  }))
})
