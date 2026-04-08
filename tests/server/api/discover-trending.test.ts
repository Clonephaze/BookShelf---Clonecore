// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import type { BookSearchResult } from '../../../server/services/book-api/types'
import { fetchTrending } from '../../../server/services/book-api/hardcover'
import handler from '../../../server/api/discover/trending.get'

// Mock the Hardcover service
vi.mock('../../../server/services/book-api/hardcover', () => ({
  fetchTrending: vi.fn(),
}))

// Stub Nitro auto-imports before module evaluation via vi.hoisted
const { mockGetQuery, mockSetResponseHeader } = vi.hoisted(() => {
  const mockGetQuery = vi.fn()
  const mockSetResponseHeader = vi.fn()
  ;(globalThis as Record<string, unknown>).defineEventHandler = ((h: (e: H3Event) => unknown) => h)
  ;(globalThis as Record<string, unknown>).getQuery = mockGetQuery
  ;(globalThis as Record<string, unknown>).setResponseHeader = mockSetResponseHeader
  return { mockGetQuery, mockSetResponseHeader }
})

const invokeHandler = handler as (event: H3Event) => Promise<{ results: BookSearchResult[] }>
const fakeEvent = {} as H3Event

describe('GET /api/discover/trending', () => {
  beforeEach(() => {
    vi.mocked(fetchTrending).mockReset()
    mockGetQuery.mockReset()
    mockSetResponseHeader.mockReset()
  })

  it('returns trending results', async () => {
    const mockResults = [
      { title: 'Trending Book 1', author: 'Author 1', hardcoverSlug: 'book-1' },
      { title: 'Trending Book 2', author: 'Author 2', hardcoverSlug: 'book-2' },
    ] as BookSearchResult[]
    vi.mocked(fetchTrending).mockResolvedValueOnce(mockResults)
    mockGetQuery.mockReturnValueOnce({})

    const result = await invokeHandler(fakeEvent)

    expect(result).toEqual({ results: mockResults })
    expect(fetchTrending).toHaveBeenCalledWith(20) // default limit
  })

  it('returns empty results on Hardcover API failure', async () => {
    vi.mocked(fetchTrending).mockRejectedValueOnce(new Error('API down'))
    mockGetQuery.mockReturnValueOnce({})

    const result = await invokeHandler(fakeEvent)

    expect(result).toEqual({ results: [] })
  })

  it('respects limit query param (clamps between 1-40)', async () => {
    vi.mocked(fetchTrending).mockResolvedValue([] as BookSearchResult[])

    // Negative → clamped to 1
    mockGetQuery.mockReturnValueOnce({ limit: '-5' })
    await invokeHandler(fakeEvent)
    expect(fetchTrending).toHaveBeenLastCalledWith(1)

    // Over maximum → clamped to 40
    mockGetQuery.mockReturnValueOnce({ limit: '100' })
    await invokeHandler(fakeEvent)
    expect(fetchTrending).toHaveBeenLastCalledWith(40)

    // Within range
    mockGetQuery.mockReturnValueOnce({ limit: '15' })
    await invokeHandler(fakeEvent)
    expect(fetchTrending).toHaveBeenLastCalledWith(15)

    // Non-numeric → defaults to 20
    mockGetQuery.mockReturnValueOnce({ limit: 'abc' })
    await invokeHandler(fakeEvent)
    expect(fetchTrending).toHaveBeenLastCalledWith(20)

    // Zero → treated as falsy, defaults to 20
    mockGetQuery.mockReturnValueOnce({ limit: '0' })
    await invokeHandler(fakeEvent)
    expect(fetchTrending).toHaveBeenLastCalledWith(20)
  })

  it('sets correct Cache-Control header', async () => {
    vi.mocked(fetchTrending).mockResolvedValueOnce([] as BookSearchResult[])
    mockGetQuery.mockReturnValueOnce({})

    await invokeHandler(fakeEvent)

    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      fakeEvent,
      'Cache-Control',
      's-maxage=3600, stale-while-revalidate=7200',
    )
  })
})
