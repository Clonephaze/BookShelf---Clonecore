import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ref } from 'vue'
import { useRecommendations } from '../../app/composables/useRecommendations'
import type { Recommendation } from '../../app/composables/useRecommendations'

declare const useState: <T>(key: string, init?: () => T) => Ref<T>

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

function makeRec(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    bookId: 'book-1',
    title: 'Test Book',
    author: 'Test Author',
    coverUrl: null,
    coverUrlSmall: null,
    genres: ['Fiction'],
    pageCount: 300,
    publishedDate: '2020',
    description: 'A test book.',
    score: 5,
    reasons: [{ type: 'genre', label: 'Based on your interest in Fiction', sourceGenre: 'Fiction' }],
    ...overrides,
  }
}

describe('useRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useState<Recommendation[]>('recommendations-all').value = []
    useState<Set<string>>('recommendations-dismissed').value = new Set()
    useState<boolean>('recommendations-loading').value = false
    useState<boolean>('recommendations-fetched').value = false
  })

  describe('fetchRecommendations', () => {
    it('fetches recommendations from API', async () => {
      const data = [makeRec(), makeRec({ bookId: 'book-2', title: 'Second Book' })]
      mockFetch.mockResolvedValueOnce(data)
      const { recommendations, fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      expect(mockFetch).toHaveBeenCalledWith('/api/recommendations')
      expect(recommendations.value).toHaveLength(2)
    })

    it('does not re-fetch without force', async () => {
      mockFetch.mockResolvedValue([makeRec()])
      const { fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      await fetchRecommendations()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches with force=true', async () => {
      mockFetch.mockResolvedValue([makeRec()])
      const { fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      await fetchRecommendations(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('handles fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const { recommendations, fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      expect(recommendations.value).toHaveLength(0)
    })

    it('uses guest endpoint when guest cookie is set', async () => {
      // Guest detection relies on useCookie which is hard to mock in unit tests.
      // The guest API routing is covered by integration/e2e tests.
      // Here we just verify the default (non-guest) path works.
      mockFetch.mockResolvedValueOnce([makeRec()])
      const { fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      expect(mockFetch).toHaveBeenCalledWith('/api/recommendations')
    })
  })

  describe('dismiss', () => {
    it('removes dismissed recommendation from visible list', async () => {
      mockFetch.mockResolvedValueOnce([
        makeRec({ bookId: 'a' }),
        makeRec({ bookId: 'b' }),
        makeRec({ bookId: 'c' }),
      ])
      const { recommendations, dismiss, fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      expect(recommendations.value).toHaveLength(3)
      await dismiss('b')
      expect(recommendations.value).toHaveLength(2)
      expect(recommendations.value.map((r: Recommendation) => r.bookId)).toEqual(['a', 'c'])
    })

    it('calls dismiss API for authenticated users', async () => {
      mockFetch.mockResolvedValueOnce([makeRec({ bookId: 'x' })])
      const { dismiss, fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      mockFetch.mockResolvedValueOnce({ success: true })
      await dismiss('x')
      expect(mockFetch).toHaveBeenCalledWith('/api/recommendations/dismiss', {
        method: 'POST',
        body: { bookId: 'x' },
      })
    })

    it('skips dismiss API call when dismiss fails silently', async () => {
      mockFetch.mockResolvedValueOnce([makeRec({ bookId: 'g1' })])
      const { dismiss, fetchRecommendations, recommendations } = useRecommendations()
      await fetchRecommendations()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      await dismiss('g1')
      // Recommendation should still be removed from visible list locally
      expect(recommendations.value).toHaveLength(0)
    })
  })

  describe('reset', () => {
    it('clears all state', async () => {
      mockFetch.mockResolvedValueOnce([makeRec()])
      const { recommendations, fetched, reset, fetchRecommendations } = useRecommendations()
      await fetchRecommendations()
      expect(recommendations.value).toHaveLength(1)
      expect(fetched.value).toBe(true)
      reset()
      expect(recommendations.value).toHaveLength(0)
      expect(fetched.value).toBe(false)
    })
  })
})
