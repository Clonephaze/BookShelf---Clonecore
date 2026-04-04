// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock $fetch globally (Nitro's built-in)
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('Open Library Adapter', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('normalizes search results correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL123W',
        title: 'The Great Gatsby',
        author_name: ['F. Scott Fitzgerald'],
        isbn: ['9780743273565', '0743273567'],
        cover_i: 8234567,
        number_of_pages_median: 180,
        first_publish_year: 1925,
        subject: ['Fiction', 'Classics', 'American literature'],
        publisher: ['Scribner'],
      }],
    })

    const { searchOpenLibrary } = await import('../../server/services/book-api/open-library')
    const results = await searchOpenLibrary('great gatsby')

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn13: '9780743273565',
      isbn10: '0743273567',
      pageCount: 180,
      publishedDate: '1925',
      openLibraryKey: '/works/OL123W',
    })
    expect(results[0].coverUrl).toContain('8234567')
  })

  it('handles missing ISBNs gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL456W',
        title: 'Obscure Book',
        author_name: ['Unknown Writer'],
      }],
    })

    const { searchOpenLibrary } = await import('../../server/services/book-api/open-library')
    const results = await searchOpenLibrary('obscure book')

    expect(results).toHaveLength(1)
    expect(results[0].isbn13).toBeUndefined()
    expect(results[0].isbn10).toBeUndefined()
    expect(results[0].title).toBe('Obscure Book')
  })

  it('handles missing authors', async () => {
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL789W',
        title: 'Anonymous Work',
      }],
    })

    const { searchOpenLibrary } = await import('../../server/services/book-api/open-library')
    const results = await searchOpenLibrary('anonymous')

    expect(results[0].author).toBe('Unknown Author')
  })

  it('uses ISBN field search for ISBN-13 queries', async () => {
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL100W',
        title: 'ISBN Book',
        author_name: ['Author'],
        isbn: ['9780743273565'],
      }],
    })

    const { searchOpenLibrary } = await import('../../server/services/book-api/open-library')
    await searchOpenLibrary('9780743273565')

    // Should have called fetch with isbn= param, not q=
    const fetchUrl = mockFetch.mock.calls[0][0] as string
    expect(fetchUrl).toContain('isbn=9780743273565')
    expect(fetchUrl).not.toContain('q=')
  })

  it('uses ISBN field search for ISBN-10 queries', async () => {
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL101W',
        title: 'ISBN10 Book',
        author_name: ['Author'],
      }],
    })

    const { searchOpenLibrary } = await import('../../server/services/book-api/open-library')
    await searchOpenLibrary('0743273567')

    const fetchUrl = mockFetch.mock.calls[0][0] as string
    expect(fetchUrl).toContain('isbn=0743273567')
  })
})

describe('Google Books Adapter', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('normalizes volume results correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      totalItems: 1,
      items: [{
        id: 'googleId123',
        volumeInfo: {
          title: '1984',
          authors: ['George Orwell'],
          industryIdentifiers: [
            { type: 'ISBN_13', identifier: '9780451524935' },
            { type: 'ISBN_10', identifier: '0451524934' },
          ],
          imageLinks: {
            thumbnail: 'http://books.google.com/books?id=123&printsec=frontcover&img=1&zoom=1',
          },
          pageCount: 328,
          publishedDate: '1949-06-08',
          categories: ['Fiction'],
          description: 'A dystopian novel',
          publisher: 'Signet Classic',
        },
      }],
    })

    const { searchGoogleBooks } = await import('../../server/services/book-api/google-books')
    const results = await searchGoogleBooks('1984')

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: '1984',
      author: 'George Orwell',
      isbn13: '9780451524935',
      isbn10: '0451524934',
      pageCount: 328,
      description: 'A dystopian novel',
      googleBooksId: 'googleId123',
    })
    // Cover URL should be https
    expect(results[0].coverUrl).toMatch(/^https:/)
  })

  it('handles empty results', async () => {
    mockFetch.mockResolvedValueOnce({
      totalItems: 0,
    })

    const { searchGoogleBooks } = await import('../../server/services/book-api/google-books')
    const results = await searchGoogleBooks('nonexistent-book-xyz')

    expect(results).toHaveLength(0)
  })

  it('uses isbn: prefix for ISBN queries', async () => {
    mockFetch.mockResolvedValueOnce({
      totalItems: 1,
      items: [{
        id: 'gbIsbn1',
        volumeInfo: {
          title: 'ISBN Book',
          authors: ['Author'],
        },
      }],
    })

    const { searchGoogleBooks } = await import('../../server/services/book-api/google-books')
    await searchGoogleBooks('9780451524935')

    const fetchUrl = mockFetch.mock.calls[0][0] as string
    expect(fetchUrl).toContain('q=isbn%3A9780451524935')
  })
})

