import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { shelves } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()

  const userShelves = await db
    .select()
    .from(shelves)
    .where(eq(shelves.userId, session.user.id))
    .orderBy(shelves.position)

  return userShelves
})
