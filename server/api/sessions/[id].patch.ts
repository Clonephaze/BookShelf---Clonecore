import { eq, and } from 'drizzle-orm'
import { useDB } from '../../database'
import { readingSessions, userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing session ID' })
  }

  const body = await readBody<{
    action?: 'pause' | 'resume' | 'complete' | 'abandon'
    durationSeconds?: number
    endPage?: number
    pagesRead?: number
    notes?: string
  }>(event)

  // Fetch existing session
  const [existing] = await db
    .select()
    .from(readingSessions)
    .where(and(eq(readingSessions.id, sessionId), eq(readingSessions.userId, userId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  // Always sync duration from client
  if (body.durationSeconds != null) {
    updates.durationSeconds = body.durationSeconds
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes
  }

  if (body.endPage != null) {
    updates.endPage = body.endPage
    if (existing.startPage != null) {
      updates.pagesRead = Math.max(0, body.endPage - existing.startPage)
    }
  }

  if (body.pagesRead != null && updates.pagesRead == null) {
    updates.pagesRead = body.pagesRead
  }

  switch (body.action) {
    case 'pause':
      if (existing.status !== 'active') {
        throw createError({ statusCode: 400, statusMessage: 'Can only pause an active session' })
      }
      updates.status = 'paused'
      break

    case 'resume':
      if (existing.status !== 'paused') {
        throw createError({ statusCode: 400, statusMessage: 'Can only resume a paused session' })
      }
      updates.status = 'active'
      break

    case 'complete':
      if (existing.status !== 'active' && existing.status !== 'paused') {
        throw createError({ statusCode: 400, statusMessage: 'Cannot complete this session' })
      }
      updates.status = 'completed'
      updates.endedAt = new Date()

      // Update the book's current page if endPage provided
      if (body.endPage != null) {
        const [ub] = await db
          .select({ id: userBooks.id, bookId: userBooks.bookId })
          .from(userBooks)
          .where(eq(userBooks.id, existing.userBookId))
          .limit(1)

        if (ub) {
          const [bookRow] = await db
            .select({ pageCount: books.pageCount })
            .from(books)
            .where(eq(books.id, ub.bookId))
            .limit(1)

          const pageCount = bookRow?.pageCount ?? null
          const progressPercent = pageCount
            ? Math.min(100, Math.round((body.endPage / pageCount) * 10000) / 100).toString()
            : null

          await db.update(userBooks).set({
            currentPage: body.endPage,
            ...(progressPercent ? { progressPercent } : {}),
            updatedAt: new Date(),
          }).where(eq(userBooks.id, existing.userBookId))
        }
      }
      break

    case 'abandon':
      updates.status = 'abandoned'
      updates.endedAt = new Date()
      break
  }

  const [updated] = await db
    .update(readingSessions)
    .set(updates)
    .where(eq(readingSessions.id, sessionId))
    .returning()

  return updated
})
