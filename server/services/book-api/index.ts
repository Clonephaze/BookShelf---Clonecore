// ============================================
// Unified Book Service — Bookshelf
// ============================================
// Parallel search across Open Library + Google Books,
// merge/deduplicate by ISBN, rank by completeness.
// ============================================

import type { BookSearchResult, BookSearchResponse } from './types'
import { searchOpenLibrary } from './open-library'
import { searchGoogleBooks } from './google-books'
import { searchHardcover } from './hardcover'

/**
 * Merge two results for the same book, preferring the richer value for each field.
 * Primary wins for ties; description always picks the longer version.
 * Hardcover is treated as primary when available (richer metadata).
 */
function mergeResults(primary: BookSearchResult, secondary: BookSearchResult): BookSearchResult {
  return {
    title: primary.title || secondary.title,
    author: primary.author || secondary.author,
    additionalAuthors: primary.additionalAuthors?.length
      ? primary.additionalAuthors
      : secondary.additionalAuthors,
    isbn13: primary.isbn13 || secondary.isbn13,
    isbn10: primary.isbn10 || secondary.isbn10,
    coverUrl: primary.coverUrl || secondary.coverUrl,
    coverUrlSmall: primary.coverUrlSmall || secondary.coverUrlSmall,
    pageCount: primary.pageCount || secondary.pageCount,
    publishedDate: primary.publishedDate || secondary.publishedDate,
    genres: primary.genres?.length ? primary.genres : secondary.genres,
    // Google Books usually has better descriptions
    description: (secondary.description?.length ?? 0) > (primary.description?.length ?? 0)
      ? secondary.description
      : primary.description,
    publisher: primary.publisher || secondary.publisher,
    openLibraryKey: primary.openLibraryKey || secondary.openLibraryKey,
    googleBooksId: primary.googleBooksId || secondary.googleBooksId,
    hardcoverSlug: primary.hardcoverSlug || secondary.hardcoverSlug,
    hardcoverId: primary.hardcoverId || secondary.hardcoverId,
    audioSeconds: primary.audioSeconds || secondary.audioSeconds,
    hasAudiobook: primary.hasAudiobook || secondary.hasAudiobook,
    contentWarnings: primary.contentWarnings?.length ? primary.contentWarnings : secondary.contentWarnings,
    moods: primary.moods?.length ? primary.moods : secondary.moods,
    seriesName: primary.seriesName || secondary.seriesName,
    seriesPosition: primary.seriesPosition ?? secondary.seriesPosition,
    seriesSlug: primary.seriesSlug || secondary.seriesSlug,
    hardcoverRating: primary.hardcoverRating ?? secondary.hardcoverRating,
    hardcoverRatingsCount: primary.hardcoverRatingsCount ?? secondary.hardcoverRatingsCount,
  }
}

/**
 * Build a dedup key from a result — prefer ISBN-13, fall back to ISBN-10,
 * then normalized title+author.
 */
function dedupKey(result: BookSearchResult): string {
  if (result.isbn13) return `isbn13:${result.isbn13}`
  if (result.isbn10) return `isbn10:${result.isbn10}`
  return titleKey(result)
}

