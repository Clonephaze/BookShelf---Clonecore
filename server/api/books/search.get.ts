import { searchBooks } from '../../services/book-api'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()

  if (!q || q.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query must be at least 2 characters',
    })
  }

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 40)
  const config = useRuntimeConfig()

  const results = await searchBooks(q, limit, config.googleBooksApiKey)

  return results
})
