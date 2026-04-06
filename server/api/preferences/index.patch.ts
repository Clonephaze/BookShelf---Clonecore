import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { userPreferences } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

const VALID_THEMES = ['system', 'light', 'dark', 'oled']

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const body = await readBody(event)
  const db = useDB()
  const userId = session.user.id

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.theme !== undefined) {
    if (!VALID_THEMES.includes(body.theme)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid theme.' })
    }
    updates.theme = body.theme
  }

  if (body.defaultShelfId !== undefined) {
    // Allow null to clear the default
    updates.defaultShelfId = body.defaultShelfId ?? null
  }

  if (body.booksPerRow !== undefined) {
    const val = Number(body.booksPerRow)
    if (body.booksPerRow !== null && (!Number.isInteger(val) || val < 3 || val > 12)) {
      throw createError({ statusCode: 400, statusMessage: 'Books per row must be 3–12.' })
    }
    updates.booksPerRow = body.booksPerRow === null ? null : val
  }

  // Appearance
  const VALID_FONTS = ['default', 'sans', 'atkinson']
  if (body.fontFamily !== undefined) {
    if (!VALID_FONTS.includes(body.fontFamily)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid font family.' })
    }
    updates.fontFamily = body.fontFamily
  }

  const VALID_ACCENTS = ['copper', 'teal', 'plum', 'slate', 'forest']
  if (body.accentColor !== undefined) {
    if (!VALID_ACCENTS.includes(body.accentColor)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid accent color.' })
    }
    updates.accentColor = body.accentColor
  }

  if (body.readingComfort !== undefined) {
    updates.readingComfort = Boolean(body.readingComfort)
  }

  if (body.simpleShelfView !== undefined) {
    updates.simpleShelfView = Boolean(body.simpleShelfView)
  }

  // Privacy toggles
  const privacyFields = ['showShelves', 'showProgress', 'showRatings', 'showGoals', 'showActivity'] as const
  for (const field of privacyFields) {
    if (body[field] !== undefined) {
      updates[field] = Boolean(body[field])
    }
  }

  // Upsert: insert if not exists, update if exists
  const [existing] = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)

  if (existing) {
    await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
  }
  else {
    await db
      .insert(userPreferences)
      .values({
        userId,
        ...updates,
      })
  }

  return { ok: true }
})
