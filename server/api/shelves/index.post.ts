import { eq, and, sql } from 'drizzle-orm'
import { useDB } from '../../database'
import { shelves } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const body = await readBody<{ name: string; icon?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Shelf name is required' })
  }

  const name = body.name.trim()

  if (name.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Shelf name must be 50 characters or less' })
  }

  const slug = slugify(name)

  // Check for duplicate slug for this user
  const [existing] = await db
    .select({ id: shelves.id })
    .from(shelves)
    .where(and(eq(shelves.userId, session.user.id), eq(shelves.slug, slug)))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'A shelf with this name already exists' })
  }

  // Get next position
  const [maxPos] = await db
    .select({ max: sql<number>`coalesce(max(${shelves.position}), -1)` })
    .from(shelves)
    .where(eq(shelves.userId, session.user.id))

  const [newShelf] = await db.insert(shelves).values({
    userId: session.user.id,
    name,
    slug,
    position: (maxPos?.max ?? -1) + 1,
    isDefault: false,
    icon: body.icon || null,
  }).returning()

  return newShelf
})
