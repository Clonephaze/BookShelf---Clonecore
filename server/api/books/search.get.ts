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

  if (q.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query is too long',
    })
  }

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 40)
  const sort = (query.sort as string) === 'relevance' ? 'relevance' : 'best-match'
  const config = useRuntimeConfig()

  try {
    const results = await searchBooks(q, limit, config.googleBooksApiKey, sort)
    setResponseHeader(event, 'Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return results
  }
  catch (err) {
    console.error('[BookSearch] Upstream error:', err)
    throw createError({
      statusCode: 502,
      statusMessage: 'Book search is temporarily unavailable',
    })
  }
})
