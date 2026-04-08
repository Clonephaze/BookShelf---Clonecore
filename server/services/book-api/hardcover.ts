// ============================================
// Hardcover Adapter — Bookshelf
// ============================================
// Docs: https://docs.hardcover.app/api/getting-started
// GraphQL: https://api.hardcover.app/v1/graphql
// Rate limit: 60 req/min (we self-limit to 40)
// ============================================

import type { BookSearchResult } from './types'
import { checkHardcoverRateLimit } from '../../utils/hardcover-rate-limit'

const HC_API_URL = 'https://api.hardcover.app/v1/graphql'

interface HardcoverSearchResult {
  id: number
  title: string
  subtitle?: string
  slug: string
  author_names?: string[]
  isbns?: string[]
  description?: string
  pages?: number
  audio_seconds?: number
  has_audiobook?: boolean
  rating?: number
  ratings_count?: number
  release_year?: number
  genres?: string[]
  moods?: string[]
  content_warnings?: string[]
  featured_series?: {
    position?: number
    series?: {
      name: string
      slug: string
      books_count?: number
    }
  }
  image?: {
    url?: string
  }
  cover_color?: string
  users_count?: number
}

interface HardcoverEdition {
  id: number
  isbn_13?: string
  isbn_10?: string
  title?: string
  pages?: number
  audio_seconds?: number
  reading_format_id?: number
  publisher?: { name?: string }
  cached_image?: { url?: string }
}

interface HardcoverBook {
  id: number
  title: string
  subtitle?: string
  slug: string
  description?: string
  pages?: number
  audio_seconds?: number
  rating?: number
  ratings_count?: number
  release_date?: string
  cached_image?: { url?: string }
  contributions?: Array<{ author?: { name?: string } }>
  editions?: HardcoverEdition[]
  book_series?: Array<{
    position?: number
    series?: {
      name?: string
      slug?: string
      author?: { name?: string }
      books_count?: number
    }
  }>
  taggable_counts?: Array<{
    taggable_type?: string
    tag?: { tag?: string }
    count?: number
  }>
}

interface HardcoverSeriesBook {
  position: number
  book: {
    id: number
    title: string
    slug: string
    cached_image?: { url?: string }
    contributions?: Array<{ author?: { name?: string } }>
    users_count?: number
  }
}

interface HardcoverSeriesResult {
  id: number
  name: string
  slug: string
  books_count: number
  author?: { name?: string }
  book_series: HardcoverSeriesBook[]
}

/** Execute a GraphQL query against the Hardcover API */
async function query<T>(graphqlQuery: string, variables?: Record<string, unknown>): Promise<T> {
  const config = useRuntimeConfig()
  const token = config.hardcoverApiToken

  if (!token) {
    throw new Error('HARDCOVER_API_TOKEN not configured')
  }

  if (!checkHardcoverRateLimit()) {
    throw new Error('Hardcover rate limit exceeded')
  }

  const response = await $fetch<{ data?: T, errors?: Array<{ message: string }> }>(HC_API_URL, {
    method: 'POST',
    headers: {
      'authorization': token,
      'content-type': 'application/json',
      'user-agent': 'Bookshelf/1.0 (book-tracking-app)',
    },
    body: { query: graphqlQuery, variables },
    timeout: 10000,
  })

  if (response.errors && response.errors.length > 0) {
    const firstError = response.errors[0]
    throw new Error(`Hardcover API error: ${firstError ? firstError.message : 'Unknown error'}`)
  }

  if (!response.data) {
    throw new Error('Hardcover API returned no data')
  }

  return response.data
}

/** Extract ISBN-13 and ISBN-10 from Hardcover's isbn array */
function extractISBNs(isbns?: string[]): { isbn13?: string, isbn10?: string } {
  if (!isbns?.length) return {}
  let isbn13: string | undefined
  let isbn10: string | undefined
  for (const isbn of isbns) {
    const clean = isbn.replace(/[- ]/g, '')
    if (clean.length === 13 && clean.startsWith('978') && !isbn13) isbn13 = clean
    else if (clean.length === 10 && !isbn10) isbn10 = clean
    if (isbn13 && isbn10) break
  }
  return { isbn13, isbn10 }
}

