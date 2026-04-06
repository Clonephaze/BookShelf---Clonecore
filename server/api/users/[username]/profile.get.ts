import { eq, and, desc, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../../database'
import { user, friendships, userPreferences, userBooks, books, shelves, userBookShelves, readingGoals, activityLog } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

/** Get a friend's profile (privacy-filtered) */
export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const viewerId = session.user.id
  const username = getRouterParam(event, 'username')

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Missing username' })
  }

  // Find the target user
  const [target] = await db
    .select({ id: user.id, username: user.username, name: user.name, avatar: user.avatar, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // Must be friends
  const [friendship] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(
      eq(friendships.userId, viewerId),
      eq(friendships.friendId, target.id),
    ))
    .limit(1)

  if (!friendship) {
    throw createError({ statusCode: 403, statusMessage: 'You are not friends with this user' })
  }

  // Get their privacy settings
  const [prefs] = await db
    .select({
      showShelves: userPreferences.showShelves,
      showProgress: userPreferences.showProgress,
      showRatings: userPreferences.showRatings,
      showGoals: userPreferences.showGoals,
      showActivity: userPreferences.showActivity,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, target.id))
    .limit(1)

  const privacy = prefs ?? {
    showShelves: true,
    showProgress: true,
    showRatings: true,
    showGoals: true,
    showActivity: true,
  }

  const profile: Record<string, unknown> = {
    id: target.id,
    username: target.username,
    name: target.name,
    avatar: target.avatar,
    memberSince: target.createdAt.toISOString(),
  }

  // Shelves + currently reading
  if (privacy.showShelves) {
    const userShelves = await db
      .select({
        id: shelves.id,
        name: shelves.name,
        slug: shelves.slug,
        bookCount: sql<number>`count(${userBookShelves.id})::int`,
      })
      .from(shelves)
      .leftJoin(userBookShelves, and(
        eq(userBookShelves.shelfId, shelves.id),
        eq(userBookShelves.isPrimary, true),
      ))
      .where(eq(shelves.userId, target.id))
      .groupBy(shelves.id)
      .orderBy(shelves.position)

    profile.shelves = userShelves

    // Currently reading books
    const crShelf = userShelves.find(s => s.slug === 'currently-reading')
    if (crShelf) {
      const crBooks = await db
        .select({
          title: books.title,
          author: books.author,
          coverUrlSmall: books.coverUrlSmall,
          currentPage: privacy.showProgress ? userBooks.currentPage : sql<null>`null`,
          pageCount: books.pageCount,
          progressPercent: privacy.showProgress ? userBooks.progressPercent : sql<null>`null`,
        })
        .from(userBookShelves)
        .innerJoin(userBooks, eq(userBooks.id, userBookShelves.userBookId))
        .innerJoin(books, eq(books.id, userBooks.bookId))
        .where(and(
          eq(userBookShelves.shelfId, crShelf.id),
          eq(userBookShelves.isPrimary, true),
        ))
        .limit(10)

      profile.currentlyReading = crBooks
    }
    else {
      profile.currentlyReading = []
    }
  }

  // Ratings overview
  if (privacy.showRatings) {
    const [ratingsData] = await db
      .select({
        avgRating: sql<number | null>`round(avg(${userBooks.rating})::numeric, 1)`,
        totalRated: sql<number>`count(${userBooks.rating})::int`,
        totalBooks: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(and(
        eq(userBooks.userId, target.id),
        isNotNull(userBooks.dateFinished),
      ))

    profile.ratings = ratingsData
  }

  // Goals
  if (privacy.showGoals) {
    const currentYear = new Date().getFullYear()
    const [goal] = await db
      .select({ targetBooks: readingGoals.targetBooks })
      .from(readingGoals)
      .where(and(
        eq(readingGoals.userId, target.id),
        eq(readingGoals.periodType, 'yearly'),
        eq(readingGoals.year, currentYear),
        eq(readingGoals.periodValue, 0),
      ))
      .limit(1)

    if (goal) {
      const [finished] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(userBooks)
        .where(and(
          eq(userBooks.userId, target.id),
          isNotNull(userBooks.dateFinished),
          sql`extract(year from ${userBooks.dateFinished})::int = ${currentYear}`,
        ))

      profile.goal = {
        target: goal.targetBooks,
        completed: finished?.count ?? 0,
        year: currentYear,
      }
    }
  }

  // Recent activity
  if (privacy.showActivity) {
    const activities = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookCover: books.coverUrlSmall,
      })
      .from(activityLog)
      .leftJoin(userBooks, eq(userBooks.id, activityLog.userBookId))
      .leftJoin(books, eq(books.id, userBooks.bookId))
      .where(eq(activityLog.userId, target.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(20)

    profile.recentActivity = activities.map(a => ({
      id: a.id,
      action: a.action,
      metadata: a.metadata ? JSON.parse(a.metadata) : null,
      createdAt: a.createdAt.toISOString(),
      book: a.bookTitle ? { title: a.bookTitle, author: a.bookAuthor, coverUrlSmall: a.bookCover } : null,
    }))
  }

  return profile
})
