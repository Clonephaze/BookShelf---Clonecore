<script setup lang="ts">
const props = defineProps<{
  userBookId: string
  sourceEl?: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

interface BookDetail {
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
  openLibraryKey?: string | null
  googleBooksId?: string | null
  shelves?: Array<{ shelfId: string; shelfName: string }>
}

const loading = ref(true)
const error = ref(false)
const book = ref<BookDetail | null>(null)
const panelEl = ref<HTMLElement>()
const coverEl = ref<HTMLElement>()
const showContent = ref(false)

// Shelf actions
const shelvesStore = useShelvesStore()
const showShelfPicker = ref(false)
const movingShelf = ref(false)
const confirmingRemove = ref(false)
const removing = ref(false)

// --- Phase 4: rating / notes / dates ---
const hoverRating = ref(0)
const savingField = ref<string | null>(null)
const notesDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const toast = useToast()

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

// --- Phase 5: reading progress ---
const showCompletionPrompt = ref(false)
const pageInputDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
const minutesInputDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
const showTimePrompt = ref(false)

// Tracking mode: pages (default) or minutes
const trackingMode = computed(() => {
  if (!book.value) return 'pages'
  if (book.value.totalMinutes || book.value.currentMinutes) return 'minutes'
  return 'pages'
})

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

function parseTimeInput(raw: string): number | null {
  // Accept "42h 35m", "42h35m", "42:35", "2555", "42h", "35m"
  raw = raw.trim().toLowerCase()
  if (!raw) return null

  // hours:minutes format
  const colonMatch = raw.match(/^(\d+):(\d+)$/)
  if (colonMatch) return parseInt(colonMatch[1]!) * 60 + parseInt(colonMatch[2]!)

  // Xh Ym format
  const hmMatch = raw.match(/^(\d+)\s*h\s*(?:(\d+)\s*m?)?$/)
  if (hmMatch) return parseInt(hmMatch[1]!) * 60 + (parseInt(hmMatch[2] || '0'))

  // Ym format
  const mMatch = raw.match(/^(\d+)\s*m$/)
  if (mMatch) return parseInt(mMatch[1]!)

  // Plain number = total minutes
  const num = parseInt(raw)
  if (!isNaN(num) && num >= 0) return num

  return null
}

// Convert a Date|string|null from the API into a value usable by <input type="date">
function toDateInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

async function updateField(field: string, value: unknown) {
  if (!book.value) return
  const oldValue = (book.value as Record<string, unknown>)[field]
  ;(book.value as Record<string, unknown>)[field] = value
  savingField.value = field
  try {
    await $fetch(`/api/books/${props.userBookId}`, {
      method: 'PATCH',
      body: { [field]: value },
    })
    toast.success(`${fieldLabels[field] || 'Field'} saved`)
    useLibraryStore().revalidate()
  }
  catch {
    ;(book.value as Record<string, unknown>)[field] = oldValue
    toast.error('Save failed — try again')
  }
  finally {
    savingField.value = null
  }
}

function setRating(star: number) {
  if (!book.value) return
  // Clicking the current rating clears it
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

  // Update local state optimistically
  book.value.currentPage = page

  // Auto-calculate progressPercent if we know pageCount
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
    await $fetch(`/api/books/${props.userBookId}`, { method: 'PATCH', body })
    toast.success('Progress saved')
    useLibraryStore().revalidate()
    const newPct = computePercent()
    checkMilestones(oldPct, newPct)
  }
  catch {
    book.value.currentPage = oldPage
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
  book.value.progressPercent = pct !== null ? String(pct) : null
  savingField.value = 'progressPercent'
  try {
    await $fetch(`/api/books/${props.userBookId}`, {
      method: 'PATCH',
      body: { progressPercent: pct !== null ? String(pct) : null },
    })
    toast.success('Progress saved')
    useLibraryStore().revalidate()
    checkMilestones(oldPct, pct ?? 0)
    if (pct === 100) showCompletionPrompt.value = true
  }
  catch {
    book.value.progressPercent = String(oldPct) || null
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

  book.value.currentMinutes = minutes

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
    await $fetch(`/api/books/${props.userBookId}`, { method: 'PATCH', body })
    toast.success('Progress saved')
    useLibraryStore().revalidate()
    const newPct = computePercent()
    checkMilestones(oldPct, newPct)
  }
  catch {
    book.value.currentMinutes = oldMinutes
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

async function completeAndMoveToRead() {
  if (!book.value) return
  showCompletionPrompt.value = false
  // Find the "Read" shelf
  const readShelf = shelvesStore.shelves.find(s => s.slug === 'read')
  if (!readShelf) return
  try {
    // Set dateFinished if not already set
    if (!book.value.dateFinished) {
      await $fetch(`/api/books/${props.userBookId}`, {
        method: 'PATCH',
        body: { dateFinished: new Date().toISOString().slice(0, 10) },
      })
      book.value.dateFinished = new Date().toISOString()
    }
    await $fetch(`/api/books/${props.userBookId}/shelf`, {
      method: 'PATCH',
      body: { shelfId: readShelf.id },
    })
    await fetchBook()
    useLibraryStore().invalidate()
    toast.success('Moved to Read shelf! 📖')
  }
  catch {
    toast.error('Could not move book')
  }
}

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

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchBook() {
  loading.value = true
  error.value = false
  try {
    book.value = await $fetch<BookDetail>(`/api/books/${props.userBookId}`)
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
    nextTick(() => {
      showContent.value = true
    })
  }
}

async function moveToShelf(shelfId: string) {
  movingShelf.value = true
  showShelfPicker.value = false
  try {
    await $fetch(`/api/books/${props.userBookId}/shelf`, {
      method: 'PATCH',
      body: { shelfId },
    })
    await fetchBook()
    useLibraryStore().invalidate()
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
    await $fetch(`/api/books/${props.userBookId}`, { method: 'DELETE' })
    useLibraryStore().invalidate()
    toast.success('Book removed')
    emit('close')
  }
  catch {
    removing.value = false
    confirmingRemove.value = false
  }
}

// --- FLIP zoom animation ---
const showCoverPicker = ref(false)

function onCoverUpdated(newUrl: string) {
  if (book.value) book.value.coverUrl = newUrl
  showCoverPicker.value = false
}

function animateCoverIn() {
  if (!props.sourceEl || !coverEl.value) return

  const sourceRect = props.sourceEl.getBoundingClientRect()
  const targetRect = coverEl.value.getBoundingClientRect()

  const deltaX = sourceRect.left - targetRect.left
  const deltaY = sourceRect.top - targetRect.top
  const scaleX = sourceRect.width / targetRect.width
  const scaleY = sourceRect.height / targetRect.height

  coverEl.value.animate(
    [
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
        borderRadius: '2px',
      },
      {
        transform: 'translate(0, 0) scale(1, 1)',
        borderRadius: '6px',
      },
    ],
    {
      duration: 400,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
    },
  )
}

// Keyboard & click handlers
function onBackdropClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('detail-panel__backdrop')) {
    emit('close')
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  fetchBook()
  shelvesStore.fetch()

  // Trigger FLIP after cover is rendered
  nextTick(() => {
    setTimeout(() => animateCoverIn(), 50)
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="detail-panel__backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="book ? `Details for ${book.title}` : 'Book details'"
      @click="onBackdropClick"
    >
      <div ref="panelEl" class="detail-panel">
        <button
          class="detail-panel__close"
          aria-label="Close"
          @click="$emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <!-- Loading skeleton -->
        <div v-if="loading" class="detail-panel__skeleton">
          <div class="detail-panel__skeleton-cover" />
          <div class="detail-panel__skeleton-info">
            <div class="detail-panel__skeleton-title" />
            <div class="detail-panel__skeleton-author" />
            <div class="detail-panel__skeleton-meta" />
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="detail-panel__error">
          <p>Couldn't load this book.</p>
          <button class="detail-panel__error-btn" @click="fetchBook">
            Try again
          </button>
        </div>

        <!-- Content -->
        <template v-else-if="book">
          <div class="detail-panel__layout" :class="{ 'detail-panel__layout--visible': showContent }">
            <!-- Cover with FLIP animation target -->
            <div class="detail-panel__cover-area">
              <div ref="coverEl" class="detail-panel__cover">
                <BookCover
                  :src="book.coverUrl ?? undefined"
                  :title="book.title"
                  :author="book.author"
                  width="100%"
                />
                <button
                  class="detail-panel__cover-change"
                  aria-label="Change cover"
                  @click="showCoverPicker = !showCoverPicker"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </button>
              </div>
              <CoverPicker
                v-if="showCoverPicker"
                :user-book-id="userBookId"
                @updated="onCoverUpdated"
                @close="showCoverPicker = false"
              />
            </div>

            <!-- Details -->
            <div class="detail-panel__details">
              <h2 class="detail-panel__title">{{ book.title }}</h2>
              <p class="detail-panel__author">
                {{ book.author }}
                <template v-if="book.additionalAuthors?.length">
                  <span
                    v-for="a in book.additionalAuthors"
                    :key="a"
                    class="detail-panel__coauthor"
                  >, {{ a }}</span>
                </template>
              </p>

              <!-- Shelf badges -->
              <div v-if="book.shelves?.length" class="detail-panel__shelves">
                <span
                  v-for="s in book.shelves"
                  :key="s.shelfId"
                  class="detail-panel__shelf-badge"
                >{{ s.shelfName }}</span>
              </div>

              <!-- Meta -->
              <div class="detail-panel__meta">
                <div v-if="book.publishedDate" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Published</span>
                  <span>{{ book.publishedDate }}</span>
                </div>
                <div v-if="trackingMode === 'minutes' && book.totalMinutes" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Length</span>
                  <span>{{ formatMinutes(book.totalMinutes) }}</span>
                </div>
                <div v-else-if="book.pageCount" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Pages</span>
                  <span>{{ book.pageCount }}</span>
                </div>
                <div v-if="book.publisher" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Publisher</span>
                  <span>{{ book.publisher }}</span>
                </div>
                <div v-if="book.isbn13" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">ISBN</span>
                  <span class="detail-panel__isbn">{{ book.isbn13 }}</span>
                </div>
              </div>

              <!-- Genres -->
              <div v-if="book.genres?.length" class="detail-panel__genres">
                <span
                  v-for="genre in book.genres"
                  :key="genre"
                  class="detail-panel__genre-tag"
                >{{ genre }}</span>
              </div>

              <!-- Description -->
              <p v-if="book.description" class="detail-panel__description">
                {{ book.description }}
              </p>

              <!-- Reading progress -->
              <div class="detail-panel__progress">
                <span class="detail-panel__section-label">Reading progress</span>
                <div class="detail-panel__progress-bar">
                  <div
                    class="detail-panel__progress-fill"
                    :style="{ width: progressWidth }"
                  />
                </div>
                <div class="detail-panel__progress-controls">
                  <template v-if="trackingMode === 'minutes'">
                    <button class="detail-panel__page-btn" aria-label="Subtract 30 minutes" @click="incrementMinutes(-30)">−30m</button>
                    <button class="detail-panel__page-btn" aria-label="Subtract 5 minutes" @click="incrementMinutes(-5)">−5m</button>
                    <span class="detail-panel__time-display">{{ book.currentMinutes ? formatMinutes(book.currentMinutes) : '0m' }}</span>
                    <span v-if="book.totalMinutes" class="detail-panel__page-total">/ {{ formatMinutes(book.totalMinutes) }}</span>
                    <button class="detail-panel__page-btn" aria-label="Add 5 minutes" @click="incrementMinutes(5)">+5m</button>
                    <button class="detail-panel__page-btn" aria-label="Add 30 minutes" @click="incrementMinutes(30)">+30m</button>
                  </template>
                  <template v-else-if="book.pageCount">
                    <button class="detail-panel__page-btn" aria-label="Subtract 10 pages" @click="incrementPage(-10)">−10</button>
                    <button class="detail-panel__page-btn" aria-label="Subtract 1 page" @click="incrementPage(-1)">−1</button>
                    <div class="detail-panel__page-input-wrap">
                      <input
                        type="number"
                        class="detail-panel__page-input"
                        :value="book.currentPage ?? ''"
                        :max="book.pageCount"
                        min="0"
                        aria-label="Current page"
                        @change="onPageInput"
                      >
                      <span class="detail-panel__page-total">/ {{ book.pageCount }}</span>
                    </div>
                    <button class="detail-panel__page-btn" aria-label="Add 1 page" @click="incrementPage(1)">+1</button>
                    <button class="detail-panel__page-btn" aria-label="Add 10 pages" @click="incrementPage(10)">+10</button>
                  </template>
                  <template v-else>
                    <div class="detail-panel__pct-input-wrap">
                      <input
                        type="number"
                        class="detail-panel__pct-input"
                        :value="book.progressPercent ? Math.round(parseFloat(book.progressPercent)) : ''"
                        min="0"
                        max="100"
                        aria-label="Percent complete"
                        @change="updatePercentDirect"
                      >
                      <span class="detail-panel__pct-symbol">%</span>
                    </div>
                  </template>
                </div>
                <!-- Total length input for minutes mode -->
                <div v-if="trackingMode === 'minutes'" class="detail-panel__time-total-row">
                  <label class="detail-panel__time-total-label" :for="`total-time-${userBookId}`">Total length</label>
                  <input
                    :id="`total-time-${userBookId}`"
                    type="text"
                    class="detail-panel__time-total-input"
                    :value="book.totalMinutes ? formatMinutes(book.totalMinutes) : ''"
                    placeholder="e.g. 12h 30m"
                    aria-label="Total audiobook length"
                    @change="onTotalMinutesInput"
                  >
                </div>
                <!-- Switch tracking mode -->
                <div v-if="showTimePrompt && trackingMode !== 'minutes'" class="detail-panel__time-prompt">
                  <label class="detail-panel__time-total-label" :for="`switch-time-${userBookId}`">Total length</label>
                  <input
                    :id="`switch-time-${userBookId}`"
                    type="text"
                    class="detail-panel__time-total-input"
                    placeholder="e.g. 12h 30m"
                    aria-label="Total audiobook length"
                    @keydown.enter="($event: KeyboardEvent) => { const m = parseTimeInput(($event.target as HTMLInputElement).value); if (m != null && m > 0) { updateField('totalMinutes', m); showTimePrompt = false; } }"
                    @change="(e: Event) => { const m = parseTimeInput((e.target as HTMLInputElement).value); if (m != null && m > 0) { updateField('totalMinutes', m); showTimePrompt = false; } }"
                  >
                  <button class="detail-panel__mode-switch" @click="showTimePrompt = false">Cancel</button>
                </div>
                <button
                  v-else-if="trackingMode === 'pages' || (!book.totalMinutes && !book.currentMinutes)"
                  class="detail-panel__mode-switch"
                  @click="showTimePrompt = true"
                >
                  Track by time instead
                </button>
                <button
                  v-else-if="trackingMode === 'minutes'"
                  class="detail-panel__mode-switch"
                  @click="updateField('totalMinutes', null); updateField('currentMinutes', null)"
                >
                  Track by pages instead
                </button>
                <span v-if="savingField === 'currentPage' || savingField === 'progressPercent' || savingField === 'currentMinutes'" class="detail-panel__saving">Saving…</span>
                <!-- Completion prompt -->
                <div v-if="showCompletionPrompt" class="detail-panel__completion-prompt">
                  <span>Move to <strong>Read</strong> shelf?</span>
                  <button class="detail-panel__completion-yes" @click="completeAndMoveToRead">Yes, I'm done!</button>
                  <button class="detail-panel__completion-no" @click="showCompletionPrompt = false">Not yet</button>
                </div>
              </div>

              <!-- Rating (interactive) -->
              <div class="detail-panel__rating-row">
                <span class="detail-panel__section-label">Your rating</span>
                <div
                  class="detail-panel__rating"
                  role="group"
                  aria-label="Rate this book"
                  @mouseleave="hoverRating = 0"
                >
                  <button
                    v-for="star in 5"
                    :key="star"
                    class="detail-panel__star"
                    :class="{
                      'detail-panel__star--filled': star <= (hoverRating || book.rating || 0),
                      'detail-panel__star--hover': hoverRating > 0 && star <= hoverRating,
                    }"
                    :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`"
                    :aria-pressed="book.rating === star"
                    @mouseenter="hoverRating = star"
                    @click="setRating(star)"
                  >★</button>
                </div>
                <span v-if="book.rating" class="detail-panel__rating-clear" @click="updateField('rating', null)">Clear</span>
              </div>

              <!-- Notes (textarea with debounced save) -->
              <div class="detail-panel__notes-row">
                <label class="detail-panel__section-label" :for="`notes-${userBookId}`">Notes</label>
                <div class="detail-panel__notes-wrap">
                  <textarea
                    :id="`notes-${userBookId}`"
                    class="detail-panel__notes"
                    :value="book.notes ?? ''"
                    placeholder="Capture your thoughts, quotes, and highlights…"
                    rows="4"
                    @input="onNotesInput"
                  />
                  <span v-if="savingField === 'notes'" class="detail-panel__saving">Saving…</span>
                </div>
              </div>

              <!-- Reading dates -->
              <div class="detail-panel__dates-row">
                <span class="detail-panel__section-label">Reading dates</span>
                <div class="detail-panel__dates-grid">
                  <div class="detail-panel__date-item">
                    <label class="detail-panel__date-label" :for="`date-added-${userBookId}`">Added</label>
                    <span class="detail-panel__date-value">{{ formatDate(book.dateAdded) }}</span>
                  </div>
                  <div class="detail-panel__date-item">
                    <label class="detail-panel__date-label" :for="`date-started-${userBookId}`">Started</label>
                    <input
                      :id="`date-started-${userBookId}`"
                      type="date"
                      class="detail-panel__date-input"
                      :value="toDateInput(book.dateStarted)"
                      @change="updateField('dateStarted', ($event.target as HTMLInputElement).value || null)"
                    >
                  </div>
                  <div class="detail-panel__date-item">
                    <label class="detail-panel__date-label" :for="`date-finished-${userBookId}`">Finished</label>
                    <input
                      :id="`date-finished-${userBookId}`"
                      type="date"
                      class="detail-panel__date-input"
                      :value="toDateInput(book.dateFinished)"
                      @change="updateField('dateFinished', ($event.target as HTMLInputElement).value || null)"
                    >
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="detail-panel__actions">
                <button
                  v-if="!showShelfPicker"
                  class="detail-panel__action-btn"
                  @click="showShelfPicker = true"
                >
                  Move to shelf
                </button>
                <div v-else class="detail-panel__shelf-picker">
                  <button
                    v-for="shelf in shelvesStore.shelves"
                    :key="shelf.id"
                    class="detail-panel__shelf-option"
                    :disabled="movingShelf"
                    @click="moveToShelf(shelf.id)"
                  >{{ shelf.name }}</button>
                  <button
                    class="detail-panel__shelf-cancel"
                    @click="showShelfPicker = false"
                  >Cancel</button>
                </div>

                <button
                  v-if="!confirmingRemove"
                  class="detail-panel__remove-btn"
                  @click="confirmingRemove = true"
                >
                  Remove from library
                </button>
                <div v-else class="detail-panel__remove-confirm">
                  <span class="detail-panel__remove-warning">Remove this book?</span>
                  <button
                    class="detail-panel__remove-yes"
                    :disabled="removing"
                    @click="removeBook"
                  >Yes, remove</button>
                  <button
                    class="detail-panel__remove-no"
                    @click="confirmingRemove = false"
                  >Cancel</button>
                </div>
              </div>

              <!-- Source links -->
              <div
                v-if="book.openLibraryKey || book.googleBooksId || book.isbn13"
                class="detail-panel__sources"
              >
                <span class="detail-panel__sources-label">Find this book:</span>
                <a
                  v-if="book.openLibraryKey"
                  :href="`https://openlibrary.org${book.openLibraryKey}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-panel__source-link"
                >Open Library</a>
                <a
                  v-if="book.googleBooksId"
                  :href="`https://books.google.com/books?id=${book.googleBooksId}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-panel__source-link"
                >Google Books</a>
                <a
                  v-if="book.isbn13 || book.isbn10"
                  :href="`https://www.goodreads.com/search?q=${book.isbn13 || book.isbn10}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-panel__source-link"
                >Goodreads</a>
              </div>

              <!-- View full page link -->
              <NuxtLink
                :to="`/library/book/${userBookId}`"
                class="detail-panel__full-page"
                @click="$emit('close')"
              >
                View full page →
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.detail-panel {
  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: $spacing-xl;
    padding-top: 5vh;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    animation: fade-in 200ms ease both;

    @include respond-to($breakpoint-md) {
      align-items: center;
      padding-top: $spacing-xl;
    }
  }
}

.detail-panel {
  position: relative;
  width: 100%;
  max-width: 52rem;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--surface-color);
  border-radius: $radius-xl;
  box-shadow: var(--shadow-lg);
  padding: $spacing-xl;
  animation: fade-in-scale 300ms $ease-out-expo both;

  @include respond-to($breakpoint-md) {
    padding: $spacing-2xl;
  }

  &__close {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    color: var(--text-color-muted);
    background: none;
    border: none;
    border-radius: $radius-full;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease;
    z-index: 1;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }
  }

  // --- Loading ---
  &__skeleton {
    display: flex;
    gap: $spacing-xl;
    animation: skeleton-pulse 1.5s ease-in-out infinite;

    @include respond-below($breakpoint-md) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__skeleton-cover {
    width: 12rem;
    aspect-ratio: 2 / 3;
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    flex-shrink: 0;
  }

  &__skeleton-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__skeleton-title {
    height: 2rem;
    width: 70%;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  &__skeleton-author {
    height: 1.25rem;
    width: 40%;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  &__skeleton-meta {
    height: 4rem;
    width: 100%;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  // --- Error ---
  &__error {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-2xl;
    @include body-text;
  }

  &__error-btn {
    @include button-secondary;
    font-size: $font-size-sm;
  }

  // --- Layout ---
  &__layout {
    display: flex;
    gap: $spacing-xl;
    opacity: 0;
    transition: opacity 0.3s ease;

    &--visible {
      opacity: 1;
    }

    @include respond-below($breakpoint-md) {
      flex-direction: column;
      align-items: center;
    }
  }

  // --- Cover ---
  &__cover-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    width: 12rem;

    @include respond-to($breakpoint-md) {
      width: 14rem;
    }
  }

  &__cover {
    position: relative;
    transform-origin: top left;

    :deep(.book-cover) {
      width: 100% !important;
    }

    &:hover .detail-panel__cover-change {
      opacity: 1;
    }
  }

  &__cover-change {
    position: absolute;
    bottom: $spacing-xs;
    right: $spacing-xs;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    color: #fff;
    background: rgba(0, 0, 0, 0.55);
    border: none;
    border-radius: $radius-full;
    cursor: pointer;
    opacity: 0;
    transition: opacity $transition-fast, background-color $transition-fast;
    backdrop-filter: blur(4px);

    &:hover {
      background: rgba(0, 0, 0, 0.75);
    }

    &:focus-visible {
      opacity: 1;
      outline: 2px solid var(--highlight-color);
      outline-offset: 2px;
    }
  }

  // --- Details ---
  &__details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;

    @include respond-below($breakpoint-md) {
      align-items: center;
      text-align: center;
    }
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.2;

    @include respond-to($breakpoint-md) {
      font-size: $font-size-2xl;
    }
  }

  &__author {
    font-size: $font-size-lg;
    color: var(--text-color-secondary);
  }

  &__coauthor {
    color: var(--text-color-muted);
  }

  &__shelves {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__shelf-badge {
    display: inline-flex;
    padding: 2px $spacing-sm;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--highlight-color);
    background: var(--highlight-color-subtle);
    border-radius: $radius-full;
  }

  // --- Meta ---
  &__meta {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    gap: $spacing-sm;
  }

  &__meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: $font-size-sm;
    color: var(--text-color);
  }

  &__meta-label {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__isbn {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
  }

  &__genres {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__genre-tag {
    padding: 2px $spacing-sm;
    font-size: $font-size-xs;
    color: var(--text-color-secondary);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-full;
  }

  &__description {
    @include body-text;
    line-height: 1.7;
    @include truncate(6);
  }

  // --- Progress ---
  &__progress {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__progress-bar {
    height: 6px;
    background: var(--sub-bg-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: $radius-full;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__progress-controls {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-color-secondary);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    cursor: pointer;
    transition: background-color $transition-fast, border-color $transition-fast;

    &:hover {
      background: var(--highlight-color-subtle);
      border-color: var(--highlight-color);
    }
  }

  &__page-input-wrap {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__page-input {
    width: 3.5rem;
    padding: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    text-align: center;
    appearance: textfield;
    -moz-appearance: textfield;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__page-total {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__pct-input-wrap {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__pct-input {
    width: 3.5rem;
    padding: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    text-align: center;
    appearance: textfield;
    -moz-appearance: textfield;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__pct-symbol {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__time-display {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color);
    min-width: 3.5rem;
    text-align: center;
  }

  &__time-total-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__time-total-label {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    white-space: nowrap;
  }

  &__time-total-input {
    width: 7rem;
    padding: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    text-align: center;
    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__time-prompt {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    animation: fade-in-scale 150ms $ease-out-expo both;
  }

  &__mode-switch {
    padding: 0;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    &:hover { color: var(--highlight-color); }
  }

  &__completion-prompt {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: var(--highlight-color-subtle);
    border-radius: $radius-md;
    font-size: $font-size-sm;
    color: var(--text-color);
    animation: fade-in-scale 200ms $ease-out-expo both;
  }

  &__completion-yes {
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: #fff;
    background: var(--success-color);
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    transition: opacity $transition-fast;
    &:hover { opacity: 0.85; }
  }

  &__completion-no {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;
    &:hover { color: var(--text-color); }
  }

  &__progress-text {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  // --- Section label ---
  &__section-label {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: $font-weight-medium;
    margin-bottom: $spacing-xs;
  }

  // --- Rating ---
  &__rating-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__rating {
    display: flex;
    gap: 2px;
  }

  &__star {
    padding: 0 1px;
    font-size: 1.25rem;
    color: var(--border-color);
    line-height: 1;
    background: none;
    border: none;
    cursor: pointer;
    transition: color $transition-fast, transform $transition-fast;

    &--filled {
      color: var(--rating-color, #c9a227);
    }

    &--hover {
      transform: scale(1.15);
    }

    &:focus-visible {
      outline: 2px solid var(--highlight-color);
      outline-offset: 2px;
      border-radius: 2px;
    }
  }

  &__rating-clear {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    cursor: pointer;
    text-decoration: underline;
    width: fit-content;

    &:hover { color: var(--text-color); }
  }

  // --- Notes ---
  &__notes-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__notes-wrap {
    position: relative;
  }

  &__notes {
    width: 100%;
    padding: $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    resize: vertical;
    transition: border-color $transition-fast;
    box-sizing: border-box;

    &::placeholder {
      color: var(--text-color-muted);
    }

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__saving {
    position: absolute;
    bottom: $spacing-xs;
    right: $spacing-sm;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    pointer-events: none;
  }

  // --- Dates ---
  &__dates-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__dates-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-sm;

    @include respond-below($breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }

  &__date-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__date-label {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__date-value {
    font-size: $font-size-sm;
    color: var(--text-color);
  }

  &__date-input {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    transition: border-color $transition-fast;

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }

    &::-webkit-calendar-picker-indicator {
      filter: var(--calendar-icon-filter, invert(0.5));
      cursor: pointer;
    }
  }

  // --- Actions ---
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    align-items: center;
  }

  &__action-btn {
    @include button-secondary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  &__shelf-picker {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    animation: fade-in-scale 150ms $ease-out-expo both;
  }

  &__shelf-option {
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: var(--highlight-color-subtle);
      border-color: var(--highlight-color);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__shelf-cancel {
    padding: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;

    &:hover { color: var(--text-color); }
  }

  &__remove-btn {
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--error-color);
    background: none;
    border: 1px solid transparent;
    border-radius: $radius-md;
    cursor: pointer;
    transition: background-color $transition-fast, border-color $transition-fast;

    &:hover {
      border-color: var(--error-color);
    }
  }

  &__remove-confirm {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    animation: fade-in-scale 150ms $ease-out-expo both;
  }

  &__remove-warning {
    font-size: $font-size-sm;
    color: var(--error-color);
    font-weight: $font-weight-medium;
  }

  &__remove-yes {
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: #fff;
    background: var(--error-color);
    border: none;
    border-radius: $radius-md;
    cursor: pointer;

    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__remove-no {
    padding: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;

    &:hover { color: var(--text-color); }
  }

  // --- Sources ---
  &__sources {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-sm;
    padding-top: $spacing-md;
    border-top: 1px solid var(--border-color-subtle);
  }

  &__sources-label {
    font-size: $font-size-xs;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: $font-weight-medium;
  }

  &__source-link {
    font-size: $font-size-sm;
    color: var(--highlight-color);
    text-decoration: none;
    font-weight: $font-weight-medium;

    &:hover {
      text-decoration: underline;
    }
  }

  &__full-page {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: var(--highlight-color);
    }
  }
}
</style>
