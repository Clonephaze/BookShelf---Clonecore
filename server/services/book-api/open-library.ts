// ============================================
// Open Library Adapter — Bookshelf
// ============================================
// Docs: https://openlibrary.org/developers/api
// Search: https://openlibrary.org/search.json
// Covers: https://covers.openlibrary.org/b/isbn/{isbn}-{size}.jpg
// ============================================

import type { BookSearchResult } from './types'

const OL_SEARCH_URL = 'https://openlibrary.org/search.json'
const OL_COVER_URL = 'https://covers.openlibrary.org/b/isbn'

interface OLSearchDoc {
  key: string
  title: string
  author_name?: string[]
  isbn?: string[]
  cover_i?: number
  number_of_pages_median?: number
  first_publish_year?: number
  subject?: string[]
  publisher?: string[]
  first_sentence?: { value: string }[]
}

interface OLSearchResponse {
  numFound: number
  docs: OLSearchDoc[]
}

/** Extract ISBN-13 and ISBN-10 from OL's isbn array */
function extractISBNs(isbns?: string[]): { isbn13?: string, isbn10?: string } {
  if (!isbns?.length) return {}

  let isbn13: string | undefined
  let isbn10: string | undefined

  for (const isbn of isbns) {
    const clean = isbn.replace(/[- ]/g, '')
    if (clean.length === 13 && clean.startsWith('978') && !isbn13) {
      isbn13 = clean
    } else if (clean.length === 10 && !isbn10) {
      isbn10 = clean
    }
    if (isbn13 && isbn10) break
  }

  return { isbn13, isbn10 }
}

/** Build cover URL from ISBN */
function buildCoverUrl(isbn13?: string, isbn10?: string, coverId?: number): { coverUrl?: string, coverUrlSmall?: string } {
  const isbn = isbn13 || isbn10
  if (isbn) {
    return {
      coverUrl: `${OL_COVER_URL}/${isbn}-L.jpg?default=false`,
      coverUrlSmall: `${OL_COVER_URL}/${isbn}-M.jpg?default=false`,
    }
  }
  if (coverId) {
    return {
      coverUrl: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
      coverUrlSmall: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
    }
  }
  return {}
}

/** Normalize a single OL doc into a BookSearchResult */
function normalizeDoc(doc: OLSearchDoc): BookSearchResult {
  const { isbn13, isbn10 } = extractISBNs(doc.isbn)
  const covers = buildCoverUrl(isbn13, isbn10, doc.cover_i)
  const [author, ...additionalAuthors] = doc.author_name || ['Unknown Author']

  return {
    title: doc.title,
    author,
    ...(additionalAuthors.length && { additionalAuthors }),
    isbn13,
    isbn10,
    ...covers,
    pageCount: doc.number_of_pages_median,
    publishedDate: doc.first_publish_year?.toString(),
    genres: doc.subject?.slice(0, 5),
    publisher: doc.publisher?.[0],
    openLibraryKey: doc.key,
  }
}

/** Detect if a query looks like an ISBN */
function isISBN(query: string): boolean {
  const clean = query.replace(/[- ]/g, '')
  return /^\d{10}$/.test(clean) || /^\d{13}$/.test(clean)
}

/** Search Open Library and return normalized results */
export async function searchOpenLibrary(
  query: string,
  limit: number = 20,
): Promise<BookSearchResult[]> {
  const fields = 'key,title,author_name,isbn,cover_i,number_of_pages_median,first_publish_year,subject,publisher,first_sentence'

  // Use ISBN-specific search when the query looks like an ISBN
  const params = isISBN(query)
    ? new URLSearchParams({
        isbn: query.replace(/[- ]/g, ''),
        limit: limit.toString(),
        fields,
      })
    : new URLSearchParams({
        q: query,
        limit: limit.toString(),
        fields,
      })

  const response = await $fetch<OLSearchResponse>(`${OL_SEARCH_URL}?${params}`, {
    timeout: 5000,
  })

  return response.docs.map(normalizeDoc)
}
