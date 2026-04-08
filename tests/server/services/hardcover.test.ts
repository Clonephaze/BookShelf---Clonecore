// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkHardcoverRateLimit } from '../../../server/utils/hardcover-rate-limit'

// Mock $fetch globally (Nitro's built-in)
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock useRuntimeConfig — Nuxt auto-imports resolve from #app/nuxt
const mockConfig: Record<string, string> = { hardcoverApiToken: 'test-token-123' }
vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: () => mockConfig,
  useNuxtApp: () => ({ $config: mockConfig }),
}))

// Mock the rate limiter — allow all by default
vi.mock('../../../server/utils/hardcover-rate-limit', () => ({
  checkHardcoverRateLimit: vi.fn(() => true),
}))

describe('searchHardcover', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    mockConfig.hardcoverApiToken = 'test-token-123'
    vi.mocked(checkHardcoverRateLimit).mockReturnValue(true)
  })

  it('returns normalized BookSearchResult[] from valid response', async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        search: {
          results: JSON.stringify([
            {
              document: {
                id: 42,
                title: 'Project Hail Mary',
                slug: 'project-hail-mary',
                author_names: ['Andy Weir'],
                isbns: ['9780593135204', '0593135202'],
                description: 'A lone astronaut must save the earth.',
                pages: 496,
                audio_seconds: 58200,
                has_audiobook: true,
                rating: 4.52,
                ratings_count: 12000,
                release_year: 2021,
                genres: ['Science Fiction', 'Fiction'],
                moods: ['Adventurous', 'Hopeful'],
                content_warnings: [],
                featured_series: null,
              },
            },
          ]),
        },
      },
    })

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('project hail mary')

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      isbn13: '9780593135204',
      isbn10: '0593135202',
      pageCount: 496,
      audioSeconds: 58200,
      hasAudiobook: true,
      hardcoverSlug: 'project-hail-mary',
      hardcoverId: 42,
      hardcoverRating: 4.52,
      description: 'A lone astronaut must save the earth.',
      genres: ['Science Fiction', 'Fiction'],
      moods: ['Adventurous', 'Hopeful'],
    })
  })

  it('returns empty array when API token is missing', async () => {
    mockConfig.hardcoverApiToken = ''

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('anything')

    expect(results).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty array when API returns error', async () => {
    mockFetch.mockResolvedValueOnce({
      errors: [{ message: 'Internal error' }],
    })

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('test')

    expect(results).toEqual([])
  })

  it('returns empty array on network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('The operation was aborted due to timeout'))

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('slow query')

    expect(results).toEqual([])
  })

  it('correctly extracts ISBN-13 and ISBN-10 from isbns array', async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        search: {
          results: JSON.stringify([
            {
              document: {
                id: 1,
                title: 'ISBN Test',
                slug: 'isbn-test',
                author_names: ['Author'],
                isbns: ['1234567890', '9781234567897', '0987654321'],
              },
            },
          ]),
        },
      },
    })

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('isbn test')

    expect(results[0].isbn13).toBe('9781234567897')
    expect(results[0].isbn10).toBe('1234567890')
  })

  it('correctly maps author_names to author + additionalAuthors', async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        search: {
          results: JSON.stringify([
            {
              document: {
                id: 2,
                title: 'Coauthored Book',
                slug: 'coauthored-book',
                author_names: ['First Author', 'Second Author', 'Third Author'],
              },
            },
          ]),
        },
      },
    })

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('coauthored')

    expect(results[0].author).toBe('First Author')
    expect(results[0].additionalAuthors).toEqual(['Second Author', 'Third Author'])
  })

  it('defaults author to "Unknown Author" when author_names is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        search: {
          results: JSON.stringify([
            {
              document: {
                id: 3,
                title: 'No Author Book',
                slug: 'no-author',
                author_names: [],
              },
            },
          ]),
        },
      },
    })

    const { searchHardcover } = await import('../../../server/services/book-api/hardcover')
    const results = await searchHardcover('no author')

    expect(results[0].author).toBe('Unknown Author')
    expect(results[0].additionalAuthors).toBeUndefined()
  })
})

