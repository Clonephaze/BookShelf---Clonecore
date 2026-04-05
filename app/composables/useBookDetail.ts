export interface BookDetail {
  title: string
  author: string
  additionalAuthors?: string[]
  coverUrl?: string | null
  isbn13?: string | null
  isbn10?: string | null
  pageCount?: number | null
  publishedDate?: string | null
  publisher?: string | null
  genres?: string[] | null
  description?: string | null
  rating?: number | null
  notes?: string | null
  currentPage?: number | null
  progressPercent?: string | null
  totalMinutes?: number | null
  currentMinutes?: number | null
  dateAdded?: string | Date | null
  dateStarted?: string | Date | null
  dateFinished?: string | Date | null
  updatedAt?: string | Date | null
  openLibraryKey?: string | null
  googleBooksId?: string | null
  shelves?: Array<{ shelfId: string; shelfName: string }>
}

export function useBookDetail(userBookId: Ref<string> | ComputedRef<string>) {
  const toast = useToast()
  const shelvesStore = useShelvesStore()
  const libraryStore = useLibraryStore()

  // --- Core state ---
  const loading = ref(true)
  const error = ref(false)
  const book = ref<BookDetail | null>(null)

  // --- Shelf actions ---
  const showShelfPicker = ref(false)
  const movingShelf = ref(false)
  const confirmingRemove = ref(false)
  const removing = ref(false)

  // --- Rating / Notes ---
  const hoverRating = ref(0)
  const savingField = ref<string | null>(null)
  const notesDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const fieldLabels: Record<string, string> = {
    rating: 'Rating',
    notes: 'Notes',
    dateStarted: 'Start date',
    dateFinished: 'Finish date',
    currentPage: 'Progress',
    progressPercent: 'Progress',
    totalMinutes: 'Total length',
    currentMinutes: 'Progress',
  }

  // --- Progress ---
  const showCompletionPrompt = ref(false)
  const pageInputDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
  const minutesInputDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
  const showTimePrompt = ref(false)
  const showStartReadingPrompt = ref(false)
  const showCoverPicker = ref(false)

  // --- Shelf awareness ---
  const currentShelfSlug = computed(() => {
    const shelves = book.value?.shelves
    if (!shelves?.length) return null
    return shelvesStore.shelves.find(s => s.id === shelves[0]?.shelfId)?.slug ?? null
  })
  const isOnWantToRead = computed(() => currentShelfSlug.value === 'want-to-read')
  const isOnReadShelf = computed(() => currentShelfSlug.value === 'read')
  const showProgressControls = computed(() => !isOnWantToRead.value && !isOnReadShelf.value)

  // --- Computed ---
  const trackingMode = computed(() => {
    if (!book.value) return 'pages'
    if (book.value.totalMinutes || book.value.currentMinutes) return 'minutes'
    return 'pages'
  })

  const progressWidth = computed(() => {
    if (book.value?.progressPercent) return `${parseFloat(book.value.progressPercent)}%`
    if (book.value?.currentMinutes && book.value?.totalMinutes) {
      return `${Math.round((book.value.currentMinutes / book.value.totalMinutes) * 100)}%`
    }
    if (book.value?.currentPage && book.value?.pageCount) {
      return `${Math.round((book.value.currentPage / book.value.pageCount) * 100)}%`
    }
    return '0%'
  })

  const progressLastUpdated = computed(() => formatRelativeTime(book.value?.updatedAt))

  // --- Formatting helpers ---
  function formatRelativeTime(date: string | Date | null | undefined): string | null {
    if (!date) return null
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    const now = Date.now()
    const diffMs = now - d.getTime()
    if (diffMs < 0) return 'just now'
    const seconds = Math.floor(diffMs / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return d.toLocaleDateString()
  }

  function formatMinutes(m: number): string {
    const h = Math.floor(m / 60)
    const min = m % 60
    return h > 0 ? `${h}h ${min}m` : `${min}m`
  }

  function parseTimeInput(raw: string): number | null {
    raw = raw.trim().toLowerCase()
    if (!raw) return null
    const colonMatch = raw.match(/^(\d+):(\d+)$/)
    if (colonMatch) return parseInt(colonMatch[1]!) * 60 + parseInt(colonMatch[2]!)
    const hmMatch = raw.match(/^(\d+)\s*h\s*(?:(\d+)\s*m?)?$/)
    if (hmMatch) return parseInt(hmMatch[1]!) * 60 + (parseInt(hmMatch[2] || '0'))
    const mMatch = raw.match(/^(\d+)\s*m$/)
    if (mMatch) return parseInt(mMatch[1]!)
    const num = parseInt(raw)
    if (!isNaN(num) && num >= 0) return num
    return null
  }

  function toDateInput(date: string | Date | null | undefined): string {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // --- CRUD ---
  async function fetchBook() {
    loading.value = true
    error.value = false
    try {
      book.value = await $fetch<BookDetail>(`/api/books/${userBookId.value}`)
    }
    catch {
      error.value = true
    }
    finally {
      loading.value = false
    }
  }

  async function updateField(field: string, value: unknown) {
    if (!book.value) return
    const oldValue = (book.value as Record<string, unknown>)[field]
    const oldUpdatedAt = book.value.updatedAt
    ;(book.value as Record<string, unknown>)[field] = value
    book.value.updatedAt = new Date().toISOString()
    savingField.value = field
    try {
      await $fetch(`/api/books/${userBookId.value}`, {
        method: 'PATCH',
        body: { [field]: value },
      })
      toast.success(`${fieldLabels[field] || 'Field'} saved`, 'save')
      libraryStore.revalidate()
    }
    catch {
      ;(book.value as Record<string, unknown>)[field] = oldValue
      book.value.updatedAt = oldUpdatedAt
      toast.error('Save failed — try again')
    }
    finally {
      savingField.value = null
    }
  }

  function setRating(star: number) {
    if (!book.value) return
    const newRating = book.value.rating === star ? null : star
    updateField('rating', newRating)
  }

  function onNotesInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value
    if (book.value) book.value.notes = value
    if (notesDebounceTimer.value) clearTimeout(notesDebounceTimer.value)
    notesDebounceTimer.value = setTimeout(() => {
      updateField('notes', value || null)
    }, 700)
  }

  // --- Progress helpers ---
  function computePercent(): number {
    if (!book.value) return 0
    if (book.value.progressPercent) return parseFloat(book.value.progressPercent)
    if (book.value.currentMinutes && book.value.totalMinutes) {
      return Math.round((book.value.currentMinutes / book.value.totalMinutes) * 100)
    }
    if (book.value.currentPage && book.value.pageCount) {
      return Math.round((book.value.currentPage / book.value.pageCount) * 100)
    }
    return 0
  }

  function checkMilestones(oldPct: number, newPct: number) {
    const milestones = [50, 90, 100]
    for (const m of milestones) {
      if (oldPct < m && newPct >= m) {
        if (m === 100) {
          showCompletionPrompt.value = true
          toast.success('You finished! 🎉')
        }
        else if (m === 90) {
          toast.success('Almost there — 90% done! 📖')
        }
        else if (m === 50) {
          toast.success('Halfway through! 📚')
        }
      }
    }
  }

  async function updateProgress(page: number | null) {
    if (!book.value) return
    const oldPct = computePercent()
    const oldPage = book.value.currentPage
    const oldUpdatedAt = book.value.updatedAt

    book.value.currentPage = page
    book.value.updatedAt = new Date().toISOString()

    let pct: string | null = null
    if (page != null && book.value.pageCount && book.value.pageCount > 0) {
      const raw = Math.min(100, Math.round((page / book.value.pageCount) * 100))
      pct = String(raw)
      book.value.progressPercent = pct
    }

    savingField.value = 'currentPage'
    try {
      const body: Record<string, unknown> = { currentPage: page }
      if (pct !== null) body.progressPercent = pct
      await $fetch(`/api/books/${userBookId.value}`, { method: 'PATCH', body })
      toast.success('Progress saved', 'save')
      libraryStore.revalidate()
      checkMilestones(oldPct, computePercent())
    }
    catch {
      book.value.currentPage = oldPage
      book.value.updatedAt = oldUpdatedAt
      toast.error('Save failed — try again')
    }
    finally {
      savingField.value = null
    }
  }

  function onPageInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value
    const page = raw === '' ? null : parseInt(raw, 10)
    if (page !== null && isNaN(page)) return
    if (pageInputDebounce.value) clearTimeout(pageInputDebounce.value)
    pageInputDebounce.value = setTimeout(() => updateProgress(page), 500)
  }

  function incrementPage(amount: number) {
    if (!book.value) return
    const current = book.value.currentPage ?? 0
    const next = Math.max(0, current + amount)
    const clamped = book.value.pageCount ? Math.min(next, book.value.pageCount) : next
    updateProgress(clamped)
  }

  async function updatePercentDirect(event: Event) {
    if (!book.value) return
    const raw = (event.target as HTMLInputElement).value
    const pct = raw === '' ? null : Math.min(100, Math.max(0, parseInt(raw, 10)))
    if (pct !== null && isNaN(pct)) return

    const oldPct = computePercent()
    const oldUpdatedAt = book.value.updatedAt
    book.value.progressPercent = pct !== null ? String(pct) : null
    book.value.updatedAt = new Date().toISOString()
    savingField.value = 'progressPercent'
    try {
      await $fetch(`/api/books/${userBookId.value}`, {
        method: 'PATCH',
        body: { progressPercent: pct !== null ? String(pct) : null },
      })
      toast.success('Progress saved', 'save')
      libraryStore.revalidate()
      checkMilestones(oldPct, pct ?? 0)
      if (pct === 100) showCompletionPrompt.value = true
    }
    catch {
      book.value.progressPercent = String(oldPct) || null
      book.value.updatedAt = oldUpdatedAt
      toast.error('Save failed — try again')
    }
    finally {
      savingField.value = null
    }
  }

  async function updateMinutesProgress(minutes: number | null) {
    if (!book.value) return
    const oldPct = computePercent()
    const oldMinutes = book.value.currentMinutes
    const oldUpdatedAt = book.value.updatedAt

    book.value.currentMinutes = minutes
    book.value.updatedAt = new Date().toISOString()

    let pct: string | null = null
    if (minutes != null && book.value.totalMinutes && book.value.totalMinutes > 0) {
      const raw = Math.min(100, Math.round((minutes / book.value.totalMinutes) * 100))
      pct = String(raw)
      book.value.progressPercent = pct
    }

    savingField.value = 'currentMinutes'
    try {
      const body: Record<string, unknown> = { currentMinutes: minutes }
      if (pct !== null) body.progressPercent = pct
      await $fetch(`/api/books/${userBookId.value}`, { method: 'PATCH', body })
      toast.success('Progress saved', 'save')
      libraryStore.revalidate()
      checkMilestones(oldPct, computePercent())
    }
    catch {
      book.value.currentMinutes = oldMinutes
      book.value.updatedAt = oldUpdatedAt
      toast.error('Save failed — try again')
    }
    finally {
      savingField.value = null
    }
  }

  function incrementMinutes(amount: number) {
    if (!book.value) return
    const current = book.value.currentMinutes ?? 0
    const next = Math.max(0, current + amount)
    const clamped = book.value.totalMinutes ? Math.min(next, book.value.totalMinutes) : next
    updateMinutesProgress(clamped)
  }

  function onTotalMinutesInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value
    const minutes = parseTimeInput(raw)
    if (minutesInputDebounce.value) clearTimeout(minutesInputDebounce.value)
    minutesInputDebounce.value = setTimeout(() => {
      updateField('totalMinutes', minutes)
    }, 500)
  }

  // --- Shelf moves ---
  async function startReadingAndTrack() {
    if (!book.value) return
    showStartReadingPrompt.value = false
    const readingShelf = shelvesStore.shelves.find(s => s.slug === 'currently-reading')
    if (!readingShelf) return
    try {
      if (!book.value.dateStarted) {
        await $fetch(`/api/books/${userBookId.value}`, {
          method: 'PATCH',
          body: { dateStarted: new Date().toISOString().slice(0, 10) },
        })
        book.value.dateStarted = new Date().toISOString()
      }
      await $fetch(`/api/books/${userBookId.value}/shelf`, {
        method: 'PATCH',
        body: { shelfId: readingShelf.id },
      })
      await fetchBook()
      libraryStore.invalidate()
      toast.success('Moved to Currently Reading! 📖')
    }
    catch {
      toast.error('Could not move book')
    }
  }

  async function completeAndMoveToRead() {
    if (!book.value) return
    showCompletionPrompt.value = false
    const readShelf = shelvesStore.shelves.find(s => s.slug === 'read')
    if (!readShelf) return
    try {
      if (!book.value.dateFinished) {
        await $fetch(`/api/books/${userBookId.value}`, {
          method: 'PATCH',
          body: { dateFinished: new Date().toISOString().slice(0, 10) },
        })
        book.value.dateFinished = new Date().toISOString()
      }
      await $fetch(`/api/books/${userBookId.value}/shelf`, {
        method: 'PATCH',
        body: { shelfId: readShelf.id },
      })
      await fetchBook()
      libraryStore.invalidate()
      toast.success('Moved to Read shelf! 📖')
    }
    catch {
      toast.error('Could not move book')
    }
  }

  async function moveToShelf(shelfId: string) {
    movingShelf.value = true
    showShelfPicker.value = false
    try {
      await $fetch(`/api/books/${userBookId.value}/shelf`, {
        method: 'PATCH',
        body: { shelfId },
      })
      await fetchBook()
      libraryStore.invalidate()
      toast.success('Moved to shelf')
    }
    catch {
      toast.error('Could not move book')
    }
    finally {
      movingShelf.value = false
    }
  }

  async function removeBook() {
    removing.value = true
    try {
      await $fetch(`/api/books/${userBookId.value}`, { method: 'DELETE' })
      libraryStore.invalidate()
      toast.success('Book removed')
      return true
    }
    catch {
      removing.value = false
      confirmingRemove.value = false
      return false
    }
  }

  function onCoverUpdated(newUrl: string) {
    if (book.value) book.value.coverUrl = newUrl
    showCoverPicker.value = false
  }

  return {
    // State
    loading,
    error,
    book,
    showShelfPicker,
    movingShelf,
    confirmingRemove,
    removing,
    hoverRating,
    savingField,
    showCompletionPrompt,
    showTimePrompt,
    showStartReadingPrompt,
    showCoverPicker,
    shelvesStore,

    // Computed
    currentShelfSlug,
    isOnWantToRead,
    isOnReadShelf,
    showProgressControls,
    trackingMode,
    progressWidth,
    progressLastUpdated,

    // Methods
    fetchBook,
    updateField,
    setRating,
    onNotesInput,
    updateProgress,
    onPageInput,
    incrementPage,
    updatePercentDirect,
    updateMinutesProgress,
    incrementMinutes,
    onTotalMinutesInput,
    startReadingAndTrack,
    completeAndMoveToRead,
    moveToShelf,
    removeBook,
    onCoverUpdated,

    // Formatters
    formatRelativeTime,
    formatMinutes,
    parseTimeInput,
    toDateInput,
    formatDate,
  }
}
