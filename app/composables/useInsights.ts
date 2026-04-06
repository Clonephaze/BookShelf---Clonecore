import type { InsightData } from '~/components/InsightCard.vue'

export function useInsights() {
  const insights = useState<InsightData[]>('insights-all', () => [])
  const dismissed = useState<Set<string>>('insights-dismissed', () => new Set())
  const loading = useState<boolean>('insights-loading', () => false)
  const fetched = useState<boolean>('insights-fetched', () => false)

  const visible = computed(() =>
    insights.value.filter(i => !dismissed.value.has(i.id)),
  )

  function dismiss(id: string) {
    dismissed.value = new Set([...dismissed.value, id])
    // Persist to localStorage so dismissals survive navigation
    if (import.meta.client) {
      try {
        localStorage.setItem('bookshelf-dismissed-insights', JSON.stringify([...dismissed.value]))
      }
      catch { /* quota or SSR */ }
    }
  }

  function restoreDismissed() {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem('bookshelf-dismissed-insights')
        if (raw) {
          dismissed.value = new Set(JSON.parse(raw))
        }
      }
      catch { /* ignore */ }
    }
  }

  async function fetchInsights(force = false) {
    if (fetched.value && !force) return
    loading.value = true
    try {
      const { isGuest } = useGuest()
      const url = isGuest.value ? '/api/guest/insights' : '/api/insights'
      const data = await $fetch<InsightData[]>(url)
      insights.value = data
      fetched.value = true
    }
    catch {
      // Silent fail — insights are non-critical
    }
    finally {
      loading.value = false
    }
  }

  /** Get insights filtered to a specific book */
  function forBook(userBookId: string) {
    return computed(() =>
      visible.value.filter(i => i.id.includes(userBookId)),
    )
  }

  // Restore on first use
  restoreDismissed()

  return {
    insights: visible,
    loading: readonly(loading),
    fetchInsights,
    dismiss,
    forBook,
  }
}
