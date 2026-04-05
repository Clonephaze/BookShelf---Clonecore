export interface Goal {
  id: string
  userId: string
  periodType: 'yearly' | 'monthly' | 'weekly'
  year: number
  periodValue: number
  targetBooks: number
  booksCompleted: number
  createdAt: string
  updatedAt: string
}

export type PaceStatus = 'ahead' | 'on-track' | 'behind' | 'complete'
export type PeriodType = 'yearly' | 'monthly' | 'weekly'

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Fraction of the period that has elapsed (0–1) */
function periodElapsed(periodType: PeriodType, year: number, periodValue: number): number {
  const now = new Date()
  switch (periodType) {
    case 'yearly': {
      const start = new Date(year, 0, 1)
      const end = new Date(year + 1, 0, 1)
      return Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())))
    }
    case 'monthly': {
      const start = new Date(year, periodValue - 1, 1)
      const end = new Date(year, periodValue, 1)
      return Math.max(0, Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())))
    }
    case 'weekly': {
      // ISO week: find Monday of that week
      const jan4 = new Date(year, 0, 4)
      const dayOfWeek = jan4.getDay() || 7
      const monday = new Date(jan4)
      monday.setDate(jan4.getDate() - dayOfWeek + 1 + (periodValue - 1) * 7)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 7)
      return Math.max(0, Math.min(1, (now.getTime() - monday.getTime()) / (sunday.getTime() - monday.getTime())))
    }
  }
}

export function useGoals() {
  // Shared state — survives across components and navigations
  const goals = useState<Goal[]>('goals-all', () => [])
  const loading = useState<boolean>('goals-loading', () => false)
  const error = useState<string | null>('goals-error', () => null)
  const fetched = useState<boolean>('goals-fetched', () => false)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentWeek = getISOWeek(new Date())

  // Derived: goal for each active period
  const yearlyGoal = computed(() => goals.value.find(g => g.periodType === 'yearly' && g.year === currentYear) ?? null)
  const monthlyGoal = computed(() => goals.value.find(g => g.periodType === 'monthly' && g.year === currentYear && g.periodValue === currentMonth) ?? null)
  const weeklyGoal = computed(() => goals.value.find(g => g.periodType === 'weekly' && g.year === currentYear && g.periodValue === currentWeek) ?? null)

  // Primary goal = yearly (used by GoalWidget and celebration)
  const currentGoal = yearlyGoal

  // Progress helpers (per-goal)
  function goalProgress(goal: Goal | null): number {
    if (!goal || goal.targetBooks === 0) return 0
    return Math.min(goal.booksCompleted / goal.targetBooks, 1)
  }

  function goalPaceStatus(goal: Goal | null): PaceStatus {
    if (!goal) return 'behind'
    const { booksCompleted, targetBooks } = goal
    if (booksCompleted >= targetBooks) return 'complete'

    const elapsed = periodElapsed(goal.periodType, goal.year, goal.periodValue)
    const expected = elapsed * targetBooks

    if (booksCompleted >= expected + 1) return 'ahead'
    if (booksCompleted >= expected - 1) return 'on-track'
    return 'behind'
  }

  function goalExpectedBooks(goal: Goal | null): number {
    if (!goal) return 0
    const elapsed = periodElapsed(goal.periodType, goal.year, goal.periodValue)
    return Math.round(elapsed * goal.targetBooks)
  }

  function goalPaceLabel(goal: Goal | null): string {
    if (!goal) return ''
    switch (goalPaceStatus(goal)) {
      case 'complete': return 'Goal complete!'
      case 'ahead': return 'Ahead of schedule'
      case 'on-track': return 'On track'
      case 'behind': return 'Behind schedule'
    }
  }

  // Convenience shortcuts for primary (yearly) goal
  const progress = computed(() => goalProgress(currentGoal.value))
  const paceStatus = computed(() => goalPaceStatus(currentGoal.value))
  const expectedBooks = computed(() => goalExpectedBooks(currentGoal.value))
  const paceLabel = computed(() => goalPaceLabel(currentGoal.value))

  // Past yearly goals (not current year)
  const allGoals = computed(() => goals.value)
  const pastYearlyGoals = computed(() =>
    goals.value.filter(g => g.periodType === 'yearly' && g.year !== currentYear),
  )

  // --- Fetch ---

  async function fetchGoals(force = false) {
    if (fetched.value && !force) return
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<Goal[]>('/api/goals')
      goals.value = data
      fetched.value = true
    }
    catch (e: unknown) {
      const err = e as { data?: { statusMessage?: string } }
      error.value = err?.data?.statusMessage || 'Failed to load goals'
    }
    finally {
      loading.value = false
    }
  }

  // --- Mutations ---

  async function setGoal(targetBooks: number, periodType: PeriodType = 'yearly', periodValue?: number) {
    error.value = null
    const pv = periodType === 'yearly' ? 0
      : periodType === 'monthly' ? (periodValue ?? currentMonth)
        : (periodValue ?? currentWeek)
    try {
      await $fetch<Goal>('/api/goals', {
        method: 'POST',
        body: { year: currentYear, targetBooks, periodType, periodValue: pv },
      })
      // Refetch all goals so booksCompleted is accurate from the server
      await fetchGoals(true)
      return true
    }
    catch (e: unknown) {
      const err = e as { data?: { statusMessage?: string } }
      error.value = err?.data?.statusMessage || 'Failed to set goal'
      return false
    }
  }

  async function updateGoal(goalId: string, targetBooks: number) {
    error.value = null
    try {
      const data = await $fetch<Goal>('/api/goals/' + goalId, {
        method: 'PATCH',
        body: { targetBooks },
      })
      goals.value = goals.value.map(g =>
        g.id === goalId ? { ...g, targetBooks: data.targetBooks, updatedAt: data.updatedAt } : g,
      )
      return true
    }
    catch (e: unknown) {
      const err = e as { data?: { statusMessage?: string } }
      error.value = err?.data?.statusMessage || 'Failed to update goal'
      return false
    }
  }

  /** Refresh all goal counts after a book is finished */
  async function refreshCompleted() {
    await fetchGoals(true)
  }

  return {
    // State
    goals: allGoals,
    loading: readonly(loading),
    error: readonly(error),
    currentYear,
    currentMonth,
    currentWeek,

    // Per-period goals
    yearlyGoal,
    monthlyGoal,
    weeklyGoal,
    currentGoal,

    // Primary (yearly) shortcuts
    progress,
    paceStatus,
    expectedBooks,
    paceLabel,

    // Per-goal helpers
    goalProgress,
    goalPaceStatus,
    goalExpectedBooks,
    goalPaceLabel,
    pastYearlyGoals,

    // Actions
    fetchGoals,
    setGoal,
    updateGoal,
    refreshCompleted,
  }
}
