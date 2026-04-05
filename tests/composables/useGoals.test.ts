import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ref } from 'vue'
import { useGoals } from '../../app/composables/useGoals'
import type { Goal } from '../../app/composables/useGoals'

// Provided by Nuxt test environment at runtime
declare const useState: <T>(key: string, init?: () => T) => Ref<T>

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const currentYear = new Date().getFullYear()

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    userId: 'user-1',
    periodType: 'yearly',
    year: currentYear,
    periodValue: 0,
    targetBooks: 24,
    booksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset shared useState values for test isolation
    useState<Goal[]>('goals-all').value = []
    useState<boolean>('goals-loading').value = false
    useState<string | null>('goals-error').value = null
    useState<boolean>('goals-fetched').value = false
  })

  describe('pace calculation', () => {
    it('returns "complete" when booksCompleted >= targetBooks', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal({ booksCompleted: 24, targetBooks: 24 })])
      const { fetchGoals, paceStatus } = useGoals()
      await fetchGoals()
      expect(paceStatus.value).toBe('complete')
    })

    it('returns "complete" when booksCompleted exceeds targetBooks', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal({ booksCompleted: 30, targetBooks: 24 })])
      const { fetchGoals, paceStatus } = useGoals()
      await fetchGoals()
      expect(paceStatus.value).toBe('complete')
    })

    it('returns "behind" with no goal set', () => {
      const { paceStatus } = useGoals()
      expect(paceStatus.value).toBe('behind')
    })

    it('computes progress as ratio of completed to target', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal({ booksCompleted: 12, targetBooks: 24 })])
      const { fetchGoals, progress } = useGoals()
      await fetchGoals()
      expect(progress.value).toBe(0.5)
    })

    it('caps progress at 1.0 when over target', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal({ booksCompleted: 30, targetBooks: 24 })])
      const { fetchGoals, progress } = useGoals()
      await fetchGoals()
      expect(progress.value).toBe(1)
    })

    it('returns 0 progress when no goal is set', () => {
      const { progress } = useGoals()
      expect(progress.value).toBe(0)
    })
  })

  describe('pace labels', () => {
    it('provides "Goal complete!" label when complete', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal({ booksCompleted: 24, targetBooks: 24 })])
      const { fetchGoals, paceLabel } = useGoals()
      await fetchGoals()
      expect(paceLabel.value).toBe('Goal complete!')
    })

    it('provides empty label when no goal set', () => {
      const { paceLabel } = useGoals()
      expect(paceLabel.value).toBe('')
    })
  })

  describe('multi-period goals', () => {
    it('separates yearly, monthly, and weekly goals', async () => {
      const month = new Date().getMonth() + 1
      mockFetch.mockResolvedValueOnce([
        makeGoal({ id: 'y1', periodType: 'yearly', periodValue: 0, targetBooks: 24 }),
        makeGoal({ id: 'm1', periodType: 'monthly', periodValue: month, targetBooks: 4 }),
        makeGoal({ id: 'w1', periodType: 'weekly', periodValue: 1, targetBooks: 1 }),
      ])
      const { fetchGoals, yearlyGoal, monthlyGoal } = useGoals()
      await fetchGoals()
      expect(yearlyGoal.value?.id).toBe('y1')
      expect(monthlyGoal.value?.id).toBe('m1')
    })

    it('goalProgress works for any goal', () => {
      const { goalProgress } = useGoals()
      const goal = makeGoal({ booksCompleted: 6, targetBooks: 12 })
      expect(goalProgress(goal)).toBe(0.5)
    })

    it('goalProgress returns 0 for null', () => {
      const { goalProgress } = useGoals()
      expect(goalProgress(null)).toBe(0)
    })
  })

  describe('setGoal', () => {
    it('calls POST /api/goals with periodType and sets goal in state', async () => {
      const goal = makeGoal({ targetBooks: 12, booksCompleted: 3 })
      // POST returns the new goal, then fetchGoals(true) refetches all goals
      mockFetch.mockResolvedValueOnce(goal)
      mockFetch.mockResolvedValueOnce([goal])
      const { setGoal, yearlyGoal } = useGoals()
      const ok = await setGoal(12, 'yearly')
      expect(ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/goals', {
        method: 'POST',
        body: { year: currentYear, targetBooks: 12, periodType: 'yearly', periodValue: 0 },
      })
      expect(yearlyGoal.value?.targetBooks).toBe(12)
      expect(yearlyGoal.value?.booksCompleted).toBe(3)
    })

    it('returns false and sets error on failure', async () => {
      mockFetch.mockRejectedValueOnce({ data: { statusMessage: 'Duplicate' } })
      const { setGoal, error } = useGoals()
      const ok = await setGoal(12)
      expect(ok).toBe(false)
      expect(error.value).toBe('Duplicate')
    })
  })

  describe('updateGoal', () => {
    it('calls PATCH /api/goals/:id and updates target', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal({ id: 'g1', targetBooks: 12 })])
      const { fetchGoals, updateGoal, yearlyGoal } = useGoals()
      await fetchGoals()

      mockFetch.mockResolvedValueOnce({ ...makeGoal({ id: 'g1' }), targetBooks: 36, updatedAt: new Date().toISOString() })
      const ok = await updateGoal('g1', 36)
      expect(ok).toBe(true)
      expect(yearlyGoal.value?.targetBooks).toBe(36)
    })
  })

  describe('fetchGoals', () => {
    it('handles empty array gracefully', async () => {
      mockFetch.mockResolvedValueOnce([])
      const { fetchGoals, yearlyGoal, loading } = useGoals()
      await fetchGoals()
      expect(yearlyGoal.value).toBeNull()
      expect(loading.value).toBe(false)
    })

    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce({ data: { statusMessage: 'Server error' } })
      const { fetchGoals, error } = useGoals()
      await fetchGoals()
      expect(error.value).toBe('Server error')
    })

    it('skips fetch if already loaded (dedup)', async () => {
      mockFetch.mockResolvedValueOnce([makeGoal()])
      const { fetchGoals } = useGoals()
      await fetchGoals()
      await fetchGoals() // second call should be skipped
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('refetches when force=true', async () => {
      mockFetch.mockResolvedValue([makeGoal()])
      const { fetchGoals } = useGoals()
      await fetchGoals()
      await fetchGoals(true) // forced refetch
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
