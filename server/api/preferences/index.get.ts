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
      showShelves: true,
      showProgress: true,
      showRatings: true,
      showGoals: true,
      showActivity: true,
    }
  }

  return {
    theme: prefs.theme,
    defaultShelfId: prefs.defaultShelfId,
    booksPerRow: prefs.booksPerRow,
    showShelves: prefs.showShelves,
    showProgress: prefs.showProgress,
    showRatings: prefs.showRatings,
    showGoals: prefs.showGoals,
    showActivity: prefs.showActivity,
  }
})
