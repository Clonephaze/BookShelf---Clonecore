<script setup lang="ts">
import type { useBookDetail, BookDetail } from '~/composables/useBookDetail'
import { ExternalLink, Headphones, AlertTriangle } from 'lucide-vue-next'

type BookDetailReturn = ReturnType<typeof useBookDetail>

const props = defineProps<{
  detail?: BookDetailReturn
  userBookId?: string
  preview?: boolean
  previewBook?: BookDetail
}>()

const emit = defineEmits<{
  remove: []
}>()

// In preview mode, use previewBook directly; otherwise destructure from detail
const book = computed(() => props.preview ? props.previewBook ?? null : props.detail?.book.value ?? null)

// Library-mode destructured values (safe defaults for preview mode)
const savingField = computed(() => props.detail?.savingField.value ?? null)
const hoverRating = ref(0)
const trackingMode = computed(() => props.detail?.trackingMode.value ?? 'pages')
const progressScale = computed(() => props.detail?.progressScale.value ?? 0)
const progressLastUpdated = computed(() => props.detail?.progressLastUpdated.value ?? null)
const showProgressControls = computed(() => props.detail?.showProgressControls.value ?? false)
const isOnWantToRead = computed(() => props.detail?.isOnWantToRead.value ?? false)
const showCompletionPrompt = computed(() => props.detail?.showCompletionPrompt.value ?? false)
const showStartReadingPrompt = computed(() => props.detail?.showStartReadingPrompt.value ?? false)
const showTimePrompt = computed(() => props.detail?.showTimePrompt.value ?? false)
const showShelfPicker = computed({
  get: () => props.detail?.showShelfPicker.value ?? false,
  set: (v: boolean) => { if (props.detail) props.detail.showShelfPicker.value = v },
})
const movingShelf = computed({
  get: () => props.detail?.movingShelf.value ?? false,
  set: (v: boolean) => { if (props.detail) props.detail.movingShelf.value = v },
})
const confirmingRemove = computed({
  get: () => props.detail?.confirmingRemove.value ?? false,
  set: (v: boolean) => { if (props.detail) props.detail.confirmingRemove.value = v },
})
const removing = computed({
  get: () => props.detail?.removing.value ?? false,
  set: (v: boolean) => { if (props.detail) props.detail.removing.value = v },
})
const showCoverPicker = computed({
  get: () => props.detail?.showCoverPicker.value ?? false,
  set: (v: boolean) => { if (props.detail) props.detail.showCoverPicker.value = v },
})
const shelvesStore = props.detail?.shelvesStore ?? { shelves: [] }

// Forward methods (no-ops in preview mode)
function setRating(star: number) { props.detail?.setRating(star) }
function onNotesInput(event: Event) { props.detail?.onNotesInput(event) }
function onPageInput(event: Event) { props.detail?.onPageInput(event) }
function incrementPage(amount: number) { props.detail?.incrementPage(amount) }
function updatePercentDirect(event: Event) { props.detail?.updatePercentDirect(event) }
function incrementMinutes(amount: number) { props.detail?.incrementMinutes(amount) }
function onTotalMinutesInput(event: Event) { props.detail?.onTotalMinutesInput(event) }
function completeAndMoveToRead() { props.detail?.completeAndMoveToRead() }
function startReadingAndTrack() { props.detail?.startReadingAndTrack() }
function moveToShelf(id: string) { props.detail?.moveToShelf(id) }
function updateField(field: string, value: unknown) { props.detail?.updateField(field, value) }
function onCoverUpdated(url: string) { props.detail?.onCoverUpdated(url) }
function formatMinutes(m: number): string { return props.detail?.formatMinutes(m) ?? `${m}m` }
function parseTimeInput(raw: string) { return props.detail?.parseTimeInput(raw) ?? null }
function toDateInput(date: string | Date | null | undefined) { return props.detail?.toDateInput(date) ?? '' }
function formatDate(date: string | Date | null | undefined) { return props.detail?.formatDate(date) ?? '—' }

// Writable refs need special handling in preview mode
watch(() => props.detail?.hoverRating.value, (v) => { if (v !== undefined) hoverRating.value = v })
watch(hoverRating, (v) => { if (props.detail) props.detail.hoverRating.value = v })

async function handleRemove() {
  if (!props.detail) return
  const success = await props.detail.removeBook()
  if (success) emit('remove')
}

function handleClearTimeTracking() {
  updateField('totalMinutes', null)
  updateField('currentMinutes', null)
}

function formatAudioDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${minutes} min`
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`
}
</script>

