// ============================================
// Google Books Adapter — Bookshelf
// ============================================
// Docs: https://developers.google.com/books/docs/v1/using
// Search: https://www.googleapis.com/books/v1/volumes?q=...
// ============================================

import type { BookSearchResult } from './types'

const GB_SEARCH_URL = 'https://www.googleapis.com/books/v1/volumes'

interface GBVolumeInfo {
  title: string
  authors?: string[]
  industryIdentifiers?: { type: string, identifier: string }[]
  imageLinks?: { thumbnail?: string, smallThumbnail?: string }
  pageCount?: number
  publishedDate?: string
  categories?: string[]
  description?: string
  publisher?: string
}

interface GBVolume {
  id: string
  volumeInfo: GBVolumeInfo
}

interface GBSearchResponse {
  totalItems: number
  items?: GBVolume[]
}

/** Extract ISBNs from Google Books identifiers */
function extractISBNs(identifiers?: { type: string, identifier: string }[]): { isbn13?: string, isbn10?: string } {
  if (!identifiers?.length) return {}

  const isbn13 = identifiers.find(id => id.type === 'ISBN_13')?.identifier
  const isbn10 = identifiers.find(id => id.type === 'ISBN_10')?.identifier

  return { isbn13, isbn10 }
}

/** Upgrade Google Books thumbnail to higher-res version */
function upgradeCoverUrl(url?: string): string | undefined {
  if (!url) return undefined
  // Google Books returns small thumbnails by default.
  // Replace zoom=1 with zoom=0 for larger images, and force https.
  return url
    .replace('http://', 'https://')
    .replace('&edge=curl', '')
}

/** Normalize a Google Books volume into a BookSearchResult */
function normalizeVolume(volume: GBVolume): BookSearchResult {
  const info = volume.volumeInfo
  const { isbn13, isbn10 } = extractISBNs(info.industryIdentifiers)
  const [author, ...additionalAuthors] = info.authors || ['Unknown Author']

  return {
    title: info.title,
    author,
    ...(additionalAuthors.length && { additionalAuthors }),
    isbn13,
    isbn10,
    coverUrl: upgradeCoverUrl(info.imageLinks?.thumbnail),
    coverUrlSmall: upgradeCoverUrl(info.imageLinks?.smallThumbnail),
    pageCount: info.pageCount,
    publishedDate: info.publishedDate,
    genres: info.categories?.slice(0, 5),
    description: info.description,
    publisher: info.publisher,
    googleBooksId: volume.id,
  }
}

/** Detect if a query looks like an ISBN */
function isISBN(query: string): boolean {
  const clean = query.replace(/[- ]/g, '')
  return /^\d{10}$/.test(clean) || /^\d{13}$/.test(clean)
}

/** Search Google Books and return normalized results */
export async function searchGoogleBooks(
  query: string,
  limit: number = 20,
  apiKey?: string,
): Promise<BookSearchResult[]> {
  // Use isbn: prefix when the query looks like an ISBN
  const searchQuery = isISBN(query) ? `isbn:${query.replace(/[- ]/g, '')}` : query

  const params = new URLSearchParams({
    q: searchQuery,
    maxResults: Math.min(limit, 40).toString(),
    printType: 'books',
    orderBy: 'relevance',
  })

  if (apiKey) {
    params.set('key', apiKey)
  }

  const response = await $fetch<GBSearchResponse>(`${GB_SEARCH_URL}?${params}`, {
    timeout: 5000,
  })

  if (!response.items?.length) return []

  return response.items.map(normalizeVolume)
}
