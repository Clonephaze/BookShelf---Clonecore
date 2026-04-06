export interface RecommendationReason {
  type: 'author' | 'genre' | 'collaborative' | 'because_you_read' | 'external'
  label: string
  sourceBookTitle?: string
  sourceAuthor?: string
  sourceGenre?: string
}

export interface Recommendation {
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  coverUrlSmall: string | null
  genres: string[] | null
  pageCount: number | null
  publishedDate: string | null
  description: string | null
  isbn13?: string
  isbn10?: string
  openLibraryKey?: string
  googleBooksId?: string
  score: number
  reasons: RecommendationReason[]
}

export function useRecommendations() {
  const recommendations = useState<Recommendation[]>('recommendations-all', () => [])
  const dismissed = useState<Set<string>>('recommendations-dismissed', () => new Set())
  const loading = useState<boolean>('recommendations-loading', () => false)
  const fetched = useState<boolean>('recommendations-fetched', () => false)

  const visible = computed(() =>
    recommendations.value.filter(r => !dismissed.value.has(r.bookId)),
  )

  async function fetchRecommendations(force = false) {
    if (fetched.value && !force) return
    loading.value = true
    try {
      const { isGuest } = useGuest()
      const url = isGuest.value ? '/api/guest/recommendations' : '/api/recommendations'
      const data = await $fetch<Recommendation[]>(url)
      recommendations.value = data
      fetched.value = true
    } catch {
      // Silent fail — recommendations are non-critical
    } finally {
      loading.value = false
    }
  }

  async function dismiss(bookId: string) {
    dismissed.value = new Set([...dismissed.value, bookId])

    const { isGuest } = useGuest()
    if (isGuest.value) return

    try {
      await $fetch('/api/recommendations/dismiss', {
        method: 'POST',
        body: { bookId },
      })
    } catch {
      // Silent fail
    }
  }

  function reset() {
    recommendations.value = []
    dismissed.value = new Set()
    fetched.value = false
    loading.value = false
  }

  return {
    recommendations: visible,
    allRecommendations: recommendations,
    loading: readonly(loading),
    fetched: readonly(fetched),
    fetchRecommendations,
    dismiss,
    reset,
  }
}
