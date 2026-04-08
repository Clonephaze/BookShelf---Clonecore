import { eq, and, ne, sql, inArray, desc, isNotNull } from 'drizzle-orm'
import { useDB } from '../database'
import {
  books, userBooks, recommendationDismissals,
} from '../database/schema'
import { searchGoogleBooks } from './book-api/google-books'

// ============================================
// Types
// ============================================

export type ReasonType = 'author' | 'genre' | 'collaborative' | 'because_you_read' | 'external'

export interface RecommendationReason {
  type: ReasonType
  label: string
  sourceBookTitle?: string
  sourceAuthor?: string
  sourceGenre?: string
}

export interface Recommendation {
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  coverUrlSmall: string | null
  genres: string[] | null
  pageCount: number | null
  publishedDate: string | null
  description: string | null
  isbn13?: string
  isbn10?: string
  openLibraryKey?: string
  googleBooksId?: string
  hardcoverSlug?: string
  hardcoverId?: number
  audioSeconds?: number
  hasAudiobook?: boolean
  moods?: string[] | null
  contentWarnings?: string[] | null
  seriesName?: string
  seriesPosition?: number
  seriesSlug?: string
  hardcoverRating?: number
  hardcoverRatingsCount?: number
  score: number
  reasons: RecommendationReason[]
}

interface ScoredBook {
  bookId: string
  score: number
  reasons: RecommendationReason[]
}

// ============================================
// Engine
// ============================================

