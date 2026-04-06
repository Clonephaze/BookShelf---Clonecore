<template>
  <div class="book-detail">
    <NuxtLink to="/library" class="book-detail__back">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to library
    </NuxtLink>

    <!-- Loading skeleton -->
    <div v-if="loading" class="book-detail__skeleton">
      <div class="book-detail__skeleton-cover" />
      <div class="book-detail__skeleton-info">
        <div class="book-detail__skeleton-title" />
        <div class="book-detail__skeleton-author" />
        <div class="book-detail__skeleton-meta" />
        <div class="book-detail__skeleton-desc" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="book-detail__error">
      <p>Couldn't load this book. It may have been removed.</p>
      <NuxtLink to="/library" class="book-detail__error-link">Return to library</NuxtLink>
    </div>

    <!-- Book content -->
    <template v-else-if="book">
      <div class="book-detail__hero">
        <div class="book-detail__cover-area">
          <div class="book-detail__cover-wrap">
            <BookCover
              :src="book.coverUrl ?? undefined"
              :title="book.title"
              :author="book.author"
              width="16rem"
            />
            <button
              class="book-detail__cover-change"
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

        <div class="book-detail__header">
          <h2 class="book-detail__title">{{ book.title }}</h2>
          <p class="book-detail__author">
            {{ book.author }}
            <template v-if="book.additionalAuthors?.length">
              <span
                v-for="a in book.additionalAuthors"
                :key="a"
                class="book-detail__coauthor"
              >, {{ a }}</span>
            </template>
          </p>

          <!-- Shelf badges -->
          <div v-if="book.shelves?.length" class="book-detail__shelves">
            <span
              v-for="s in book.shelves"
              :key="s.shelfId"
              class="book-detail__shelf-badge"
            >
              {{ s.shelfName }}
            </span>
          </div>

          <!-- Meta grid -->
          <div class="book-detail__meta">
            <div v-if="book.publishedDate" class="book-detail__meta-item">
              <span class="book-detail__meta-label">Published</span>
              <span>{{ book.publishedDate }}</span>
            </div>
            <div v-if="trackingMode === 'minutes' && book.totalMinutes" class="book-detail__meta-item">
              <span class="book-detail__meta-label">Length</span>
              <span>{{ formatMinutes(book.totalMinutes) }}</span>
            </div>
            <div v-else-if="book.pageCount" class="book-detail__meta-item">
              <span class="book-detail__meta-label">Pages</span>
              <span>{{ book.pageCount }}</span>
            </div>
            <div v-if="book.publisher" class="book-detail__meta-item">
              <span class="book-detail__meta-label">Publisher</span>
              <span>{{ book.publisher }}</span>
            </div>
            <div v-if="book.isbn13" class="book-detail__meta-item">
              <span class="book-detail__meta-label">ISBN-13</span>
              <span class="book-detail__isbn">{{ book.isbn13 }}</span>
            </div>
          </div>

          <!-- Genre tags -->
          <div v-if="book.genres?.length" class="book-detail__genres">
            <span
              v-for="genre in book.genres"
              :key="genre"
              class="book-detail__genre-tag"
            >{{ genre }}</span>
          </div>

          <!-- Move to shelf -->
          <div class="book-detail__actions">
            <button
              v-if="!showShelfPicker"
              class="book-detail__move-btn"
              @click="showShelfPicker = true"
            >
              Move to shelf
            </button>
            <div v-else class="book-detail__shelf-picker">
              <button
                v-for="shelf in allShelves"
                :key="shelf.id"
                class="book-detail__shelf-option"
                :disabled="movingShelf"
                @click="moveToShelf(shelf.id)"
              >
                {{ shelf.name }}
              </button>
              <button
                class="book-detail__shelf-cancel"
                @click="showShelfPicker = false"
              >Cancel</button>
            </div>

            <button
              v-if="!confirmingRemove"
              class="book-detail__remove-btn"
              @click="confirmingRemove = true"
            >
              Remove from library
            </button>
            <div v-else class="book-detail__remove-confirm">
              <span class="book-detail__remove-warning">Remove this book?</span>
              <button
                class="book-detail__remove-yes"
                :disabled="removing"
                @click="removeBook"
              >
                Yes, remove
              </button>
              <button
                class="book-detail__remove-no"
                @click="confirmingRemove = false"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Source links -->
          <div
            v-if="book.openLibraryKey || book.googleBooksId || book.isbn13"
            class="book-detail__sources"
          >
            <span class="book-detail__sources-label">Find this book:</span>
            <a
              v-if="book.openLibraryKey"
              :href="`https://openlibrary.org${book.openLibraryKey}`"
              target="_blank"
              rel="noopener noreferrer"
              class="book-detail__source-link"
            >
              Open Library
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </a>
            <a
              v-if="book.googleBooksId"
              :href="`https://books.google.com/books?id=${book.googleBooksId}`"
              target="_blank"
              rel="noopener noreferrer"
              class="book-detail__source-link"
            >
              Google Books
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </a>
            <a
              v-if="book.isbn13"
              :href="`https://www.worldcat.org/isbn/${book.isbn13}`"
              target="_blank"
              rel="noopener noreferrer"
              class="book-detail__source-link"
            >
              WorldCat
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </a>
            <a
              v-if="book.isbn13 || book.isbn10"
              :href="`https://www.goodreads.com/search?q=${book.isbn13 || book.isbn10}`"
              target="_blank"
              rel="noopener noreferrer"
              class="book-detail__source-link"
            >
              Goodreads
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Description -->
      <section v-if="book.description" class="book-detail__section">
        <h3 class="book-detail__section-title">About this book</h3>
        <p class="book-detail__description">{{ book.description }}</p>
      </section>

      <!-- Reading Progress (only on Currently Reading / custom shelves) -->
      <section v-if="showProgressControls" class="book-detail__section">
        <h3 class="book-detail__section-title">Reading Progress</h3>
        <div class="book-detail__progress-area">
          <div class="book-detail__progress-bar">
            <div
              class="book-detail__progress-fill"
              :style="{ width: progressWidth }"
            />
          </div>
          <div class="book-detail__progress-controls">
            <template v-if="trackingMode === 'minutes'">
              <button class="book-detail__page-btn" aria-label="Subtract 30 minutes" @click="incrementMinutes(-30)">−30m</button>
              <button class="book-detail__page-btn" aria-label="Subtract 5 minutes" @click="incrementMinutes(-5)">−5m</button>
              <span class="book-detail__time-display">{{ book.currentMinutes ? formatMinutes(book.currentMinutes) : '0m' }}</span>
              <span v-if="book.totalMinutes" class="book-detail__page-total">/ {{ formatMinutes(book.totalMinutes) }}</span>
              <button class="book-detail__page-btn" aria-label="Add 5 minutes" @click="incrementMinutes(5)">+5m</button>
              <button class="book-detail__page-btn" aria-label="Add 30 minutes" @click="incrementMinutes(30)">+30m</button>
            </template>
            <template v-else-if="book.pageCount">
              <button class="book-detail__page-btn" aria-label="Subtract 10 pages" @click="incrementPage(-10)">−10</button>
              <button class="book-detail__page-btn" aria-label="Subtract 1 page" @click="incrementPage(-1)">−1</button>
              <div class="book-detail__page-input-wrap">
                <input
                  type="number"
                  class="book-detail__page-input"
                  :value="book.currentPage ?? ''"
                  :max="book.pageCount"
                  min="0"
                  aria-label="Current page"
                  @change="onPageInput"
                >
                <span class="book-detail__page-total">/ {{ book.pageCount }}</span>
              </div>
              <button class="book-detail__page-btn" aria-label="Add 1 page" @click="incrementPage(1)">+1</button>
              <button class="book-detail__page-btn" aria-label="Add 10 pages" @click="incrementPage(10)">+10</button>
            </template>
            <template v-else>
              <div class="book-detail__pct-input-wrap">
                <input
                  type="number"
                  class="book-detail__pct-input"
                  :value="book.progressPercent ? Math.round(parseFloat(book.progressPercent)) : ''"
                  min="0"
                  max="100"
                  aria-label="Percent complete"
                  @change="updatePercentDirect"
                >
                <span class="book-detail__pct-symbol">%</span>
              </div>
            </template>
          </div>
          <!-- Total length input for minutes mode -->
          <div v-if="trackingMode === 'minutes'" class="book-detail__time-total-row">
            <label class="book-detail__time-total-label" :for="`total-time-${userBookId}`">Total length</label>
            <input
              :id="`total-time-${userBookId}`"
              type="text"
              class="book-detail__time-total-input"
              :value="book.totalMinutes ? formatMinutes(book.totalMinutes) : ''"
              placeholder="e.g. 12h 30m"
              aria-label="Total audiobook length"
              @change="onTotalMinutesInput"
            >
          </div>
          <!-- Switch tracking mode -->
          <div v-if="showTimePrompt && trackingMode !== 'minutes'" class="book-detail__time-prompt">
            <label class="book-detail__time-total-label" :for="`switch-time-${userBookId}`">Total length</label>
            <input
              :id="`switch-time-${userBookId}`"
              type="text"
              class="book-detail__time-total-input"
              placeholder="e.g. 12h 30m"
              aria-label="Total audiobook length"
              @keydown.enter="($event: KeyboardEvent) => { const m = parseTimeInput(($event.target as HTMLInputElement).value); if (m != null && m > 0) { updateField('totalMinutes', m); showTimePrompt = false; } }"
              @change="(e: Event) => { const m = parseTimeInput((e.target as HTMLInputElement).value); if (m != null && m > 0) { updateField('totalMinutes', m); showTimePrompt = false; } }"
            >
            <button class="book-detail__mode-switch" @click="showTimePrompt = false">Cancel</button>
          </div>
          <button
            v-else-if="trackingMode === 'pages' || (!book.totalMinutes && !book.currentMinutes)"
            class="book-detail__mode-switch"
            @click="showTimePrompt = true"
          >
            Track by time instead
          </button>
          <button
            v-else-if="trackingMode === 'minutes'"
            class="book-detail__mode-switch"
            @click="updateField('totalMinutes', null); updateField('currentMinutes', null)"
          >
            Track by pages instead
          </button>
          <span v-if="savingField === 'currentPage' || savingField === 'progressPercent' || savingField === 'currentMinutes'" class="book-detail__saving">Saving…</span>
          <!-- Completion prompt -->
          <div v-if="showCompletionPrompt" class="book-detail__completion-prompt">
            <span>Move to <strong>Read</strong> shelf?</span>
            <button class="book-detail__completion-yes" @click="completeAndMoveToRead">Yes, I'm done!</button>
            <button class="book-detail__completion-no" @click="showCompletionPrompt = false">Not yet</button>
          </div>
        </div>
      </section>

      <!-- Want to Read: prompt to start reading -->
      <section v-else-if="isOnWantToRead" class="book-detail__section">
        <h3 class="book-detail__section-title">Reading Progress</h3>
        <div class="book-detail__progress-area">
          <div v-if="showStartReadingPrompt" class="book-detail__completion-prompt">
            <span>Move to <strong>Currently Reading</strong> to start tracking?</span>
            <button class="book-detail__completion-yes" @click="startReadingAndTrack">Yes, start reading!</button>
            <button class="book-detail__completion-no" @click="showStartReadingPrompt = false">Not yet</button>
          </div>
          <button
            v-else
            class="book-detail__mode-switch"
            @click="showStartReadingPrompt = true"
          >
            Start reading this book
          </button>
        </div>
      </section>

      <!-- Reading Session (only for currently reading books) -->
      <section v-if="showProgressControls" class="book-detail__section">
        <div class="book-detail__session-row">
          <button
            v-if="!sessionStore.active"
            class="book-detail__session-btn"
            @click="showSessionModal = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Start Reading Session
          </button>
          <NuxtLink
            v-else
            to="/sessions"
            class="book-detail__session-btn book-detail__session-btn--active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Active session in progress →
          </NuxtLink>
        </div>
      </section>

      <!-- Per-book insights -->
      <div v-if="bookInsights.length > 0" class="book-detail__insights">
        <InsightCard
          v-for="insight in bookInsights"
          :key="insight.id"
          :insight="insight"
          @dismiss="dismissInsight"
        />
      </div>

      <SessionStartModal
        :open="showSessionModal"
        :user-book-id="userBookId"
        :book-title="book.title"
        :book-author="book.author"
        :book-cover="book.coverUrl"
        :book-page-count="book.pageCount ?? null"
        :current-page="book.currentPage ?? null"
        @close="showSessionModal = false"
        @started="onSessionStarted"
      />

      <!-- Rating (interactive) -->
      <section class="book-detail__section">
        <h3 class="book-detail__section-title">Your Rating</h3>
        <div class="book-detail__rating-row">
          <div
            class="book-detail__stars"
            role="group"
            aria-label="Rate this book"
            @mouseleave="hoverRating = 0"
          >
            <button
              v-for="star in 5"
              :key="star"
              class="book-detail__star"
              :class="{
                'book-detail__star--filled': star <= (hoverRating || book.rating || 0),
                'book-detail__star--hover': hoverRating > 0 && star <= hoverRating,
              }"
              :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`"
              :aria-pressed="book.rating === star"
              @mouseenter="hoverRating = star"
              @click="setRating(star)"
            >★</button>
          </div>
          <span v-if="book.rating" class="book-detail__rating-clear" @click="updateField('rating', null)">Clear</span>
        </div>
      </section>

      <!-- Notes (textarea with debounced save) -->
      <section class="book-detail__section">
        <h3 class="book-detail__section-title">
          <label :for="`notes-${userBookId}`">Notes</label>
        </h3>
        <div class="book-detail__notes-wrap">
          <textarea
            :id="`notes-${userBookId}`"
            class="book-detail__notes-input"
            :value="book.notes ?? ''"
            placeholder="Capture your thoughts, quotes, and highlights…"
            rows="5"
            @input="onNotesInput"
          />
          <span v-if="savingField === 'notes'" class="book-detail__saving">Saving…</span>
        </div>
      </section>

      <!-- Reading Dates -->
      <section class="book-detail__section">
        <h3 class="book-detail__section-title">Reading Dates</h3>
        <div class="book-detail__dates">
          <div class="book-detail__date-item">
            <span class="book-detail__date-label">Added</span>
            <span class="book-detail__date-value">{{ formatDate(book.dateAdded) }}</span>
          </div>
          <div class="book-detail__date-item">
            <label class="book-detail__date-label" :for="`date-started-${userBookId}`">Started</label>
            <input
              :id="`date-started-${userBookId}`"
              type="date"
              class="book-detail__date-input"
              :value="toDateInput(book.dateStarted)"
              @change="updateField('dateStarted', ($event.target as HTMLInputElement).value || null)"
            >
          </div>
          <div class="book-detail__date-item">
            <label class="book-detail__date-label" :for="`date-finished-${userBookId}`">Finished</label>
            <input
              :id="`date-finished-${userBookId}`"
              type="date"
              class="book-detail__date-input"
              :value="toDateInput(book.dateFinished)"
              @change="updateField('dateFinished', ($event.target as HTMLInputElement).value || null)"
            >
          </div>
          <div v-if="progressLastUpdated" class="book-detail__date-item">
            <span class="book-detail__date-label">Last updated</span>
            <span class="book-detail__date-value">{{ progressLastUpdated }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()

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
  updatedAt?: string | Date | null
  openLibraryKey?: string | null
  googleBooksId?: string | null
  shelves?: Array<{ shelfId: string; shelfName: string }>
}

const loading = ref(true)
const error = ref(false)
const book = ref<BookDetail | null>(null)
const { shelves: allShelves } = useShelvesStore()
const showShelfPicker = ref(false)
const movingShelf = ref(false)
const confirmingRemove = ref(false)
const removing = ref(false)
const showCoverPicker = ref(false)

function onCoverUpdated(newUrl: string) {
  if (book.value) book.value.coverUrl = newUrl
  showCoverPicker.value = false
}

// Phase 4: interactive rating / notes / dates
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

// Phase 5: reading progress
const showCompletionPrompt = ref(false)
const pageInputDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
const minutesInputDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
const showTimePrompt = ref(false)
const showStartReadingPrompt = ref(false)

// Phase 11: reading sessions
const sessionStore = useSessionStore()
const showSessionModal = ref(false)

// Phase 12: progress intelligence
const { forBook, dismiss: dismissInsight, fetchInsights } = useInsights()
fetchInsights()

function onSessionStarted() {
  showSessionModal.value = false
  navigateTo('/sessions')
}

// Shelf awareness — only show progress controls on currently-reading or custom shelves
const currentShelfSlug = computed(() => {
  const shelves = book.value?.shelves
  if (!shelves?.length) return null
  return shelvesStore.shelves.find(s => s.id === shelves[0]!.shelfId)?.slug ?? null
})
const isOnWantToRead = computed(() => currentShelfSlug.value === 'want-to-read')
const isOnReadShelf = computed(() => currentShelfSlug.value === 'read')
const showProgressControls = computed(() => !isOnWantToRead.value && !isOnReadShelf.value)

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

const progressLastUpdated = computed(() => formatRelativeTime(book.value?.updatedAt))

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

async function updateField(field: string, value: unknown) {
  if (!book.value) return
  const oldValue = (book.value as Record<string, unknown>)[field]
  ;(book.value as Record<string, unknown>)[field] = value
  savingField.value = field
  try {
    await $fetch(`/api/books/${userBookId.value}`, {
      method: 'PATCH',
      body: { [field]: value },
    })
    toast.success(`${fieldLabels[field] || 'Field'} saved`, 'save')
    useLibraryStore().revalidate()
    // Lazily refresh goal counts when finish date changes
    if (field === 'dateFinished') {
      useGoals().refreshCompleted()
    }
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

const userBookId = computed(() => route.params.id as string)
const bookInsights = forBook(userBookId.value)
const shelvesStore = useShelvesStore()

const progressWidth = computed(() => {
  if (book.value?.progressPercent) {
    return `${parseFloat(book.value.progressPercent)}%`
  }
  if (book.value?.currentMinutes && book.value?.totalMinutes) {
    return `${Math.round((book.value.currentMinutes / book.value.totalMinutes) * 100)}%`
  }
  if (book.value?.currentPage && book.value?.pageCount) {
    return `${Math.round((book.value.currentPage / book.value.pageCount) * 100)}%`
  }
  return '0%'
})

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
        toast.success('You finished! \uD83C\uDF89')
      }
      else if (m === 90) {
        toast.success('Almost there \u2014 90% done! \uD83D\uDCD6')
      }
      else if (m === 50) {
        toast.success('Halfway through! \uD83D\uDCDA')
      }
    }
  }
}

async function updateProgress(page: number | null) {
  if (!book.value) return
  const oldPct = computePercent()
  const oldPage = book.value.currentPage
  book.value.currentPage = page
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
    useLibraryStore().revalidate()
    checkMilestones(oldPct, computePercent())
  }
  catch {
    book.value.currentPage = oldPage
    toast.error('Save failed \u2014 try again')
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
    await $fetch(`/api/books/${userBookId.value}`, {
      method: 'PATCH',
      body: { progressPercent: pct !== null ? String(pct) : null },
    })
    toast.success('Progress saved', 'save')
    useLibraryStore().revalidate()
    checkMilestones(oldPct, pct ?? 0)
    if (pct === 100) showCompletionPrompt.value = true
  }
  catch {
    book.value.progressPercent = String(oldPct) || null
    toast.error('Save failed \u2014 try again')
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
    await $fetch(`/api/books/${userBookId.value}`, { method: 'PATCH', body })
    toast.success('Progress saved', 'save')
    useLibraryStore().revalidate()
    const newPct = computePercent()
    checkMilestones(oldPct, newPct)
  }
  catch {
    book.value.currentMinutes = oldMinutes
    toast.error('Save failed \u2014 try again')
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

// Gate: if on Want to Read, prompt to move to Currently Reading first
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
    useLibraryStore().invalidate()
    toast.success('Moved to Currently Reading! \uD83D\uDCD6')
  }
  catch {
    toast.error('Could not move book')
  }
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
    useLibraryStore().invalidate()
    toast.success('Moved to Read shelf! \uD83D\uDCD6')
  }
  catch {
    toast.error('Could not move book')
  }
}

useHead({
  title: computed(() => book.value ? `${book.value.title} — Bookshelf` : 'Book — Bookshelf'),
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
    book.value = await $fetch<BookDetail>(`/api/books/${userBookId.value}`)
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
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
    // Refresh book data to get updated shelf info
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
    await $fetch(`/api/books/${userBookId.value}`, { method: 'DELETE' })
    useLibraryStore().invalidate()
    toast.success('Book removed')
    await navigateTo('/library')
  }
  catch {
    removing.value = false
    confirmingRemove.value = false
  }
}

onMounted(() => {
  fetchBook()
  useShelvesStore().fetch()
})

</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.book-detail {
  @include container($content-max-width);
  padding-bottom: $spacing-3xl;

  &__back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: var(--highlight-color);
    }
  }

  // --- Skeleton ---
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
    width: 16rem;
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
    height: 3rem;
    width: 100%;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  &__skeleton-desc {
    height: 6rem;
    width: 100%;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  // --- Error ---
  &__error {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    min-height: 40vh;
    @include body-text;
    text-align: center;
  }

  &__error-link {
    @include button-secondary;
    text-decoration: none;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  // --- Hero ---
  &__hero {
    display: flex;
    gap: $spacing-xl;
    margin-bottom: $spacing-2xl;
    animation: fade-in $duration-base $ease-out-quart both;

    @include respond-below($breakpoint-md) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__cover-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__cover-wrap {
    position: relative;

    &:hover .book-detail__cover-change {
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
    width: 2rem;
    height: 2rem;
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

  &__header {
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
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.2;
  }

  &__author {
    font-size: $font-size-lg;
    color: var(--text-color-secondary);
  }

  &__coauthor {
    color: var(--text-color-muted);
  }

  // --- Shelves ---
  &__shelves {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__shelf-badge {
    display: inline-flex;
    align-items: center;
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
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
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

  // --- Genres ---
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

  // --- Actions ---
  &__actions {
    margin-top: $spacing-xs;
  }

  &__move-btn {
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
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: var(--text-color);
    }
  }

  &__remove-btn {
    margin-top: $spacing-sm;
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
      background: rgba(var(--error-color), 0.08);
      border-color: var(--error-color);
    }
  }

  &__remove-confirm {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-sm;
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
    transition: opacity $transition-fast;

    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__remove-no {
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;

    &:hover { color: var(--text-color); }
  }

  // --- Sections ---
  &__sources {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-top: $spacing-md;
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
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: $font-size-sm;
    color: var(--highlight-color);
    text-decoration: none;
    font-weight: $font-weight-medium;

    &:hover {
      text-decoration: underline;
    }
  }

  // --- Sections ---
  &__section {
    padding: $spacing-lg 0;
    border-top: 1px solid var(--border-color-subtle);
    animation: fade-in-up $duration-base $ease-out-expo both;
  }

  &__section-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__description {
    @include body-text;
    line-height: 1.7;
  }

  // --- Progress ---
  &__progress-area {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__progress-bar {
    height: 8px;
    background: var(--sub-bg-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: $radius-full;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    min-width: 0;
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
    min-width: 2.5rem;
    height: 2.25rem;
    padding: 0 $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-sm;
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
    width: 4rem;
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
      appearance: none;
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
    width: 4rem;
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
      appearance: none;
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
    min-width: 4rem;
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
    width: 8rem;
    padding: $spacing-xs $spacing-sm;
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

  &__saving {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__completion-prompt {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
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

  // --- Session ---
  &__session-row {
    display: flex;
    align-items: center;
  }

  &__session-btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: 500;
    color: var(--accent-color);
    background: none;
    border: 1px solid var(--accent-color);
    border-radius: $radius-md;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;
    text-decoration: none;

    &:hover {
      background: var(--accent-color);
      color: var(--surface-color);
    }

    &--active {
      border-color: var(--success-color, #4caf50);
      color: var(--success-color, #4caf50);

      &:hover {
        background: var(--success-color, #4caf50);
        color: var(--surface-color);
      }
    }
  }

  // --- Insights ---
  &__insights {
    display: grid;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  // --- Rating ---
  &__stars {
    display: flex;
    gap: 2px;
  }

  &__rating-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__star {
    padding: 0 1px;
    font-size: 1.5rem;
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

    &:hover { color: var(--text-color); }
  }

  // --- Notes ---
  &__notes-wrap {
    position: relative;
  }

  &__notes-input {
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
  &__dates {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;

    @include respond-below($breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }

  &__date-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: $font-size-sm;
    color: var(--text-color);
  }

  &__date-label {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
}
</style>