/** Extract cover URL from Hardcover's cached_image */
function extractCoverUrl(cachedImage?: { url?: string }): string | undefined {
  if (!cachedImage?.url) return undefined
  // Hardcover serves covers via their CDN
  return cachedImage.url
}

/** Normalize a Hardcover search result to BookSearchResult */
function normalizeSearchResult(result: HardcoverSearchResult): BookSearchResult {
  const { isbn13, isbn10 } = extractISBNs(result.isbns)
  const [author = 'Unknown Author', ...additionalAuthors] = result.author_names ?? []

  return {
    title: result.title,
    author,
    ...(additionalAuthors.length && { additionalAuthors }),
    isbn13,
    isbn10,
    pageCount: result.pages,
    publishedDate: result.release_year?.toString(),
    genres: result.genres,
    description: result.description,
    hardcoverSlug: result.slug,
    hardcoverId: result.id,
    audioSeconds: result.audio_seconds,
    hasAudiobook: result.has_audiobook,
    moods: result.moods,
    contentWarnings: result.content_warnings,
    coverUrl: result.image?.url,
    hardcoverRating: result.rating,
    hardcoverRatingsCount: result.ratings_count,
    seriesName: result.featured_series?.series?.name,
    seriesPosition: result.featured_series?.position,
    seriesSlug: result.featured_series?.series?.slug,
  }
}

/**
 * Search Hardcover for books.
 * Uses the Typesense-backed search endpoint.
 */
export async function searchHardcover(
  searchQuery: string,
  limit: number = 20,
): Promise<BookSearchResult[]> {
  const config = useRuntimeConfig()
  if (!config.hardcoverApiToken) return []

  try {
    const data = await query<{ search: { results: string } }>(`
      query SearchBooks($q: String!, $perPage: Int!, $page: Int!) {
        search(
          query: $q,
          query_type: "Book",
          per_page: $perPage,
          page: $page
        ) {
          results
        }
      }
    `, { q: searchQuery, perPage: limit, page: 1 })

    // Results come back as a JSON string from Typesense, or as an already-parsed object
    const parsed = typeof data.search.results === 'string'
      ? JSON.parse(data.search.results)
      : data.search.results

    // Typesense response can be { hits: [{ document: ... }] } or a flat array
    const hits = Array.isArray(parsed) ? parsed : (parsed?.hits || [])
    if (!Array.isArray(hits) || hits.length === 0) return []

    return hits
      .filter((hit: { document?: HardcoverSearchResult }) => hit.document)
      .map((hit: { document: HardcoverSearchResult }) => normalizeSearchResult(hit.document))
      .slice(0, limit)
  }
  catch (err) {
    console.warn('[Hardcover] Search failed:', (err as Error).message)
    return []
  }
}

/**
 * Fetch enrichment data for a book by ISBN.
 * Returns Hardcover-specific metadata (slug, audiobook info, moods, content warnings, series).
 */
