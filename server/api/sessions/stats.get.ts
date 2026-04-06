import { eq, and, sql, isNotNull } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingSessions } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const query = getQuery(event)
  const year = Number(query.year) || new Date().getFullYear()

  const completedInYear = and(
    eq(readingSessions.userId, userId),
    eq(readingSessions.status, 'completed'),
    sql`extract(year from ${readingSessions.endedAt})::int = ${year}`,
  )

  const [totals] = await db
    .select({
      totalSessions: sql<number>`count(*)::int`,
      totalDurationSeconds: sql<number>`coalesce(sum(${readingSessions.durationSeconds}), 0)::int`,
      totalPagesRead: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)::int`,
      avgDurationSeconds: sql<number | null>`round(avg(${readingSessions.durationSeconds})::numeric, 0)::int`,
      avgPagesPerSession: sql<number | null>`round(avg(${readingSessions.pagesRead})::numeric, 1)`,
    })
    .from(readingSessions)
    .where(completedInYear)

  // Pages per hour (only from sessions that have both duration and pages)
  const [pph] = await db
    .select({
      pagesPerHour: sql<number | null>`
        round(
          sum(${readingSessions.pagesRead})::numeric
          / nullif(sum(${readingSessions.durationSeconds})::numeric / 3600, 0),
          1
        )`,
    })
    .from(readingSessions)
    .where(and(
      completedInYear,
      isNotNull(readingSessions.pagesRead),
      sql`${readingSessions.durationSeconds} > 0`,
    ))

  // Streak calculation: consecutive days with at least one completed session
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
    .orderBy(sql`date(${readingSessions.endedAt}) desc`)

  let currentStreak = 0
  let longestStreak = 0

  if (sessionDays.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const days = sessionDays.map(d => {
      const date = new Date(d.day)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

    // Current streak: must include today or yesterday
    if (days[0] === today.getTime() || days[0] === yesterday.getTime()) {
      currentStreak = 1
      for (let i = 1; i < days.length; i++) {
        const diff = days[i - 1]! - days[i]!
        if (diff === 86400000) {
          currentStreak++
        }
        else {
          break
        }
      }
    }

    // Longest streak
    let streak = 1
    for (let i = 1; i < days.length; i++) {
      const diff = days[i - 1]! - days[i]!
      if (diff === 86400000) {
        streak++
      }
      else {
        longestStreak = Math.max(longestStreak, streak)
        streak = 1
      }
    }
    longestStreak = Math.max(longestStreak, streak)
  }

  // Sessions per week (this year)
  const weeksElapsed = Math.max(1, Math.ceil(
    (Date.now() - new Date(year, 0, 1).getTime()) / (7 * 86400000),
  ))
  const sessionsPerWeek = totals?.totalSessions
    ? Math.round((totals.totalSessions / weeksElapsed) * 10) / 10
    : 0

  return {
    totalSessions: totals?.totalSessions ?? 0,
    totalDurationSeconds: totals?.totalDurationSeconds ?? 0,
    totalPagesRead: totals?.totalPagesRead ?? 0,
    avgDurationSeconds: totals?.avgDurationSeconds ? Number(totals.avgDurationSeconds) : null,
    avgPagesPerSession: totals?.avgPagesPerSession ? Number(totals.avgPagesPerSession) : null,
    pagesPerHour: pph?.pagesPerHour ? Number(pph.pagesPerHour) : null,
    sessionsPerWeek,
    currentStreak,
    longestStreak,
  }
})