/** Normalize title+author into a fuzzy match key */
function titleKey(result: BookSearchResult): string {
  return `title:${result.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${result.author.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

/**
 * Find an existing entry in the merged map by ISBN, hardcoverId, or title+author.
 * Returns the map key if found, null otherwise.
 */
function findExisting(
  merged: Map<string, BookSearchResult>,
  result: BookSearchResult,
): string | null {
  // Exact key match (ISBN or title)
  const key = dedupKey(result)
  if (merged.has(key)) return key

  // Cross-match: result has ISBN but existing entry was keyed by title (or vice versa)
  // Try title-based lookup for ISBN-keyed entries
  if (result.isbn13 || result.isbn10) {
    const tk = titleKey(result)
    if (merged.has(tk)) return tk
  }

  // Try ISBN, hardcoverId, or title lookup against all existing entries
  for (const [existingKey, existing] of merged) {
    // Match by Hardcover book ID (same canonical book, different editions/ISBNs)
    if (result.hardcoverId && existing.hardcoverId && result.hardcoverId === existing.hardcoverId) {
      return existingKey
    }

    if (existingKey.startsWith('title:')) {
      // Check if ISBNs match
      if (result.isbn13 && existing.isbn13 && result.isbn13 === existing.isbn13) return existingKey
      if (result.isbn10 && existing.isbn10 && result.isbn10 === existing.isbn10) return existingKey
    }
    // Check if a title-keyed result matches an ISBN-keyed one by title
    if (existingKey.startsWith('isbn')) {
      if (titleKey(result) === titleKey(existing)) return existingKey
    }
  }

  return null
}

/**
 * Score a result by metadata completeness (used for ranking).
 */
function completenessScore(result: BookSearchResult): number {
  let score = 0
  if (result.isbn13) score += 3
  if (result.isbn10) score += 1
  if (result.coverUrl) score += 3
  if (result.pageCount) score += 1
  if (result.description) score += 2
  if (result.publishedDate) score += 1
  if (result.genres?.length) score += 1
  if (result.publisher) score += 1
  if (result.openLibraryKey) score += 1
  if (result.googleBooksId) score += 1
  if (result.hardcoverSlug) score += 1
  if (result.hasAudiobook) score += 1
  if (result.seriesName) score += 1
  if (result.moods?.length) score += 1
  return score
}

/**
 * Search both APIs in parallel, merge, deduplicate, and rank.
 */
export async function searchBooks(
  query: string,
  limit: number = 20,
  googleApiKey?: string,
  sort: 'best-match' | 'relevance' = 'best-match',
): Promise<BookSearchResponse> {
  // Fire both APIs in parallel — if one fails, use results from the other
  const [olResults, gbResults, hcResults] = await Promise.all([
    searchOpenLibrary(query, limit).catch((err) => {
      console.warn('[BookService] Open Library search failed:', err.message)
      return [] as BookSearchResult[]
    }),
    searchGoogleBooks(query, limit, googleApiKey).catch((err) => {
      console.warn('[BookService] Google Books search failed:', err.message)
      return [] as BookSearchResult[]
    }),
    searchHardcover(query, limit).catch((err) => {
      console.warn('[BookService] Hardcover search failed:', err.message)
      return [] as BookSearchResult[]
    }),
  ])

  // Merge and deduplicate
  const merged = new Map<string, BookSearchResult>()
  // Track the best (lowest) source position per entry for relevance ranking
  const bestRank = new Map<string, number>()

  function trackRank(key: string, position: number) {
    bestRank.set(key, Math.min(bestRank.get(key) ?? Infinity, position))
  }

  // OL results first
  for (let i = 0; i < olResults.length; i++) {
    const result = olResults[i]
    const key = dedupKey(result)
    merged.set(key, result)
    trackRank(key, i)
  }

  // Google Books results — merge with OL if duplicate, add if new
  for (let i = 0; i < gbResults.length; i++) {
    const result = gbResults[i]
    const existingKey = findExisting(merged, result)
    if (existingKey) {
      merged.set(existingKey, mergeResults(merged.get(existingKey)!, result))
      trackRank(existingKey, i)
    } else {
      const key = dedupKey(result)
      merged.set(key, result)
      trackRank(key, i)
    }
  }

  // Hardcover results — HC is primary (richer metadata: series, moods, ratings, covers)
  for (let i = 0; i < hcResults.length; i++) {
    const result = hcResults[i]
    const existingKey = findExisting(merged, result)
    if (existingKey) {
      merged.set(existingKey, mergeResults(result, merged.get(existingKey)!))
      // HC top results get extra relevance weight (rank halved)
      trackRank(existingKey, Math.floor(i / 2))
    } else {
      const key = dedupKey(result)
      merged.set(key, result)
      trackRank(key, Math.floor(i / 2))
    }
  }

  // Rank by completeness + source relevance, or preserve merge order
  const ranked = sort === 'best-match'
    ? [...merged.entries()]
        .sort(([keyA, a], [keyB, b]) => {
          const cA = completenessScore(a)
          const cB = completenessScore(b)
          // Relevance bonus: position 0 → +10, position 1 → +8, ..., position 5+ → 0
          const rA = Math.max(0, 10 - (bestRank.get(keyA) ?? 99) * 2)
          const rB = Math.max(0, 10 - (bestRank.get(keyB) ?? 99) * 2)
          return (cB + rB) - (cA + rA)
        })
        .map(([, r]) => r)
    : [...merged.values()]

  const results = ranked.slice(0, limit)

  return {
    results,
    total: results.length,
    query,
  }
}