export async function fetchBookByISBN(isbn13: string): Promise<{
  hardcoverSlug?: string
  hardcoverId?: number
  audioSeconds?: number
  hasAudiobook?: boolean
  contentWarnings?: string[]
  moods?: string[]
  seriesName?: string
  seriesPosition?: number
  seriesSlug?: string
  hardcoverRating?: number
  hardcoverRatingsCount?: number
  description?: string
} | null> {
  const config = useRuntimeConfig()
  if (!config.hardcoverApiToken) return null

  try {
    const data = await query<{ editions: HardcoverEdition[] }>(`
      query GetBookByISBN($isbn: String!) {
        editions(where: { isbn_13: { _eq: $isbn } }, limit: 1) {
          id
          isbn_13
          isbn_10
          book_id
        }
      }
    `, { isbn: isbn13 })

    if (!data.editions?.length) return null

    const edition = data.editions[0]
    const bookId = (edition as unknown as { book_id?: number }).book_id
    if (!bookId) return null

    // Fetch full book details
    const bookData = await query<{ books: HardcoverBook[] }>(`
      query GetBookDetails($id: Int!) {
        books(where: { id: { _eq: $id } }, limit: 1) {
          id
          title
          slug
          description
          pages
          audio_seconds
          rating
          ratings_count
          release_date
          cached_image
          book_series {
            position
            series {
              name
              slug
              books_count
            }
          }
          taggable_counts(
            where: { count: { _gte: 3 } }
            order_by: { count: desc }
            limit: 10
          ) {
            taggable_type
            tag {
              tag
            }
            count
          }
        }
      }
    `, { id: bookId })

    const book = bookData.books?.[0]
    if (!book) return null

    const seriesEntry = book.book_series?.[0]

    // Extract moods and content warnings from tags
    const moods: string[] = []
    const contentWarnings: string[] = []
    for (const tc of book.taggable_counts ?? []) {
      const tag = tc.tag?.tag
      if (!tag) continue
      if (tc.taggable_type === 'Mood') moods.push(tag)
      else if (tc.taggable_type === 'ContentWarning') contentWarnings.push(tag)
    }

    return {
      hardcoverSlug: book.slug,
      hardcoverId: book.id,
      audioSeconds: book.audio_seconds ?? undefined,
      hasAudiobook: (book.audio_seconds ?? 0) > 0,
      contentWarnings: contentWarnings.length ? contentWarnings : undefined,
      moods: moods.length ? moods : undefined,
      seriesName: seriesEntry?.series?.name,
      seriesPosition: seriesEntry?.position,
      seriesSlug: seriesEntry?.series?.slug,
      hardcoverRating: book.rating ?? undefined,
      hardcoverRatingsCount: book.ratings_count ?? undefined,
      description: book.description ?? undefined,
    }
  }
  catch (err) {
    console.warn('[Hardcover] ISBN lookup failed:', (err as Error).message)
    return null
  }
}

/**
 * Fetch audio_seconds for a book by its Hardcover ID.
 * Lightweight single-field query for when Typesense only provides has_audiobook boolean.
 */
export async function fetchAudioDuration(hardcoverId: number): Promise<number | null> {
  const config = useRuntimeConfig()
  if (!config.hardcoverApiToken) return null

  try {
    const data = await query<{ books: { audio_seconds: number | null }[] }>(`
      query GetAudioDuration($id: Int!) {
        books(where: { id: { _eq: $id } }, limit: 1) {
          audio_seconds
        }
      }
    `, { id: hardcoverId })

    return data.books?.[0]?.audio_seconds ?? null
  }
  catch (err) {
    console.warn('[Hardcover] Audio duration fetch failed:', (err as Error).message)
    return null
  }
}

/**
 * Fetch a full series with all books in order.
 */
export async function fetchSeries(seriesSlug: string): Promise<{
  name: string
  slug: string
  authorName?: string
  booksCount: number
  books: Array<{
    position: number
    title: string
    hardcoverSlug: string
    coverUrl?: string
    authorName?: string
  }>
} | null> {
  const config = useRuntimeConfig()
  if (!config.hardcoverApiToken) return null

  try {
    const data = await query<{ series: HardcoverSeriesResult[] }>(`
      query GetSeries($slug: String!) {
        series(where: { slug: { _eq: $slug }, canonical_id: { _is_null: true } }, limit: 1) {
          id
          name
          slug
          books_count
          author {
            name
          }
          book_series(
            distinct_on: position
            order_by: [{ position: asc }, { book: { users_count: desc } }]
            where: {
              book: { canonical_id: { _is_null: true } }
              compilation: { _eq: false }
            }
          ) {
            position
            book {
              id
              title
              slug
              cached_image
              contributions(limit: 1) {
                author {
                  name
                }
              }
              users_count
            }
          }
        }
      }
    `, { slug: seriesSlug })

    const s = data.series?.[0]
    if (!s) return null

    return {
      name: s.name,
      slug: s.slug,
      authorName: s.author?.name,
      booksCount: s.books_count,
      books: s.book_series.map(bs => ({
        position: bs.position,
        title: bs.book.title,
        hardcoverSlug: bs.book.slug,
        coverUrl: extractCoverUrl(bs.book.cached_image),
        authorName: bs.book.contributions?.[0]?.author?.name,
      })),
    }
  }
  catch (err) {
    console.warn('[Hardcover] Series fetch failed:', (err as Error).message)
    return null
  }
}

