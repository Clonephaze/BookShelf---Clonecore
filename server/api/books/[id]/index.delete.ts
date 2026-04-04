import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { userBooks } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userBookId = getRouterParam(event, 'id')

  if (!userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing book ID' })
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

  // Delete the user-book record (cascade removes shelf associations)
  await db.delete(userBooks).where(eq(userBooks.id, userBookId))

  return { success: true }
})
