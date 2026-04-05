import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { userBooks, readingProgressLog } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

interface PatchBody {
  rating?: number | null
  notes?: string | null
  dateStarted?: string | null
  dateFinished?: string | null
  currentPage?: number | null
  progressPercent?: string | null
  totalMinutes?: number | null
  currentMinutes?: number | null
}

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userBookId = getRouterParam(event, 'id')

  if (!userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing book ID' })
  }

  const body = await readBody<PatchBody>(event)

  // Validate rating if provided
  if (body.rating !== undefined && body.rating !== null) {
    const r = Number(body.rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw createError({ statusCode: 400, statusMessage: 'Rating must be an integer between 1 and 5' })
    }
  }

  // Verify the user-book belongs to this user
  const [ub] = await db
    .select({ id: userBooks.id, currentPage: userBooks.currentPage, currentMinutes: userBooks.currentMinutes })
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))
    .limit(1)

  if (!ub) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found in your library' })
  }

  // Build update object from only the fields sent in the request
  const updateData: Partial<typeof userBooks.$inferInsert> = {}

  if ('rating' in body) {
    updateData.rating = body.rating !== null ? Number(body.rating) : null
  }
  if ('notes' in body) {
    updateData.notes = body.notes ?? null
  }
  if ('dateStarted' in body) {
    updateData.dateStarted = body.dateStarted ? new Date(body.dateStarted) : null
  }
  if ('dateFinished' in body) {
    updateData.dateFinished = body.dateFinished ? new Date(body.dateFinished) : null
  }
  if ('currentPage' in body) {
    if (body.currentPage !== null) {
      const p = Number(body.currentPage)
      if (!Number.isInteger(p) || p < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Page number must be a non-negative integer' })
      }
      updateData.currentPage = p
    }
    else {
      updateData.currentPage = null
    }
  }
  if ('progressPercent' in body) {
    if (body.progressPercent !== null) {
      const pct = Number(body.progressPercent)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw createError({ statusCode: 400, statusMessage: 'Progress must be between 0 and 100' })
      }
      updateData.progressPercent = String(pct)
    }
    else {
      updateData.progressPercent = null
    }
  }
  if ('totalMinutes' in body) {
    if (body.totalMinutes !== null) {
      const m = Number(body.totalMinutes)
      if (!Number.isInteger(m) || m < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Total minutes must be a non-negative integer' })
      }
      updateData.totalMinutes = m
    }
    else {
      updateData.totalMinutes = null
    }
  }
  if ('currentMinutes' in body) {
    if (body.currentMinutes !== null) {
      const m = Number(body.currentMinutes)
      if (!Number.isInteger(m) || m < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Current minutes must be a non-negative integer' })
      }
      updateData.currentMinutes = m
    }
    else {
      updateData.currentMinutes = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })
  }

  updateData.updatedAt = new Date()

  await db
    .update(userBooks)
    .set(updateData)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))

  // Log progress history when page, percentage, or minutes changes
  if ('currentPage' in body || 'progressPercent' in body || 'currentMinutes' in body) {
    const fromPage = ub.currentPage ?? undefined
    const toPage = updateData.currentPage ?? undefined
    const logPercent = updateData.progressPercent ?? undefined
    const oldMinutes = ub.currentMinutes ?? 0
    const newMinutes = updateData.currentMinutes ?? undefined
    const listened = (newMinutes != null && newMinutes > oldMinutes) ? newMinutes - oldMinutes : undefined
    await db.insert(readingProgressLog).values({
      userBookId,
      fromPage,
      toPage,
      pagesRead: (toPage != null && fromPage != null && toPage > fromPage) ? toPage - fromPage : undefined,
      minutesListened: listened,
      progressPercent: logPercent,
    })
  }

  return { success: true, updatedAt: updateData.updatedAt!.toISOString() }
})