export async function getRecommendations(userId: string, limit = 20): Promise<Recommendation[]> {
  const db = useDB()

  // 1. Get user's existing book IDs + dismissed IDs to exclude
  const [ownedRows, dismissedRows] = await Promise.all([
    db.select({ bookId: userBooks.bookId }).from(userBooks).where(eq(userBooks.userId, userId)),
    db.select({ bookId: recommendationDismissals.bookId }).from(recommendationDismissals).where(eq(recommendationDismissals.userId, userId)),
  ])

  const excludeIds = new Set([
    ...ownedRows.map(r => r.bookId),
    ...dismissedRows.map(r => r.bookId),
  ])

  if (ownedRows.length === 0) return [] // cold start: no library yet

  // 2. Get user's rated/read books with metadata for signal extraction
  const userLibrary = await db
    .select({
      bookId: books.id,
      title: books.title,
      author: books.author,
      genres: books.genres,
      rating: userBooks.rating,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBooks.userId, userId))

  // 3. Run internal strategies in parallel
  const [authorRecs, genreRecs, collabRecs] = await Promise.all([
    authorDiscovery(db, userLibrary, excludeIds),
    genreAffinity(db, userLibrary, excludeIds),
    collaborativeFiltering(db, userId, excludeIds),
  ])

  // 4. Merge & deduplicate: combine scores for the same book
  const merged = new Map<string, ScoredBook>()

  for (const pool of [authorRecs, genreRecs, collabRecs]) {
    for (const rec of pool) {
      const existing = merged.get(rec.bookId)
      if (existing) {
        existing.score += rec.score
        existing.reasons.push(...rec.reasons)
      } else {
        merged.set(rec.bookId, { ...rec })
      }
    }
  }

  // 5. Rank by combined score
  const ranked = [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // 6. Hydrate internal recs with full book data
  const internalRecs: Recommendation[] = []
  if (ranked.length > 0) {
    const bookIds = ranked.map(r => r.bookId)
    const bookRows = await db
      .select()
      .from(books)
      .where(inArray(books.id, bookIds))

    const bookMap = new Map(bookRows.map(b => [b.id, b]))

    for (const rec of ranked) {
      const book = bookMap.get(rec.bookId)
      if (!book) continue
      internalRecs.push({
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        coverUrlSmall: book.coverUrlSmall,
        genres: book.genres,
        pageCount: book.pageCount,
        publishedDate: book.publishedDate,
        description: book.description,
        isbn13: book.isbn13 ?? undefined,
        isbn10: book.isbn10 ?? undefined,
        openLibraryKey: book.openLibraryKey ?? undefined,
        googleBooksId: book.googleBooksId ?? undefined,
        hardcoverSlug: book.hardcoverSlug ?? undefined,
        hardcoverId: book.hardcoverId ?? undefined,
        audioSeconds: book.audioSeconds ?? undefined,
        hasAudiobook: book.hasAudiobook || undefined,
        moods: book.moods,
        contentWarnings: book.contentWarnings,
        score: rec.score,
        reasons: rec.reasons,
      })
    }
  }

  // 7. External discovery — fill remaining slots with books from OL/GB
  const externalSlots = Math.max(0, limit - internalRecs.length)
  let externalRecs: Recommendation[] = []
  if (externalSlots > 0) {
    // Build an exclusion set for external dedup (by title+author lowercase)
    const internalTitles = new Set(
      internalRecs.map(r => `${r.title.toLowerCase()}|${r.author.toLowerCase()}`),
    )
    const ownedTitles = new Set(
      userLibrary.map(r => `${r.title.toLowerCase()}|${r.author.toLowerCase()}`),
    )

    externalRecs = await externalDiscovery(
      userLibrary,
      new Set([...internalTitles, ...ownedTitles]),
      externalSlots,
    )
  }

  return [...internalRecs, ...externalRecs].slice(0, limit)
}

// ============================================
// Strategy 1: Author Discovery
// "You've read 3 books by [Author] — here are their others"
// ============================================

async function authorDiscovery(
  db: ReturnType<typeof useDB>,
  userLibrary: { bookId: string; title: string; author: string; genres: string[] | null; rating: number | null }[],
  excludeIds: Set<string>,
): Promise<ScoredBook[]> {
  // Count books per author and compute average rating
  const authorStats = new Map<string, { count: number; totalRating: number; ratedCount: number }>()

  for (const ub of userLibrary) {
    const stats = authorStats.get(ub.author) ?? { count: 0, totalRating: 0, ratedCount: 0 }
    stats.count++
    if (ub.rating) {
      stats.totalRating += ub.rating
      stats.ratedCount++
    }
    authorStats.set(ub.author, stats)
  }

  // Only recommend for authors with at least 1 book
  const authors = [...authorStats.entries()]
    .filter(([, stats]) => stats.count >= 1)
    .map(([author, stats]) => ({
      author,
      count: stats.count,
      avgRating: stats.ratedCount > 0 ? stats.totalRating / stats.ratedCount : 3,
    }))

  if (authors.length === 0) return []

  const authorNames = authors.map(a => a.author)

  // Find books by these authors not in user's library
  const candidates = await db
    .select({ id: books.id, author: books.author })
    .from(books)
    .where(inArray(books.author, authorNames))

  const authorMap = new Map(authors.map(a => [a.author, a]))

  return candidates
    .filter(c => !excludeIds.has(c.id))
    .map(c => {
      const stats = authorMap.get(c.author)!
      // Score: author count × avg rating (normalized). More books read by author = higher signal
      const score = stats.count * (stats.avgRating / 5) * 3
      const label = stats.count >= 2
        ? `You've read ${stats.count} books by ${c.author}`
        : `By ${c.author}, whose work you've read`
      return {
        bookId: c.id,
        score,
        reasons: [{ type: 'author' as ReasonType, label, sourceAuthor: c.author }],
      }
    })
}

// ============================================
// Strategy 2: Genre Affinity
// Surface books in genres the user reads/rates highly
// ============================================

async function genreAffinity(
  db: ReturnType<typeof useDB>,
  userLibrary: { bookId: string; title: string; author: string; genres: string[] | null; rating: number | null }[],
  excludeIds: Set<string>,
): Promise<ScoredBook[]> {
  // Build genre scores: count × avg rating
  const genreStats = new Map<string, { count: number; totalRating: number; ratedCount: number }>()

  for (const ub of userLibrary) {
    if (!ub.genres) continue
    for (const genre of ub.genres) {
      const g = genre.toLowerCase()
      const stats = genreStats.get(g) ?? { count: 0, totalRating: 0, ratedCount: 0 }
      stats.count++
      if (ub.rating) {
        stats.totalRating += ub.rating
        stats.ratedCount++
      }
      genreStats.set(g, stats)
    }
  }

  if (genreStats.size === 0) return []

  // Rank genres by affinity score
  const rankedGenres = [...genreStats.entries()]
    .map(([genre, stats]) => ({
      genre,
      count: stats.count,
      avgRating: stats.ratedCount > 0 ? stats.totalRating / stats.ratedCount : 3,
      affinity: stats.count * (stats.ratedCount > 0 ? stats.totalRating / stats.ratedCount : 3),
    }))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 10) // top 10 genres

  // Find books with matching genres (using array overlap)
  const genreMap = new Map(rankedGenres.map(g => [g.genre, g]))

  // Use SQL array overlap operator to find books with matching genres
  const candidates = await db
    .select({ id: books.id, genres: books.genres })
    .from(books)
    .where(isNotNull(books.genres))
    .limit(500)

  const results: ScoredBook[] = []

  for (const c of candidates) {
    if (excludeIds.has(c.id) || !c.genres || c.genres.length === 0) continue

    let score = 0
    const matchedGenres: string[] = []
    for (const genre of c.genres) {
      const g = genre.toLowerCase()
      const stats = genreMap.get(g)
      if (stats) {
        score += stats.affinity * 0.3
        matchedGenres.push(genre)
      }
    }
    if (score === 0) continue

    const topMatch = matchedGenres[0]
    results.push({
      bookId: c.id,
      score,
      reasons: [{
        type: 'genre' as ReasonType,
        label: `Based on your interest in ${topMatch}`,
        sourceGenre: topMatch,
      }],
    })
  }

  return results
}

