<template>
  <div class="sessions">
    <header class="sessions__header">
      <div>
        <h1 class="sessions__title">Reading Sessions</h1>
        <p class="sessions__subtitle">Track your reading time</p>
      </div>
    </header>

    <!-- Active session -->
    <ReadingSessionTimer @completed="onSessionEnded" @abandoned="onSessionEnded" />

    <!-- Stats summary -->
    <div v-if="stats && stats.totalSessions > 0" class="sessions__stats-grid">
      <div class="sessions__stat-card">
        <span class="sessions__stat-value">{{ stats.totalSessions }}</span>
        <span class="sessions__stat-label">Sessions</span>
      </div>
      <div class="sessions__stat-card">
        <span class="sessions__stat-value">{{ formatTotalTime(stats.totalDurationSeconds) }}</span>
        <span class="sessions__stat-label">Total time</span>
      </div>
      <div v-if="stats.pagesPerHour" class="sessions__stat-card">
        <span class="sessions__stat-value">{{ stats.pagesPerHour }}</span>
        <span class="sessions__stat-label">Pages / hour</span>
      </div>
      <div v-if="stats.avgDurationSeconds" class="sessions__stat-card">
        <span class="sessions__stat-value">{{ formatMinutes(stats.avgDurationSeconds) }}</span>
        <span class="sessions__stat-label">Avg. session</span>
      </div>
      <div v-if="stats.currentStreak > 0" class="sessions__stat-card sessions__stat-card--streak">
        <span class="sessions__stat-value">
          {{ stats.currentStreak }}
          <Flame :size="18" class="sessions__streak-icon" />
        </span>
        <span class="sessions__stat-label">Day streak</span>
      </div>
      <div v-if="stats.longestStreak > 1" class="sessions__stat-card">
        <span class="sessions__stat-value">{{ stats.longestStreak }}</span>
        <span class="sessions__stat-label">Best streak</span>
      </div>
    </div>

    <!-- No active session — start prompt -->
    <div v-if="!sessionStore.active && !sessionStore.loading" class="sessions__start-section">
      <h2 class="sessions__section-title">Start a Session</h2>
      <p class="sessions__section-desc">Choose a book you're currently reading to start a timed session.</p>
      <div v-if="currentlyReading.length > 0" class="sessions__book-picker">
        <button
          v-for="book in currentlyReading"
          :key="book.userBookId"
          class="sessions__book-option"
          @click="openStartModal(book)"
        >
          <img
            v-if="book.coverUrlSmall"
            :src="book.coverUrlSmall"
            :alt="book.title"
            class="sessions__book-cover"
          >
          <div v-else class="sessions__book-cover sessions__book-cover--placeholder">
            {{ book.title.charAt(0) }}
          </div>
          <div class="sessions__book-meta">
            <span class="sessions__book-title">{{ book.title }}</span>
            <span class="sessions__book-author">{{ book.author }}</span>
            <span v-if="book.currentPage && book.pageCount" class="sessions__book-progress">
              Page {{ book.currentPage }} of {{ book.pageCount }}
            </span>
          </div>
          <Play :size="18" class="sessions__book-play" />
        </button>
      </div>
      <div v-else class="sessions__empty-books">
        <p>No books on your "Currently Reading" shelf.</p>
        <NuxtLink to="/search" class="sessions__empty-cta">Find a book to read</NuxtLink>
      </div>
    </div>

    <!-- Session history -->
    <section v-if="history.length > 0" class="sessions__history">
      <h2 class="sessions__section-title">Session History</h2>
      <div class="sessions__history-list">
        <div v-for="s in history" :key="s.id" class="sessions__history-card">
          <img
            v-if="s.bookCoverSmall"
            :src="s.bookCoverSmall"
            :alt="s.bookTitle"
            class="sessions__history-cover"
          >
          <div class="sessions__history-info">
            <span class="sessions__history-book">{{ s.bookTitle }}</span>
            <div class="sessions__history-details">
              <span>{{ formatSessionDuration(s.durationSeconds) }}</span>
              <span v-if="s.pagesRead">· {{ s.pagesRead }} pages</span>
              <span v-if="s.startPage != null && s.endPage != null" class="sessions__history-pages">
                (p.{{ s.startPage }}–{{ s.endPage }})
              </span>
            </div>
            <span class="sessions__history-date">{{ formatDate(s.startedAt) }}</span>
          </div>
          <span
            v-if="s.status === 'abandoned'"
            class="sessions__history-badge sessions__history-badge--abandoned"
          >
            abandoned
          </span>
        </div>
      </div>
      <button
        v-if="hasMore"
        class="sessions__load-more"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </section>

    <!-- Empty state -->
    <div v-else-if="!loading && !sessionStore.active" class="sessions__empty">
      <div class="sessions__empty-icon" aria-hidden="true">⏱️</div>
      <h2 class="sessions__empty-title">No sessions yet</h2>
      <p class="sessions__empty-text">
        Start a reading session to track your pace and build reading habits.
      </p>
    </div>

    <!-- Start session modal -->
    <SessionStartModal
      :open="showStartModal"
      :user-book-id="selectedBook?.userBookId ?? ''"
      :book-title="selectedBook?.title ?? ''"
      :book-author="selectedBook?.author"
      :book-cover="selectedBook?.coverUrlSmall"
      :book-page-count="selectedBook?.pageCount"
      :current-page="selectedBook?.currentPage"
      @close="showStartModal = false"
      @started="onSessionStarted"
    />
  </div>
</template>

<script setup lang="ts">
import { Play, Flame } from 'lucide-vue-next'
import type { SessionHistoryItem, SessionStats } from '~/stores/session'
import type { ShelfBook } from '~/stores/library'

definePageMeta({ layout: 'default' })