describe('fetchBookByISBN', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    mockConfig.hardcoverApiToken = 'test-token-123'
    vi.mocked(checkHardcoverRateLimit).mockReturnValue(true)
  })

  it('returns enrichment data for valid ISBN', async () => {
    // First call: edition lookup
    mockFetch.mockResolvedValueOnce({
      data: {
        editions: [{ id: 100, isbn_13: '9780593135204', book_id: 42 }],
      },
    })
    // Second call: book details
    mockFetch.mockResolvedValueOnce({
      data: {
        books: [{
          id: 42,
          title: 'Project Hail Mary',
          slug: 'project-hail-mary',
          description: 'A lone astronaut...',
          audio_seconds: 58200,
          rating: 4.52,
          ratings_count: 12000,
          book_series: [{
            position: 1,
            series: { name: 'Hail Mary', slug: 'hail-mary', books_count: 1 },
          }],
          taggable_counts: [
            { taggable_type: 'Mood', tag: { tag: 'Adventurous' }, count: 50 },
            { taggable_type: 'Mood', tag: { tag: 'Hopeful' }, count: 30 },
            { taggable_type: 'ContentWarning', tag: { tag: 'Death' }, count: 10 },
          ],
        }],
      },
    })

    const { fetchBookByISBN } = await import('../../../server/services/book-api/hardcover')
    const result = await fetchBookByISBN('9780593135204')

    expect(result).toMatchObject({
      hardcoverSlug: 'project-hail-mary',
      hardcoverId: 42,
      audioSeconds: 58200,
      hasAudiobook: true,
      hardcoverRating: 4.52,
      hardcoverRatingsCount: 12000,
      description: 'A lone astronaut...',
      seriesName: 'Hail Mary',
      seriesPosition: 1,
      seriesSlug: 'hail-mary',
    })
  })

  it('returns null when no editions match', async () => {
    mockFetch.mockResolvedValueOnce({
      data: { editions: [] },
    })

    const { fetchBookByISBN } = await import('../../../server/services/book-api/hardcover')
    const result = await fetchBookByISBN('9780000000000')

    expect(result).toBeNull()
  })

  it('returns null when API token is missing', async () => {
    mockConfig.hardcoverApiToken = ''

    const { fetchBookByISBN } = await import('../../../server/services/book-api/hardcover')
    const result = await fetchBookByISBN('9780593135204')

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('correctly extracts moods and content warnings from taggable_counts', async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        editions: [{ id: 200, isbn_13: '9780000000001', book_id: 99 }],
      },
    })
    mockFetch.mockResolvedValueOnce({
      data: {
        books: [{
          id: 99,
          title: 'Tagged Book',
          slug: 'tagged-book',
          taggable_counts: [
            { taggable_type: 'Mood', tag: { tag: 'Dark' }, count: 80 },
            { taggable_type: 'Mood', tag: { tag: 'Mysterious' }, count: 40 },
            { taggable_type: 'ContentWarning', tag: { tag: 'Violence' }, count: 60 },
            { taggable_type: 'ContentWarning', tag: { tag: 'Gore' }, count: 20 },
          ],
          book_series: [],
        }],
      },
    })

    const { fetchBookByISBN } = await import('../../../server/services/book-api/hardcover')
    const result = await fetchBookByISBN('9780000000001')

    expect(result?.moods).toEqual(['Dark', 'Mysterious'])
    expect(result?.contentWarnings).toEqual(['Violence', 'Gore'])
  })

  it('includes series data when available', async () => {
    mockFetch.mockResolvedValueOnce({
      data: {
        editions: [{ id: 300, isbn_13: '9780000000002', book_id: 55 }],
      },
    })
    mockFetch.mockResolvedValueOnce({
      data: {
        books: [{
          id: 55,
          title: 'Series Entry',
          slug: 'series-entry',
          book_series: [{
            position: 3,
            series: { name: 'The Grand Saga', slug: 'the-grand-saga', books_count: 7 },
          }],
          taggable_counts: [],
        }],
      },
    })

    const { fetchBookByISBN } = await import('../../../server/services/book-api/hardcover')
    const result = await fetchBookByISBN('9780000000002')

    expect(result?.seriesName).toBe('The Grand Saga')
    expect(result?.seriesPosition).toBe(3)
    expect(result?.seriesSlug).toBe('the-grand-saga')
  })

  it('returns null on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      errors: [{ message: 'Not found' }],
    })

    const { fetchBookByISBN } = await import('../../../server/services/book-api/hardcover')
    const result = await fetchBookByISBN('9780593135204')

    expect(result).toBeNull()
  })
})

describe('checkHardcoverRateLimit', () => {
  let originalCheckHardcoverRateLimit: typeof import('../../../server/utils/hardcover-rate-limit').checkHardcoverRateLimit

  beforeEach(async () => {
    vi.resetModules()
    // Import real implementation for rate limiter tests
    const mod = await vi.importActual<typeof import('../../../server/utils/hardcover-rate-limit')>(
      '../../../server/utils/hardcover-rate-limit',
    )
    originalCheckHardcoverRateLimit = mod.checkHardcoverRateLimit
  })

  it('returns true for requests within limit', () => {
    // First few requests should succeed
    expect(originalCheckHardcoverRateLimit()).toBe(true)
    expect(originalCheckHardcoverRateLimit()).toBe(true)
    expect(originalCheckHardcoverRateLimit()).toBe(true)
  })

  it('returns false when bucket is exhausted', () => {
    // Exhaust all 40 tokens
    for (let i = 0; i < 40; i++) {
      originalCheckHardcoverRateLimit()
    }
    expect(originalCheckHardcoverRateLimit()).toBe(false)
  })

  it('tokens refill over time', () => {
    // Exhaust all tokens
    for (let i = 0; i < 40; i++) {
      originalCheckHardcoverRateLimit()
    }
    expect(originalCheckHardcoverRateLimit()).toBe(false)

    // Advance time by 60+ seconds so full refill occurs
    vi.useFakeTimers()
    vi.advanceTimersByTime(61_000)

    expect(originalCheckHardcoverRateLimit()).toBe(true)

    vi.useRealTimers()
  })
})
