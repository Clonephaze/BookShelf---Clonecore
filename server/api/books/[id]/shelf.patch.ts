import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { userBooks, userBookShelves, shelves } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userBookId = getRouterParam(event, 'id')

  if (!userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing book ID' })
  }

  const body = await readBody<{ shelfId: string }>(event)

  if (!body?.shelfId) {
    throw createError({ statusCode: 400, statusMessage: 'Target shelf ID is required' })
  }

  // Verify the user-book belongs to this user
  const [ub] = await db
    .select({ id: userBooks.id })
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))
    .limit(1)

  if (!ub) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found in your library' })
  }

  // Verify target shelf belongs to user
  const [targetShelf] = await db
    .select({ id: shelves.id })
    .from(shelves)
    .where(and(eq(shelves.id, body.shelfId), eq(shelves.userId, session.user.id)))
    .limit(1)

  if (!targetShelf) {
    throw createError({ statusCode: 404, statusMessage: 'Target shelf not found' })
  }

  // Remove all current shelf associations for this user-book
  await db.delete(userBookShelves).where(eq(userBookShelves.userBookId, userBookId))

  // Add to new shelf as primary
  await db.insert(userBookShelves).values({
    userBookId,
    shelfId: body.shelfId,
    isPrimary: true,
  })

  return { success: true }
})