/**
 * Look up the series slug for a book by its Hardcover slug.
 * Returns the series slug or null if the book has no series.
 */
export async function fetchSeriesSlugForBook(bookSlug: string): Promise<string | null> {
  const config = useRuntimeConfig()
  if (!config.hardcoverApiToken) return null

  try {
    const data = await query<{ books: Array<{ book_series?: Array<{ series?: { slug?: string } }> }> }>(`
      query GetBookSeries($slug: String!) {
        books(where: { slug: { _eq: $slug }, canonical_id: { _is_null: true } }, limit: 1) {
          book_series(limit: 1) {
            series {
              slug
            }
          }
        }
      }
    `, { slug: bookSlug })

    return data.books?.[0]?.book_series?.[0]?.series?.slug ?? null
  }
  catch (err) {
    console.warn('[Hardcover] Book series lookup failed:', (err as Error).message)
    return null
  }
}

/**
 * Fetch trending books from Hardcover.
 * Periods: 'recent' (3 months), 'year', 'all' (all-time)
 */
export async function fetchTrending(limit: number = 20): Promise<BookSearchResult[]> {
  const config = useRuntimeConfig()
  if (!config.hardcoverApiToken) return []

  try {
    const data = await query<{ books: HardcoverBook[] }>(`
      query GetTrending($limit: Int!) {
        books(
          order_by: { users_read_count: desc }
          limit: $limit
          where: {
            canonical_id: { _is_null: true }
            users_read_count: { _gt: 10 }
          }
        ) {
          id
          title
          slug
          description
          pages
          audio_seconds
          rating
          ratings_count
          release_date
          cached_image
          contributions(limit: 3) {
            author {
              name
            }
          }
          editions(
            where: { reading_format_id: { _eq: 1 } }
            limit: 1
          ) {
            isbn_13
            isbn_10
            publisher {
              name
            }
          }
          book_series(limit: 1) {
            position
            series {
              name
              slug
            }
          }
          taggable_counts(
            where: { taggable_type: { _in: ["Genre", "Mood", "ContentWarning"] } }
            order_by: { count: desc }
            limit: 10
          ) {
            taggable_type
            tag {
              tag
            }
            count
          }
        }
      }
    `, { limit })

    return data.books.map((book): BookSearchResult => {
      const authors = book.contributions?.map(c => c.author?.name).filter(Boolean) as string[] ?? []
      const [author = 'Unknown Author', ...additionalAuthors] = authors
      const seriesEntry = book.book_series?.[0]
      const edition = book.editions?.[0]

      // Extract genres, moods, and content warnings from taggable_counts
      const genres: string[] = []
      const moods: string[] = []
      const contentWarnings: string[] = []
      for (const t of book.taggable_counts ?? []) {
        const tag = t.tag?.tag
        if (!tag) continue
        if (t.taggable_type === 'Genre') genres.push(tag)
        else if (t.taggable_type === 'Mood') moods.push(tag)
        else if (t.taggable_type === 'ContentWarning') contentWarnings.push(tag)
      }

      return {
        title: book.title,
        author,
        ...(additionalAuthors.length && { additionalAuthors }),
        isbn13: edition?.isbn_13 ?? undefined,
        isbn10: edition?.isbn_10 ?? undefined,
        coverUrl: extractCoverUrl(book.cached_image),
        pageCount: book.pages,
        publishedDate: book.release_date,
        description: book.description,
        publisher: edition?.publisher?.name ?? undefined,
        hardcoverSlug: book.slug,
        hardcoverId: book.id,
        audioSeconds: book.audio_seconds ?? undefined,
        hasAudiobook: (book.audio_seconds ?? 0) > 0,
        hardcoverRating: book.rating ?? undefined,
        hardcoverRatingsCount: book.ratings_count ?? undefined,
        seriesName: seriesEntry?.series?.name,
        seriesPosition: seriesEntry?.position,
        seriesSlug: seriesEntry?.series?.slug,
        ...(genres.length && { genres }),
        ...(moods.length && { moods }),
        ...(contentWarnings.length && { contentWarnings }),
      }
    })
  }
  catch (err) {
    console.warn('[Hardcover] Trending fetch failed:', (err as Error).message)
    return []
  }
}
