import { eq, and, sql, isNotNull, desc } from 'drizzle-orm'
import { useDB } from '../database'
import { userBooks, books, readingSessions, readingGoals, shelves, userBookShelves } from '../database/schema'
import { requireServerSession } from '../utils/session'

export interface Insight {
  id: string
  type: 'projection' | 'goal' | 'trend' | 'milestone' | 'stale' | 'streak'
  icon: string
  title: string
  body: string
  /** Optional link to navigate on click */
  link?: string
  /** Optional book context */
  bookTitle?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const now = new Date()
  const currentYear = now.getFullYear()

  const insights: Insight[] = []

  // --- 1. Per-book finish projections (currently reading) ---
  const currentlyReadingShelf = await db
    .select({ id: shelves.id })
    .from(shelves)
    .where(and(eq(shelves.userId, userId), eq(shelves.slug, 'currently-reading')))
    .limit(1)

  if (currentlyReadingShelf.length > 0) {
    const crBooks = await db
      .select({
        userBookId: userBooks.id,
        title: books.title,
        currentPage: userBooks.currentPage,
        pageCount: books.pageCount,
        dateStarted: userBooks.dateStarted,
        updatedAt: userBooks.updatedAt,
      })
      .from(userBookShelves)
      .innerJoin(userBooks, eq(userBooks.id, userBookShelves.userBookId))
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(
        eq(userBookShelves.shelfId, currentlyReadingShelf[0]!.id),
        eq(userBookShelves.isPrimary, true),
        eq(userBooks.userId, userId),
      ))

    for (const book of crBooks) {
      if (!book.pageCount || !book.currentPage || book.currentPage <= 0) continue
      const pagesLeft = book.pageCount - book.currentPage

      // Get recent sessions for this book to calculate reading speed
      const recentSessions = await db
        .select({
          totalPages: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)::int`,
          totalSeconds: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int`,
          sessionCount: sql<number>`count(*)::int`,
        })
        .from(readingSessions)
        .where(and(
          eq(readingSessions.userBookId, book.userBookId),
          eq(readingSessions.status, 'completed'),
          isNotNull(readingSessions.pagesRead),
          sql`${readingSessions.durationSeconds} > 0`,
        ))

      const sess = recentSessions[0]
      if (sess && sess.totalPages > 0 && sess.totalSeconds > 0) {
        // Session-based projection
        const pagesPerHour = (sess.totalPages / sess.totalSeconds) * 3600
        const hoursLeft = pagesLeft / pagesPerHour
        const daysLeft = Math.ceil(hoursLeft / 1) // Assume ~1 hr/day reading
        if (daysLeft > 0 && daysLeft < 365) {
          const finishDate = new Date(now)
          finishDate.setDate(finishDate.getDate() + daysLeft)
          const dateStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          insights.push({
            id: `proj-${book.userBookId}`,
            type: 'projection',
            icon: '📖',
            title: `${daysLeft} day${daysLeft === 1 ? '' : 's'} to finish`,
            body: `At your current pace, you'll finish **${book.title}** around **${dateStr}** (${pagesLeft} pages left).`,
            link: `/library/book/${book.userBookId}`,
            bookTitle: book.title,
          })
        }
      } else if (book.dateStarted) {
        // Fallback: use progress-over-time
        const daysReading = Math.max(1, Math.floor((now.getTime() - new Date(book.dateStarted).getTime()) / 86400000))
        const pagesPerDay = book.currentPage / daysReading
        if (pagesPerDay > 0) {
          const daysLeft = Math.ceil(pagesLeft / pagesPerDay)
          if (daysLeft > 0 && daysLeft < 365) {
            const finishDate = new Date(now)
            finishDate.setDate(finishDate.getDate() + daysLeft)
            const dateStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            insights.push({
              id: `proj-${book.userBookId}`,
              type: 'projection',
              icon: '📖',
              title: `~${daysLeft} day${daysLeft === 1 ? '' : 's'} to finish`,
              body: `Based on your progress, you'll finish **${book.title}** around **${dateStr}**.`,
              link: `/library/book/${book.userBookId}`,
              bookTitle: book.title,
            })
          }
        }
      }

