import { fetchSeriesSlugForBook } from '../../../services/book-api/hardcover'

export default defineEventHandler(async (event) => {
  const bookSlug = getRouterParam(event, 'slug')

  if (!bookSlug || bookSlug.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid book slug' })
  }

  const seriesSlug = await fetchSeriesSlugForBook(bookSlug)

  if (!seriesSlug) {
    throw createError({ statusCode: 404, statusMessage: 'No series found for this book' })
  }

  // Redirect to the main series endpoint which handles caching
  return sendRedirect(event, `/api/series/${encodeURIComponent(seriesSlug)}`, 302)
})
