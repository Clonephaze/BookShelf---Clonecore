// ============================================
// Unified Book Service — Bookshelf
// ============================================
// Parallel search across Open Library + Google Books,
// merge/deduplicate by ISBN, rank by completeness.
// ============================================

import type { BookSearchResult, BookSearchResponse } from './types'
import { searchOpenLibrary } from './open-library'
import { searchGoogleBooks } from './google-books'

/**
 * Merge two results for the same book, preferring the richer value for each field.
 * Primary (Open Library) wins for ties except description (Google is usually better).
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
  }
}

/**
 * Build a dedup key from a result — prefer ISBN-13, fall back to ISBN-10,
 * then normalized title+author.
 */
function dedupKey(result: BookSearchResult): string {
  if (result.isbn13) return `isbn13:${result.isbn13}`
  if (result.isbn10) return `isbn10:${result.isbn10}`
  return `title:${result.title.toLowerCase().trim()}|${result.author.toLowerCase().trim()}`
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
  return score
}

/**
 * Search both APIs in parallel, merge, deduplicate, and rank.
 */
export async function searchBooks(
  query: string,
  limit: number = 20,
  googleApiKey?: string,
): Promise<BookSearchResponse> {
  // Fire both APIs in parallel — if one fails, use results from the other
  const [olResults, gbResults] = await Promise.all([
    searchOpenLibrary(query, limit).catch((err) => {
      console.warn('[BookService] Open Library search failed:', err.message)
      return [] as BookSearchResult[]
    }),
    searchGoogleBooks(query, limit, googleApiKey).catch((err) => {
      console.warn('[BookService] Google Books search failed:', err.message)
      return [] as BookSearchResult[]
    }),
  ])

  // Merge and deduplicate
  const merged = new Map<string, BookSearchResult>()

  // OL results first (primary source)
  for (const result of olResults) {
    const key = dedupKey(result)
    merged.set(key, result)
  }

  // Google Books results — merge with OL if duplicate, add if new
  for (const result of gbResults) {
    const key = dedupKey(result)
    const existing = merged.get(key)
    if (existing) {
      merged.set(key, mergeResults(existing, result))
    } else {
      merged.set(key, result)
    }
  }

  // Rank by completeness
  const results = [...merged.values()]
    .sort((a, b) => completenessScore(b) - completenessScore(a))
    .slice(0, limit)

  return {
    results,
    total: results.length,
    query,
  }
}
