import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ref } from 'vue'
import { useInsights } from '../../app/composables/useInsights'
import type { InsightData } from '../../app/components/InsightCard.vue'

// Provided by Nuxt test environment at runtime
declare const useState: <T>(key: string, init?: () => T) => Ref<T>

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

function makeInsight(overrides: Partial<InsightData> = {}): InsightData {
  return {
    id: 'test-1',
    type: 'projection',
    icon: '📖',
    title: 'Test insight',
    body: 'Test body with **bold**',
    ...overrides,
  }
}

describe('useInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useState<InsightData[]>('insights-all').value = []
    useState<Set<string>>('insights-dismissed').value = new Set()
    useState<boolean>('insights-loading').value = false
    useState<boolean>('insights-fetched').value = false
    // Clear localStorage
    try { localStorage.removeItem('bookshelf-dismissed-insights') } catch { /* */ }
  })

  describe('fetchInsights', () => {
    it('fetches insights from API', async () => {
      const data = [makeInsight(), makeInsight({ id: 'test-2', type: 'goal' })]
      mockFetch.mockResolvedValueOnce(data)
      const { insights, fetchInsights } = useInsights()
      await fetchInsights()
      expect(mockFetch).toHaveBeenCalledWith('/api/insights')
      expect(insights.value).toHaveLength(2)
    })

    it('does not re-fetch on second call without force', async () => {
      mockFetch.mockResolvedValueOnce([makeInsight()])
      const { fetchInsights } = useInsights()
      await fetchInsights()
      await fetchInsights()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('re-fetches with force=true', async () => {
      mockFetch.mockResolvedValue([makeInsight()])
      const { fetchInsights } = useInsights()
      await fetchInsights()
      await fetchInsights(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('handles fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const { insights, fetchInsights } = useInsights()
      await fetchInsights()
      expect(insights.value).toHaveLength(0)
    })
  })

  describe('dismiss', () => {
    it('removes dismissed insight from visible list', async () => {
      mockFetch.mockResolvedValueOnce([
        makeInsight({ id: 'a' }),
        makeInsight({ id: 'b' }),
        makeInsight({ id: 'c' }),
      ])
      const { insights, dismiss, fetchInsights } = useInsights()
      await fetchInsights()
      expect(insights.value).toHaveLength(3)
      dismiss('b')
      expect(insights.value).toHaveLength(2)
      expect(insights.value.map((i: { id: string }) => i.id)).toEqual(['a', 'c'])
    })

    it('persists dismissed IDs to localStorage', async () => {
      mockFetch.mockResolvedValueOnce([makeInsight({ id: 'x' })])
      const { dismiss, fetchInsights } = useInsights()
      await fetchInsights()
      dismiss('x')
      const stored = JSON.parse(localStorage.getItem('bookshelf-dismissed-insights') ?? '[]')
      expect(stored).toContain('x')
    })
  })

  describe('forBook', () => {
    it('filters insights by userBookId', async () => {
      mockFetch.mockResolvedValueOnce([
        makeInsight({ id: 'proj-book-123', bookTitle: 'Test Book' }),
        makeInsight({ id: 'goal-ahead' }),
        makeInsight({ id: 'stale-book-123', bookTitle: 'Test Book' }),
      ])
      const { forBook, fetchInsights } = useInsights()
      await fetchInsights()
      const bookInsights = forBook('book-123')
      expect(bookInsights.value).toHaveLength(2)
      expect(bookInsights.value.map((i: { id: string }) => i.id)).toEqual(['proj-book-123', 'stale-book-123'])
    })

    it('returns empty for unmatched book', async () => {
      mockFetch.mockResolvedValueOnce([makeInsight({ id: 'goal-ahead' })])
      const { forBook, fetchInsights } = useInsights()
      await fetchInsights()
      const bookInsights = forBook('nonexistent')
      expect(bookInsights.value).toHaveLength(0)
    })
  })
})