describe('BookService (unified search)', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
  })

  it('merges duplicate books by ISBN-13', async () => {
    // First call: Open Library
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL1W',
        title: 'Dune',
        author_name: ['Frank Herbert'],
        isbn: ['9780441013593'],
        number_of_pages_median: 688,
        first_publish_year: 1965,
      }],
    })

    // Second call: Google Books
    mockFetch.mockResolvedValueOnce({
      totalItems: 1,
      items: [{
        id: 'gbDune1',
        volumeInfo: {
          title: 'Dune',
          authors: ['Frank Herbert'],
          industryIdentifiers: [
            { type: 'ISBN_13', identifier: '9780441013593' },
          ],
          description: 'A science fiction masterpiece about the desert planet Arrakis.',
          pageCount: 688,
          categories: ['Science Fiction'],
        },
      }],
    })

    const { searchBooks } = await import('../../server/services/book-api/index')
    const response = await searchBooks('dune')

    // Should be merged into 1 result, not 2
    expect(response.results).toHaveLength(1)
    expect(response.results[0].title).toBe('Dune')
    expect(response.results[0].openLibraryKey).toBe('/works/OL1W')
    expect(response.results[0].googleBooksId).toBe('gbDune1')
    // Google's description should win (longer)
    expect(response.results[0].description).toContain('Arrakis')
  })

  it('handles one API failing gracefully', async () => {
    // Open Library succeeds
    mockFetch.mockResolvedValueOnce({
      numFound: 1,
      docs: [{
        key: '/works/OL2W',
        title: 'Test Book',
        author_name: ['Test Author'],
      }],
    })

    // Google Books fails
    mockFetch.mockRejectedValueOnce(new Error('API timeout'))

    const { searchBooks } = await import('../../server/services/book-api/index')
    const response = await searchBooks('test book')

    expect(response.results).toHaveLength(1)
    expect(response.results[0].title).toBe('Test Book')
  })

  it('handles both APIs failing', async () => {
    mockFetch.mockRejectedValueOnce(new Error('OL down'))
    mockFetch.mockRejectedValueOnce(new Error('GB down'))

    const { searchBooks } = await import('../../server/services/book-api/index')
    const response = await searchBooks('anything')

    expect(response.results).toHaveLength(0)
  })

  it('ranks results by completeness', async () => {
    mockFetch.mockResolvedValueOnce({
      numFound: 2,
      docs: [
        {
          key: '/works/OL3W',
          title: 'Incomplete Book',
          author_name: ['Someone'],
        },
        {
          key: '/works/OL4W',
          title: 'Complete Book',
          author_name: ['Author'],
          isbn: ['9781234567890', '1234567890'],
          cover_i: 12345,
          number_of_pages_median: 300,
          first_publish_year: 2020,
          subject: ['Fiction'],
          publisher: ['Publisher'],
        },
      ],
    })

    mockFetch.mockResolvedValueOnce({ totalItems: 0 })

    const { searchBooks } = await import('../../server/services/book-api/index')
    const response = await searchBooks('book')

    // Complete Book should rank first
    expect(response.results[0].title).toBe('Complete Book')
    expect(response.results[1].title).toBe('Incomplete Book')
  })
})