const sessionStore = useSessionStore()
const libraryStore = useLibraryStore()

const loading = ref(true)
const history = ref<SessionHistoryItem[]>([])
const stats = ref<SessionStats | null>(null)
const hasMore = ref(false)
const loadingMore = ref(false)
const showStartModal = ref(false)
const selectedBook = ref<ShelfBook | null>(null)

const currentlyReading = computed(() => {
  const shelf = libraryStore.data.find(s => s.slug === 'currently-reading')
  return shelf?.books ?? []
})

function openStartModal(book: ShelfBook) {
  selectedBook.value = book
  showStartModal.value = true
}

async function onSessionStarted() {
  // Refresh stats
  await fetchStats()
}

async function onSessionEnded() {
  await Promise.all([fetchHistory(), fetchStats()])
}

async function fetchHistory(offset = 0) {
  const rows = await $fetch<SessionHistoryItem[]>('/api/sessions', {
    params: { limit: 20, offset },
  })
  if (offset === 0) {
    history.value = rows
  }
  else {
    history.value.push(...rows)
  }
  hasMore.value = rows.length === 20
}

async function fetchStats() {
  try {
    stats.value = await $fetch<SessionStats>('/api/sessions/stats')
  }
  catch {
    // Non-critical
  }
}

async function loadMore() {
  loadingMore.value = true
  try {
    await fetchHistory(history.value.length)
  }
  finally {
    loadingMore.value = false
  }
}

function formatTotalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)}m`
}

function formatSessionDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

onMounted(async () => {
  await libraryStore.fetch()
  await sessionStore.fetchActive()
  await Promise.all([fetchHistory(), fetchStats()])
  loading.value = false
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.sessions {
  max-width: 48rem;
  margin: 0 auto;
  padding: $spacing-lg $spacing-md;
  @include flex-column;
  gap: $spacing-lg;

  @include respond-to($breakpoint-md) {
    padding: $spacing-xl $spacing-lg;
    gap: $spacing-xl;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: clamp($font-size-xl, 4vw, $font-size-2xl);
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.2;
  }

  &__subtitle {
    @include meta-text;
    margin-top: $spacing-xs;
  }

  // Stats
  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-sm;

    @include respond-to($breakpoint-sm) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__stat-card {
    @include card-base;
    @include flex-column;
    align-items: center;
    text-align: center;
    padding: $spacing-md $spacing-sm;
    gap: $spacing-xs;
  }

  &__stat-value {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__stat-label {
    @include meta-text;
    font-size: $font-size-xs;
  }

  &__stat-card--streak &__stat-value {
    color: var(--progress-color);
  }

  &__streak-icon {
    color: var(--progress-color);
  }

  // Section title
  &__section-title {
    font-family: $font-family-heading;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    margin-bottom: $spacing-sm;
  }

  &__section-desc {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    margin-bottom: $spacing-md;
  }

  // Book picker
  &__start-section {
    @include card-base;
    padding: $spacing-lg;
  }

  &__book-picker {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__book-option {
    @include button-base;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm;
    border-radius: $radius-md;
    background: var(--sub-bg-color);
    border: 1px solid transparent;
    text-align: left;
    width: 100%;
    transition: all 0.15s ease;

    &:hover {
      border-color: var(--highlight-color);
      background: color-mix(in srgb, var(--highlight-color) 5%, var(--sub-bg-color));
    }
  }

  &__book-cover {
    width: 2.5rem;
    height: 3.75rem;
    object-fit: cover;
    border-radius: $radius-sm;
    background: var(--surface-color);
    flex-shrink: 0;

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: $font-family-heading;
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      color: var(--text-color-muted);
    }
  }

  &__book-meta {
    @include flex-column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__book-title {
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__book-author {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__book-progress {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--progress-color);
  }

  &__book-play {
    color: var(--text-color-muted);
    flex-shrink: 0;
    transition: color 0.15s;
  }

  &__book-option:hover &__book-play {
    color: var(--highlight-color);
  }

  &__empty-books {
    @include flex-column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-lg;
    text-align: center;
    color: var(--text-color-muted);
    font-family: $font-family-body;
    font-size: $font-size-sm;
  }

  &__empty-cta {
    @include button-base;
    padding: $spacing-sm $spacing-md;
    background: var(--highlight-color);
    color: var(--highlight-text-color);
    border-radius: $radius-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    text-decoration: none;
  }

  // History
  &__history {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__history-list {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__history-card {
    @include card-base;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
  }

  &__history-cover {
    width: 2rem;
    height: 3rem;
    object-fit: cover;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    flex-shrink: 0;
  }

  &__history-info {
    @include flex-column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__history-book {
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__history-details {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__history-pages {
    color: var(--text-color-muted);
    opacity: 0.7;
  }

  &__history-date {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    opacity: 0.7;
  }

  &__history-badge {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    border-radius: $radius-sm;
    flex-shrink: 0;

    &--abandoned {
      background: color-mix(in srgb, #ef5350 12%, transparent);
      color: #ef5350;
    }
  }

  &__load-more {
    @include button-base;
    padding: $spacing-sm $spacing-md;
    background: var(--sub-bg-color);
    color: var(--text-color-muted);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    align-self: center;

    &:hover:not(:disabled) {
      background: var(--border-color);
      color: var(--text-color);
    }

    &:disabled {
      opacity: 0.6;
    }
  }

  // Empty state
  &__empty {
    @include flex-column;
    align-items: center;
    text-align: center;
    padding: $spacing-2xl $spacing-lg;
    gap: $spacing-md;
  }

  &__empty-icon {
    font-size: 2.5rem;
  }

  &__empty-title {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__empty-text {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    max-width: 24rem;
    line-height: 1.5;
  }
}
</style>
