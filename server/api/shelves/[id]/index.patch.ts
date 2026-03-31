import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { shelves } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const shelfId = getRouterParam(event, 'id')

  if (!shelfId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing shelf ID' })
  }

  const body = await readBody<{ name?: string; icon?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Shelf name is required' })
  }

  const name = body.name.trim()

  if (name.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Shelf name must be 50 characters or less' })
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
    throw createError({ statusCode: 403, statusMessage: 'Default shelves cannot be renamed' })
  }

  // Generate new slug
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const [updated] = await db
    .update(shelves)
    .set({ name, slug, icon: body.icon ?? shelf.icon, updatedAt: new Date() })
    .where(eq(shelves.id, shelfId))
    .returning()

  return updated
})
