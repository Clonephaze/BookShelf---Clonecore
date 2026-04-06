import { eq } from 'drizzle-orm'
import { useDB } from '../../database'
import { recommendationDismissals, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const body = await readBody(event)

  const bookId = body?.bookId
  if (!bookId || typeof bookId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'bookId is required' })
  }

  const db = useDB()

  // Verify the book exists
  const [book] = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId)).limit(1)
  if (!book) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  // Upsert dismissal (ignore if already dismissed)
  await db
    .insert(recommendationDismissals)
    .values({
      userId: session.user.id,
      bookId,
    })
    .onConflictDoNothing()

  return { success: true }
})
