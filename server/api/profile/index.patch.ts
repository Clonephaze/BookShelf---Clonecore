import { eq, and, ne } from 'drizzle-orm'
import { useDB } from '../../database'
import * as schema from '../../database/schema'
import { requireServerSession } from '../../utils/session'

const AVATAR_IDS = ['owl', 'cat', 'fox', 'coffee', 'books', 'moon', 'plant', 'glasses', 'bookmark', 'lamp']
const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const body = await readBody(event)
  const db = useDB()
  const updates: Partial<{ username: string | null; avatar: string | null; name: string; updatedAt: Date }> = {}

  if (body.username !== undefined) {
    if (body.username === null || body.username === '') {
      updates.username = null
    }
    else {
      const username = String(body.username).toLowerCase().trim()
      if (!USERNAME_REGEX.test(username)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username must be 3–20 characters: lowercase letters, numbers, underscores, hyphens.',
        })
      }
      const [existing] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(and(
          eq(schema.user.username, username),
          ne(schema.user.id, session.user.id),
        ))
        .limit(1)

      if (existing) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Username is already taken.',
        })
      }
      updates.username = username
    }
  }

  if (body.avatar !== undefined) {
    if (body.avatar === null || body.avatar === '') {
      updates.avatar = null
    }
    else {
      if (!AVATAR_IDS.includes(body.avatar)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid avatar.',
        })
      }
      updates.avatar = body.avatar
    }
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (name.length < 1 || name.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name must be between 1 and 100 characters.',
      })
    }
    updates.name = name
  }

  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nothing to update.',
    })
  }

  updates.updatedAt = new Date()

  await db
    .update(schema.user)
    .set(updates)
    .where(eq(schema.user.id, session.user.id))

  return { success: true }
})
