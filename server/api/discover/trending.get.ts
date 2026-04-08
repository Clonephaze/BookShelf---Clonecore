import { fetchTrending } from '../../services/book-api/hardcover'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 40)

  setResponseHeader(event, 'Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  try {
    const results = await fetchTrending(limit)
    return { results }
  }
  catch (err) {
    console.error('[Trending] Fetch failed:', err)
    return { results: [] }
  }
})