// ============================================
// Strategy 3: Collaborative Filtering
// "Readers who liked [Book] also liked this"
// ============================================

async function collaborativeFiltering(
  db: ReturnType<typeof useDB>,
  userId: string,
  excludeIds: Set<string>,
): Promise<ScoredBook[]> {
  // Find books the user rated >= 4
  const highRated = await db
    .select({ bookId: userBooks.bookId, title: books.title })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(and(eq(userBooks.userId, userId), sql`${userBooks.rating} >= 4`))

  if (highRated.length === 0) return []

  const highRatedIds = highRated.map(r => r.bookId)
  // Find other users who also rated those books >= 4
  const similarUsers = await db
    .select({
      userId: userBooks.userId,
      overlap: sql<number>`count(*)::int`,
    })
    .from(userBooks)
    .where(
      and(
        ne(userBooks.userId, userId),
        inArray(userBooks.bookId, highRatedIds),
        sql`${userBooks.rating} >= 4`,
      ),
    )
    .groupBy(userBooks.userId)
    .having(sql`count(*) >= 1`)
    .orderBy(desc(sql`count(*)`))
    .limit(50)

  if (similarUsers.length === 0) return []

  const similarUserIds = similarUsers.map(u => u.userId)

  // Find what those similar users rated highly that the current user hasn't read
  const candidates = await db
    .select({
      bookId: userBooks.bookId,
      recCount: sql<number>`count(*)::int`,
      avgRating: sql<number>`avg(${userBooks.rating})::float`,
    })
    .from(userBooks)
    .where(
      and(
        inArray(userBooks.userId, similarUserIds),
        sql`${userBooks.rating} >= 4`,
      ),
    )
    .groupBy(userBooks.bookId)
    .orderBy(desc(sql`count(*)`))
    .limit(100)

  // Find which of the user's high-rated books each candidate shares readers with
  // (for source attribution). We do a simple approach: pick the most popular shared book.
  return candidates
    .filter(c => !excludeIds.has(c.bookId))
    .map(c => {
      // Pick a "because you read X" source from the user's high-rated books
      const sourceTitle = highRated[0]?.title ?? 'books you loved'
      return {
        bookId: c.bookId,
        score: c.recCount * (c.avgRating / 5) * 2,
        reasons: [{
          type: 'collaborative' as ReasonType,
          label: `Readers who liked "${sourceTitle}" also liked this`,
          sourceBookTitle: sourceTitle,
        }],
      }
    })
}