      // --- 5. Stale book detection ---
      if (book.updatedAt) {
        const daysSinceUpdate = Math.floor((now.getTime() - new Date(book.updatedAt).getTime()) / 86400000)
        if (daysSinceUpdate >= 14) {
          insights.push({
            id: `stale-${book.userBookId}`,
            type: 'stale',
            icon: '📚',
            title: `${daysSinceUpdate} days since last update`,
            body: `You haven't updated **${book.title}** in ${daysSinceUpdate} days. Still reading?`,
            link: `/library/book/${book.userBookId}`,
            bookTitle: book.title,
          })
        }
      }
    }
  }

  // --- 2. Goal pace insights ---
  const [yearlyGoal] = await db
    .select({
      targetBooks: readingGoals.targetBooks,
    })
    .from(readingGoals)
    .where(and(
      eq(readingGoals.userId, userId),
      eq(readingGoals.periodType, 'yearly'),
      eq(readingGoals.year, currentYear),
      eq(readingGoals.periodValue, 0),
    ))
    .limit(1)

  if (yearlyGoal) {
    // Count books finished this year
    const [finished] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .where(and(
        eq(userBooks.userId, userId),
        isNotNull(userBooks.dateFinished),
        sql`extract(year from ${userBooks.dateFinished})::int = ${currentYear}`,
      ))

    const booksCompleted = finished?.count ?? 0
    const target = yearlyGoal.targetBooks
    const elapsed = (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (new Date(currentYear + 1, 0, 1).getTime() - new Date(currentYear, 0, 1).getTime())
    const expected = Math.round(elapsed * target)
    const diff = booksCompleted - expected

    if (booksCompleted >= target) {
      insights.push({
        id: 'goal-complete',
        type: 'goal',
        icon: '🎉',
        title: 'Goal complete!',
        body: `You've read **${booksCompleted} of ${target}** books — you crushed your ${currentYear} goal!`,
        link: '/goals',
      })
    } else if (diff >= 2) {
      const aheadPct = Math.round((diff / target) * 100)
      insights.push({
        id: 'goal-ahead',
        type: 'goal',
        icon: '🚀',
        title: `${aheadPct}% ahead of schedule`,
        body: `You've read **${booksCompleted} books** — ${diff} more than expected by now. Keep it up!`,
        link: '/goals',
      })
    } else if (diff <= -2) {
      const booksPerMonthNeeded = ((target - booksCompleted) / Math.max(1, 12 - now.getMonth())).toFixed(1)
      insights.push({
        id: 'goal-behind',
        type: 'goal',
        icon: '📊',
        title: 'Time to catch up',
        body: `You need ~**${booksPerMonthNeeded} books/month** to hit your goal of ${target} by December.`,
        link: '/goals',
      })
    }

    // Milestone prediction
    if (booksCompleted < target && booksCompleted > 0) {
      const booksPerMonth = booksCompleted / (now.getMonth() + (now.getDate() / 30))
      if (booksPerMonth > 0) {
        const monthsTo50 = Math.ceil((50 - booksCompleted) / booksPerMonth)
        if (booksCompleted < 50 && monthsTo50 > 0 && monthsTo50 <= 24) {
          const hitDate = new Date(now)
          hitDate.setMonth(hitDate.getMonth() + monthsTo50)
          const monthStr = hitDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          insights.push({
            id: 'milestone-50',
            type: 'milestone',
            icon: '🏆',
            title: '50 book milestone',
            body: `At this rate, you'll hit **50 books** by **${monthStr}**.`,
            link: '/stats',
          })
        }
      }
    }
  }

  // --- 3. Pace trends ---
  // Compare recent sessions to older ones
  const [recentPace] = await db
    .select({
      pagesPerHour: sql<number | null>`
        round(
          sum(${readingSessions.pagesRead})::numeric
          / nullif(sum(${readingSessions.durationSeconds})::numeric / 3600, 0),
          1
        )`,
      count: sql<number>`count(*)::int`,
    })
    .from(readingSessions)
    .where(and(
      eq(readingSessions.userId, userId),
      eq(readingSessions.status, 'completed'),
      isNotNull(readingSessions.pagesRead),
      sql`${readingSessions.durationSeconds} > 0`,
      sql`${readingSessions.endedAt} > now() - interval '14 days'`,
    ))

  const [olderPace] = await db
    .select({
      pagesPerHour: sql<number | null>`
        round(
          sum(${readingSessions.pagesRead})::numeric
          / nullif(sum(${readingSessions.durationSeconds})::numeric / 3600, 0),
          1
        )`,
      count: sql<number>`count(*)::int`,
    })
    .from(readingSessions)
    .where(and(
      eq(readingSessions.userId, userId),
      eq(readingSessions.status, 'completed'),
      isNotNull(readingSessions.pagesRead),
      sql`${readingSessions.durationSeconds} > 0`,
      sql`${readingSessions.endedAt} <= now() - interval '14 days'`,
      sql`${readingSessions.endedAt} > now() - interval '42 days'`,
    ))

  if (recentPace?.pagesPerHour && olderPace?.pagesPerHour && recentPace.count >= 3 && olderPace.count >= 3) {
    const change = ((recentPace.pagesPerHour - olderPace.pagesPerHour) / olderPace.pagesPerHour) * 100
    if (change >= 10) {
      insights.push({
        id: 'pace-up',
        type: 'trend',
        icon: '⚡',
        title: 'Reading speed up',
        body: `Your pace has increased **${Math.round(change)}%** over the last 2 weeks (${recentPace.pagesPerHour} pages/hr vs ${olderPace.pagesPerHour}).`,
        link: '/stats',
      })
    } else if (change <= -10) {
      insights.push({
        id: 'pace-down',
        type: 'trend',
        icon: '🐢',
        title: 'Reading pace dipped',
        body: `Your pace is down **${Math.round(Math.abs(change))}%** recently — longer books or less reading time?`,
        link: '/stats',
      })
    }
  }

  // --- 4. Session streak ---
  const sessionDays = await db
    .select({
      day: sql<string>`date(${readingSessions.endedAt})`,
    })
    .from(readingSessions)
    .where(and(
      eq(readingSessions.userId, userId),
      eq(readingSessions.status, 'completed'),
      isNotNull(readingSessions.endedAt),
    ))
    .groupBy(sql`date(${readingSessions.endedAt})`)
    .orderBy(desc(sql`date(${readingSessions.endedAt})`))
    .limit(60)

  if (sessionDays.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const days = sessionDays.map((d: { day: string }) => {
      const date = new Date(d.day)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

    if (days[0] === today.getTime() || days[0] === yesterday.getTime()) {
      let streak = 1
      for (let i = 1; i < days.length; i++) {
        if (days[i - 1]! - days[i]! === 86400000) {
          streak++
        } else {
          break
        }
      }

      if (streak >= 3) {
        insights.push({
          id: 'streak',
          type: 'streak',
          icon: '🔥',
          title: `${streak}-day reading streak!`,
          body: streak >= 7
            ? `Incredible! You've read every day for **${streak} days** — that's a serious habit.`
            : `You've read ${streak} days in a row. Keep the momentum going!`,
          link: '/sessions',
        })
      }
    }
  }

  return insights
})
