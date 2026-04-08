// ============================================
// Book API Types — Bookshelf
// ============================================
// Shared interfaces for Open Library, Google Books,
// Hardcover, and the unified BookService.
// ============================================

/** Normalized search result from any book API */
export interface BookSearchResult {
  title: string
  author: string
  additionalAuthors?: string[]
  isbn13?: string
  isbn10?: string
  coverUrl?: string
  coverUrlSmall?: string
  pageCount?: number
  publishedDate?: string
  genres?: string[]
  description?: string
  publisher?: string
  openLibraryKey?: string
  googleBooksId?: string
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
}

/** Query parameters for book search */
export interface BookSearchQuery {
  q: string
  limit?: number
}

/** Result envelope from the unified search */
export interface BookSearchResponse {
  results: BookSearchResult[]
  total: number
  query: string
}

/** Payload for adding a book to a user's library */
export interface AddBookPayload {
  book: BookSearchResult
  shelfId: string
}