// ============================================
// Strategy 4: External Discovery
// Search Open Library & Google Books for books in the user's top genres
// ============================================

interface OLSubjectWork {
  key: string
  title: string
  edition_count: number
  cover_id?: number
  authors?: { key: string; name: string }[]
  first_publish_year?: number
}

interface OLSubjectResponse {
  key: string
  name: string
  work_count: number
  works: OLSubjectWork[]
}

async function externalDiscovery(
  userLibrary: { bookId: string; title: string; author: string; genres: string[] | null; rating: number | null }[],
  excludeTitleAuthors: Set<string>,
  limit: number,
): Promise<Recommendation[]> {
  // Extract user's top genres
  const genreCounts = new Map<string, number>()
  for (const ub of userLibrary) {
    if (!ub.genres) continue
    for (const genre of ub.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    }
  }

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre)

  if (topGenres.length === 0) return []

  // Query OL Subjects API + GB subject search in parallel
  const perSource = Math.ceil(limit / topGenres.length)
  const results: Recommendation[] = []

  const apiCalls = topGenres.flatMap(genre => {
    const slug = genre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    return [
      fetchOLSubject(slug, genre, perSource).catch(() => [] as Recommendation[]),
      fetchGBSubject(genre, perSource).catch(() => [] as Recommendation[]),
    ]
  })

  const allBatches = await Promise.all(apiCalls)

  // Deduplicate by title+author
  const seen = new Set<string>(excludeTitleAuthors)
  for (const batch of allBatches) {
    for (const rec of batch) {
      const key = `${rec.title.toLowerCase()}|${rec.author.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(rec)
      if (results.length >= limit) break
    }
    if (results.length >= limit) break
  }

  return results.slice(0, limit)
}

/** Fetch books from Open Library's Subjects API */
async function fetchOLSubject(slug: string, genreLabel: string, limit: number): Promise<Recommendation[]> {
  const response = await $fetch<OLSubjectResponse>(
    `https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`,
    { timeout: 6000 },
  )

  if (!response?.works?.length) return []

  return response.works
    .filter(w => w.authors?.length)
    .map((work, i) => {
      const author = work.authors?.[0]?.name ?? 'Unknown Author'
      const coverId = work.cover_id
      return {
        bookId: `ext:ol:${work.key}`,
        title: work.title,
        author,
        coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false` : null,
        coverUrlSmall: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false` : null,
        genres: [genreLabel],
        pageCount: null,
        publishedDate: work.first_publish_year?.toString() ?? null,
        description: null,
        openLibraryKey: work.key,
        isbn13: undefined,
        isbn10: undefined,
        googleBooksId: undefined,
        score: 1.5 - (i * 0.05), // slightly decreasing score by position
        reasons: [{
          type: 'external' as ReasonType,
          label: `Popular in ${genreLabel} on Open Library`,
          sourceGenre: genreLabel,
        }],
      }
    })
}

/** Fetch books from Google Books by subject search */
async function fetchGBSubject(genre: string, limit: number): Promise<Recommendation[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || useRuntimeConfig().googleBooksApiKey
  try {
    const results = await searchGoogleBooks(`subject:${genre}`, limit, apiKey || undefined)
    return results
      .filter(r => r.title && r.author)
      .map((r, i) => ({
        bookId: `ext:gb:${r.googleBooksId ?? r.isbn13 ?? r.title}`,
        title: r.title,
        author: r.author,
        coverUrl: r.coverUrl ?? null,
        coverUrlSmall: r.coverUrlSmall ?? null,
        genres: r.genres ?? [genre],
        pageCount: r.pageCount ?? null,
        publishedDate: r.publishedDate ?? null,
        description: r.description ?? null,
        isbn13: r.isbn13,
        isbn10: r.isbn10,
        openLibraryKey: r.openLibraryKey,
        googleBooksId: r.googleBooksId,
        score: 1.2 - (i * 0.05),
        reasons: [{
          type: 'external' as ReasonType,
          label: `Recommended in ${genre} from Google Books`,
          sourceGenre: genre,
        }],
      }))
  } catch {
    return []
  }
}
