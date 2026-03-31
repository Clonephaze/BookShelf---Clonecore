import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { shelves, userBookShelves } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const shelfId = getRouterParam(event, 'id')

  if (!shelfId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing shelf ID' })
  }

  // Verify shelf belongs to user
  const [shelf] = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.id, shelfId), eq(shelves.userId, session.user.id)))
    .limit(1)

  if (!shelf) {
    throw createError({ statusCode: 404, statusMessage: 'Shelf not found' })
  }

  if (shelf.isDefault) {
    throw createError({ statusCode: 403, statusMessage: 'Default shelves cannot be deleted' })
  }

  // Remove all book-shelf associations for this shelf
  await db.delete(userBookShelves).where(eq(userBookShelves.shelfId, shelfId))

  // Delete the shelf
  await db.delete(shelves).where(eq(shelves.id, shelfId))

  return { success: true }
})