<template>
  <div v-if="book" class="bdc">
    <!-- ===== LEFT: Book identity & discovery info ===== -->
    <div class="bdc__info">
      <!-- Cover area -->
      <div class="bdc__cover-area">
        <slot name="cover">
          <div class="bdc__cover-wrap">
            <BookCover
              :src="book.coverUrl ?? undefined"
              :title="book.title"
              :author="book.author"
              width="100%"
            />
            <button
              class="bdc__cover-change"
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
        </slot>
      </div>

      <!-- Series panel (under cover on desktop) -->
      <BookSeriesPanel
        v-if="book.seriesSlug || book.hardcoverSlug"
        :series-slug="book.seriesSlug"
        :hardcover-slug="book.hardcoverSlug"
        :current-book-title="book.title"
      />

      <!-- Header info -->
      <div class="bdc__header">
        <h2 class="bdc__title">{{ book.title }}</h2>
        <p class="bdc__author">
          {{ book.author }}
          <template v-if="book.additionalAuthors?.length">
            <span
              v-for="a in book.additionalAuthors"
              :key="a"
              class="bdc__coauthor"
            >, {{ a }}</span>
          </template>
        </p>

        <!-- Shelf badges -->
        <div v-if="book.shelves?.length" class="bdc__shelves">
          <span
            v-for="s in book.shelves"
            :key="s.shelfId"
            class="bdc__shelf-badge"
          >{{ s.shelfName }}</span>
        </div>

        <!-- Series inline badge -->
        <p v-if="book.seriesName" class="bdc__series-badge">
          #{{ book.seriesPosition ?? '?' }} in {{ book.seriesName }}
        </p>

        <!-- Hardcover community rating -->
        <div v-if="book.hardcoverRating" class="bdc__community-rating">
          <span class="bdc__community-stars">★ {{ book.hardcoverRating.toFixed(1) }}</span>
          <span v-if="book.hardcoverRatingsCount" class="bdc__community-count">
            ({{ book.hardcoverRatingsCount.toLocaleString() }} ratings)
          </span>
        </div>

        <!-- Meta -->
        <div class="bdc__meta">
          <div v-if="book.publishedDate" class="bdc__meta-item">
            <span class="bdc__meta-label">Published</span>
            <span>{{ book.publishedDate }}</span>
          </div>
          <div v-if="trackingMode === 'minutes' && book.totalMinutes" class="bdc__meta-item">
            <span class="bdc__meta-label">Length</span>
            <span>{{ formatMinutes(book.totalMinutes) }}</span>
          </div>
          <div v-else-if="book.pageCount" class="bdc__meta-item">
            <span class="bdc__meta-label">Pages</span>
            <span>{{ book.pageCount }}</span>
          </div>
          <div v-if="book.audioSeconds" class="bdc__meta-item">
            <span class="bdc__meta-label">Audio</span>
            <span class="bdc__meta-audio">
              <Headphones :size="12" />
              {{ formatAudioDuration(book.audioSeconds) }}
            </span>
          </div>
          <div v-else-if="book.hasAudiobook" class="bdc__meta-item">
            <span class="bdc__meta-label">Audio</span>
            <span class="bdc__meta-audio">
              <Headphones :size="12" />
              Available
            </span>
          </div>
          <div v-if="book.publisher" class="bdc__meta-item">
            <span class="bdc__meta-label">Publisher</span>
            <span>{{ book.publisher }}</span>
          </div>
          <div v-if="book.isbn13" class="bdc__meta-item">
            <span class="bdc__meta-label">ISBN</span>
            <span class="bdc__isbn">{{ book.isbn13 }}</span>
          </div>
        </div>

        <!-- Genres -->
        <div v-if="book.genres?.length" class="bdc__genres">
          <span
            v-for="genre in book.genres"
            :key="genre"
            class="bdc__genre-tag"
          >{{ genre }}</span>
        </div>

        <slot name="after-header" />
      </div>

      <!-- Description -->
      <p v-if="book.description" class="bdc__description">
        {{ book.description }}
      </p>

      <!-- Moods -->
      <div v-if="book.moods?.length" class="bdc__moods">
        <span class="bdc__moods-label">Moods</span>
        <div class="bdc__moods-tags">
          <span v-for="mood in book.moods" :key="mood" class="bdc__mood-tag">{{ mood }}</span>
        </div>
      </div>

      <!-- Content warnings -->
      <details v-if="book.contentWarnings?.length" class="bdc__content-warnings">
        <summary class="bdc__content-warnings-summary">
          <AlertTriangle :size="14" />
          Content Warnings ({{ book.contentWarnings.length }})
        </summary>
        <div class="bdc__content-warnings-tags">
          <span v-for="warning in book.contentWarnings" :key="warning" class="bdc__content-warning-tag">{{ warning }}</span>
        </div>
      </details>

      <!-- Source links -->
      <div
        v-if="book.hardcoverSlug || book.openLibraryKey || book.googleBooksId || book.isbn13"
        class="bdc__sources"
      >
        <span class="bdc__sources-label">Find this book:</span>
        <a
          v-if="book.hardcoverSlug"
          :href="`https://hardcover.app/books/${book.hardcoverSlug}`"
          target="_blank"
          rel="noopener noreferrer"
          class="bdc__source-link"
        >Hardcover <ExternalLink :size="14" /></a>
        <a
          v-if="book.openLibraryKey"
          :href="`https://openlibrary.org${book.openLibraryKey}`"
          target="_blank"
          rel="noopener noreferrer"
          class="bdc__source-link"
        >Open Library <ExternalLink :size="14" /></a>
        <a
          v-if="book.googleBooksId"
          :href="`https://books.google.com/books?id=${encodeURIComponent(book.googleBooksId)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="bdc__source-link"
        >Google Books <ExternalLink :size="14" /></a>
        <a
          v-if="book.isbn13 || book.isbn10"
          :href="`https://www.goodreads.com/search?q=${book.isbn13 || book.isbn10}`"
          target="_blank"
          rel="noopener noreferrer"
          class="bdc__source-link"
        >Goodreads <ExternalLink :size="14" /></a>
      </div>
    </div>

    <!-- ===== RIGHT: Personal tracking & series ===== -->
    <div class="bdc__sidebar">
      <!-- Reading progress (only on Currently Reading / custom shelves) -->
      <div v-if="!preview && showProgressControls" class="bdc__progress">
        <span class="bdc__section-label">Reading progress</span>
        <div class="bdc__progress-bar">
          <div class="bdc__progress-fill" :style="{ transform: `scaleX(${progressScale})` }" />
        </div>
        <div class="bdc__progress-controls">
          <template v-if="trackingMode === 'minutes'">
            <button class="bdc__page-btn" aria-label="Subtract 30 minutes" @click="incrementMinutes(-30)">−30m</button>
            <button class="bdc__page-btn" aria-label="Subtract 5 minutes" @click="incrementMinutes(-5)">−5m</button>
            <span class="bdc__time-display">{{ book.currentMinutes ? formatMinutes(book.currentMinutes) : '0m' }}</span>
            <span v-if="book.totalMinutes" class="bdc__page-total">/ {{ formatMinutes(book.totalMinutes) }}</span>
            <button class="bdc__page-btn" aria-label="Add 5 minutes" @click="incrementMinutes(5)">+5m</button>
            <button class="bdc__page-btn" aria-label="Add 30 minutes" @click="incrementMinutes(30)">+30m</button>
          </template>
          <template v-else-if="book.pageCount">
            <button class="bdc__page-btn" aria-label="Subtract 10 pages" @click="incrementPage(-10)">−10</button>
            <button class="bdc__page-btn" aria-label="Subtract 1 page" @click="incrementPage(-1)">−1</button>
            <div class="bdc__page-input-wrap">
              <input
                type="number"
                class="bdc__page-input"
                :value="book.currentPage ?? ''"
                :max="book.pageCount"
                min="0"
                aria-label="Current page"
                @change="onPageInput"
              >
              <span class="bdc__page-total">/ {{ book.pageCount }}</span>
            </div>
            <button class="bdc__page-btn" aria-label="Add 1 page" @click="incrementPage(1)">+1</button>
            <button class="bdc__page-btn" aria-label="Add 10 pages" @click="incrementPage(10)">+10</button>
          </template>
          <template v-else>
            <div class="bdc__pct-input-wrap">
              <input
                type="number"
                class="bdc__pct-input"
                :value="book.progressPercent ? Math.round(parseFloat(book.progressPercent)) : ''"
                min="0"
                max="100"
                aria-label="Percent complete"
                @change="updatePercentDirect"
              >
              <span class="bdc__pct-symbol">%</span>
            </div>
          </template>
        </div>
        <!-- Total length input for minutes mode -->
        <div v-if="trackingMode === 'minutes'" class="bdc__time-total-row">
          <label class="bdc__time-total-label" :for="`total-time-${userBookId}`">Total length</label>
          <input
            :id="`total-time-${userBookId}`"
            type="text"
            class="bdc__time-total-input"
            :value="book.totalMinutes ? formatMinutes(book.totalMinutes) : ''"
            placeholder="e.g. 12h 30m"
            aria-label="Total audiobook length"
            @change="onTotalMinutesInput"
          >
        </div>
        <!-- Switch tracking mode -->
        <div v-if="showTimePrompt && trackingMode !== 'minutes'" class="bdc__time-prompt">
          <label class="bdc__time-total-label" :for="`switch-time-${userBookId}`">Total length</label>
          <input
            :id="`switch-time-${userBookId}`"
            type="text"
            class="bdc__time-total-input"
            placeholder="e.g. 12h 30m"
            aria-label="Total audiobook length"
            @keydown.enter="($event: KeyboardEvent) => { const m = parseTimeInput(($event.target as HTMLInputElement).value); if (m != null && m > 0) { updateField('totalMinutes', m); showTimePrompt = false; } }"
            @change="(e: Event) => { const m = parseTimeInput((e.target as HTMLInputElement).value); if (m != null && m > 0) { updateField('totalMinutes', m); showTimePrompt = false; } }"
          >
          <button class="bdc__mode-switch" @click="showTimePrompt = false">Cancel</button>
        </div>
        <button
          v-else-if="trackingMode === 'pages' || (!book.totalMinutes && !book.currentMinutes)"
          class="bdc__mode-switch"
          @click="showTimePrompt = true"
        >
          Track by time instead
        </button>
        <button
          v-else-if="trackingMode === 'minutes'"
          class="bdc__mode-switch"
          @click="handleClearTimeTracking"
        >
          Track by pages instead
        </button>
        <span v-if="savingField === 'currentPage' || savingField === 'progressPercent' || savingField === 'currentMinutes'" class="bdc__saving">Saving…</span>
        <!-- Completion prompt -->
        <div v-if="showCompletionPrompt" class="bdc__prompt">
          <span>Move to <strong>Read</strong> shelf?</span>
          <button class="bdc__prompt-yes" @click="completeAndMoveToRead">Yes, I'm done!</button>
          <button class="bdc__prompt-no" @click="showCompletionPrompt = false">Not yet</button>
        </div>
      </div>

      <!-- Want to Read: prompt to start reading -->
      <div v-else-if="!preview && isOnWantToRead" class="bdc__progress">
        <span class="bdc__section-label">Reading progress</span>
        <div v-if="showStartReadingPrompt" class="bdc__prompt">
          <span>Move to <strong>Currently Reading</strong> to start tracking?</span>
          <button class="bdc__prompt-yes" @click="startReadingAndTrack">Yes, start reading!</button>
          <button class="bdc__prompt-no" @click="showStartReadingPrompt = false">Not yet</button>
        </div>
        <button
          v-else
          class="bdc__mode-switch"
          @click="showStartReadingPrompt = true"
        >
          Start reading this book
        </button>
      </div>

      <!-- Rating -->
      <div v-if="!preview" class="bdc__rating-row">
        <span class="bdc__section-label">Your rating</span>
        <div
          class="bdc__stars"
          role="group"
          aria-label="Rate this book"
          @mouseleave="hoverRating = 0"
        >
          <button
            v-for="star in 5"
            :key="star"
            class="bdc__star"
            :class="{
              'bdc__star--filled': star <= (hoverRating || book.rating || 0),
              'bdc__star--hover': hoverRating > 0 && star <= hoverRating,
            }"
            :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`"
            :aria-pressed="book.rating === star"
            @mouseenter="hoverRating = star"
            @click="setRating(star)"
          >★</button>
        </div>
        <span v-if="book.rating" class="bdc__rating-clear" @click="updateField('rating', null)">Clear</span>
      </div>

      <!-- Notes -->
      <div v-if="!preview" class="bdc__notes-row">
        <label class="bdc__section-label" :for="`notes-${userBookId}`">Notes</label>
        <div class="bdc__notes-wrap">
          <textarea
            :id="`notes-${userBookId}`"
            class="bdc__notes"
            :value="book.notes ?? ''"
            placeholder="Capture your thoughts, quotes, and highlights…"
            rows="4"
            @input="onNotesInput"
          />
          <span v-if="savingField === 'notes'" class="bdc__saving bdc__saving--notes">Saving…</span>
        </div>
      </div>

      <!-- Reading dates -->
      <div v-if="!preview" class="bdc__dates-row">
        <span class="bdc__section-label">Reading dates</span>
        <div class="bdc__dates-grid">
          <div class="bdc__date-item">
            <label class="bdc__date-label" :for="`date-added-${userBookId}`">Added</label>
            <span class="bdc__date-value">{{ formatDate(book.dateAdded) }}</span>
          </div>
          <div class="bdc__date-item">
            <label class="bdc__date-label" :for="`date-started-${userBookId}`">Started</label>
            <input
              :id="`date-started-${userBookId}`"
              type="date"
              class="bdc__date-input"
              :value="toDateInput(book.dateStarted)"
              @change="updateField('dateStarted', ($event.target as HTMLInputElement).value || null)"
            >
          </div>
          <div class="bdc__date-item">
            <label class="bdc__date-label" :for="`date-finished-${userBookId}`">Finished</label>
            <input
              :id="`date-finished-${userBookId}`"
              type="date"
              class="bdc__date-input"
              :value="toDateInput(book.dateFinished)"
              @change="updateField('dateFinished', ($event.target as HTMLInputElement).value || null)"
            >
          </div>
          <div v-if="progressLastUpdated" class="bdc__date-item">
            <span class="bdc__date-label">Last updated</span>
            <span class="bdc__date-value">{{ progressLastUpdated }}</span>
          </div>
        </div>
      </div>

      <!-- Shelf actions -->
      <div v-if="!preview" class="bdc__actions">
        <button
          v-if="!showShelfPicker"
          class="bdc__action-btn"
          @click="showShelfPicker = true"
        >
          Move to shelf
        </button>
        <div v-else class="bdc__shelf-picker">
          <button
            v-for="shelf in shelvesStore.shelves"
            :key="shelf.id"
            class="bdc__shelf-option"
            :disabled="movingShelf"
            @click="moveToShelf(shelf.id)"
          >{{ shelf.name }}</button>
          <button
            class="bdc__shelf-cancel"
            @click="showShelfPicker = false"
          >Cancel</button>
        </div>

        <button
          v-if="!confirmingRemove"
          class="bdc__remove-btn"
          @click="confirmingRemove = true"
        >
          Remove from library
        </button>
        <div v-else class="bdc__remove-confirm">
          <span class="bdc__remove-warning">Remove this book?</span>
          <button
            class="bdc__remove-yes"
            :disabled="removing"
            @click="handleRemove"
          >Yes, remove</button>
          <button
            class="bdc__remove-no"
            @click="confirmingRemove = false"
          >Cancel</button>
        </div>
      </div>

      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.bdc {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  // --- Info / Sidebar wrappers ---
  &__info {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    min-width: 0;
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    min-width: 0;
  }

  // --- Community rating ---
  &__community-rating {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
  }

  &__community-stars {
    color: var(--rating-color, #c9a227);
    font-weight: $font-weight-medium;
  }

  &__community-count {
    color: var(--text-color-muted);
    font-size: $font-size-xs;
  }

  // --- Series badge ---
  &__series-badge {
    font-size: $font-size-sm;
    color: var(--highlight-color);
    font-weight: $font-weight-medium;
  }

  // --- Header ---
  &__cover-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__cover-wrap {
    position: relative;

    :deep(.book-cover) {
      width: 100% !important;
    }

    &:hover .bdc__cover-change {
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

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-xl;
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

  &__meta-audio {
    display: inline-flex;
    align-items: center;
    gap: 3px;
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

  // --- Audiobook ---
  &__audiobook {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: var(--text-color-muted);
    font-size: $font-size-sm;
    margin-bottom: $spacing-sm;
  }

  // --- Moods ---
  &__moods {
    margin-bottom: $spacing-md;
  }

  &__moods-label {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-xs;
    font-weight: $font-weight-medium;
  }

  &__moods-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__mood-tag {
    font-size: $font-size-xs;
    color: var(--highlight-color);
    background-color: color-mix(in srgb, var(--highlight-color) 10%, transparent);
    padding: 2px $spacing-xs;
    border-radius: $radius-full;
  }

  // --- Content warnings ---
  &__content-warnings {
    margin-bottom: $spacing-md;
  }

  &__content-warnings-summary {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--text-color);
    }
  }

  &__content-warnings-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-xs;
    padding-left: $spacing-md;
  }

  &__content-warning-tag {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background-color: var(--sub-bg-color);
    padding: 2px $spacing-xs;
    border-radius: $radius-sm;
    border: 1px solid var(--border-color);
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
    width: 100%;
    height: 100%;
    background: var(--progress-color);
    border-radius: $radius-full;
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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

  &__prompt {
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

  &__prompt-yes {
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

  &__prompt-no {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;
    &:hover { color: var(--text-color); }
  }

  &__saving {
    font-size: $font-size-xs;
    color: var(--text-color-muted);

    &--notes {
      position: absolute;
      bottom: $spacing-xs;
      right: $spacing-sm;
      pointer-events: none;
    }
  }

  // --- Rating ---
  &__rating-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__stars {
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

  // --- Dates ---
  &__dates-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__dates-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-sm;
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
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
