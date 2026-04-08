import { eq, inArray } from 'drizzle-orm'
import { useDB } from '../../database'
import { series, seriesBooks, books } from '../../database/schema'
import { fetchSeries } from '../../services/book-api/hardcover'

export default defineEventHandler(async (event) => {
  const slugParam = getRouterParam(event, 'slug')

  if (!slugParam || slugParam.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid series slug' })
  }

  const db = useDB()

  // Check if we have cached series data
  const [cached] = await db
    .select()
    .from(series)
    .where(eq(series.hardcoverSlug, slugParam))
    .limit(1)

  const isStale = cached && (Date.now() - cached.fetchedAt.getTime() > 7 * 24 * 60 * 60 * 1000)

  if (cached && !isStale) {
    // Return cached data with books
    const cachedBooks = await db
      .select()
      .from(seriesBooks)
      .where(eq(seriesBooks.seriesId, cached.id))
      .orderBy(seriesBooks.position)

    setResponseHeader(event, 'Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')

    return {
      id: cached.id,
      name: cached.name,
      slug: cached.hardcoverSlug,
      authorName: cached.authorName,
      booksCount: cached.booksCount,
      books: cachedBooks.map(b => ({
        position: b.position,
        title: b.title,
        hardcoverSlug: b.hardcoverSlug,
        coverUrl: b.coverUrl,
        bookId: b.bookId,
      })),
    }
  }

  // Fetch from Hardcover
  const seriesData = await fetchSeries(slugParam)

  if (!seriesData) {
    throw createError({ statusCode: 404, statusMessage: 'Series not found' })
  }

  // Upsert series record
  let seriesId: string

  if (cached) {
    // Update existing
    await db.update(series).set({
      name: seriesData.name,
      authorName: seriesData.authorName,
      booksCount: seriesData.booksCount,
      fetchedAt: new Date(),
    }).where(eq(series.id, cached.id))
    seriesId = cached.id

    // Delete old books and re-insert
    await db.delete(seriesBooks).where(eq(seriesBooks.seriesId, seriesId))
  }
  else {
    const [inserted] = await db.insert(series).values({
      name: seriesData.name,
      hardcoverSlug: seriesData.slug,
      authorName: seriesData.authorName,
      booksCount: seriesData.booksCount,
    }).returning({ id: series.id })

    if (!inserted) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create series' })
    }
    seriesId = inserted.id
  }

  // Cross-reference with our books table by matching hardcover slugs
  const bookSlugs = seriesData.books.map(b => b.hardcoverSlug).filter(Boolean)
  const ownedBookMap = new Map<string, string>()

  if (bookSlugs.length > 0) {
    const ownedBooks = await db
      .select({ id: books.id, hardcoverSlug: books.hardcoverSlug })
      .from(books)
      .where(inArray(books.hardcoverSlug, bookSlugs))

    for (const ob of ownedBooks) {
      if (ob.hardcoverSlug) ownedBookMap.set(ob.hardcoverSlug, ob.id)
    }
  }

  // Insert series books
  if (seriesData.books.length > 0) {
    await db.insert(seriesBooks).values(
      seriesData.books.map(b => ({
        seriesId,
        position: b.position?.toString() ?? '?',
        title: b.title,
        hardcoverSlug: b.hardcoverSlug,
        coverUrl: b.coverUrl,
        bookId: ownedBookMap.get(b.hardcoverSlug) ?? null,
      })),
    )
  }

  setResponseHeader(event, 'Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')

  return {
    id: seriesId,
    name: seriesData.name,
    slug: seriesData.slug,
    authorName: seriesData.authorName,
    booksCount: seriesData.booksCount,
    books: seriesData.books.map(b => ({
      position: b.position,
      title: b.title,
      hardcoverSlug: b.hardcoverSlug,
      coverUrl: b.coverUrl,
      bookId: ownedBookMap.get(b.hardcoverSlug) ?? null,
    })),
  }
})
