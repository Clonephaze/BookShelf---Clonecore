import { eq, and } from 'drizzle-orm'
import { useDB } from '../../../database'
import { books, userBooks } from '../../../database/schema'
import { requireServerSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userBookId = getRouterParam(event, 'id')

  if (!userBookId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing book ID' })
  }

  const body = await readBody<{ coverUrl: string }>(event)

  if (!body?.coverUrl || typeof body.coverUrl !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing cover URL' })
  }

  // Validate URL format
  try {
    const url = new URL(body.coverUrl)
    const allowedHosts = ['covers.openlibrary.org', 'books.google.com', 'encrypted-tbn0.gstatic.com']
    if (!allowedHosts.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
      throw new Error('Untrusted host')
    }
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or untrusted cover URL' })
  }

  // Verify ownership and get book ID
  const [row] = await db
    .select({ bookId: userBooks.bookId })
    .from(userBooks)
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, session.user.id)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found in your library' })
  }

  await db
    .update(books)
    .set({ coverUrl: body.coverUrl })
    .where(eq(books.id, row.bookId))

  return { success: true }
})
