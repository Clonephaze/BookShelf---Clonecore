import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { userPreferences } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)

  if (!prefs) {
    return {
      theme: 'system',
      defaultShelfId: null,
      booksPerRow: null,
    }
  }

  return {
    theme: prefs.theme,
    defaultShelfId: prefs.defaultShelfId,
    booksPerRow: prefs.booksPerRow,
  }
})
