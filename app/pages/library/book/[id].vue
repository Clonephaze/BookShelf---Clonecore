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
          <BookCover
            :src="book.coverUrl ?? undefined"
            :title="book.title"
            :author="book.author"
            width="16rem"
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
            <div v-if="book.pageCount" class="book-detail__meta-item">
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

      <!-- === FUTURE PHASE SECTIONS === -->

      <!-- Reading Progress (Phase 5) -->
      <section class="book-detail__section book-detail__section--future">
        <h3 class="book-detail__section-title">
          Reading Progress
          <span class="book-detail__coming-soon">Coming soon</span>
        </h3>
        <div class="book-detail__progress-placeholder">
          <div class="book-detail__progress-bar">
            <div
              class="book-detail__progress-fill"
              :style="{ width: progressWidth }"
            />
          </div>
          <p class="book-detail__progress-text">
            <template v-if="book.currentPage && book.pageCount">
              Page {{ book.currentPage }} of {{ book.pageCount }}
            </template>
            <template v-else>
              Track your reading progress here
            </template>
          </p>
        </div>
      </section>

      <!-- Rating & Review (Phase 4) -->
      <section class="book-detail__section book-detail__section--future">
        <h3 class="book-detail__section-title">
          Your Rating
          <span class="book-detail__coming-soon">Coming soon</span>
        </h3>
        <div class="book-detail__rating-placeholder">
          <div class="book-detail__stars">
            <span
              v-for="star in 5"
              :key="star"
              class="book-detail__star"
              :class="{ 'book-detail__star--filled': book.rating && star <= book.rating }"
            >★</span>
          </div>
          <p class="book-detail__rating-hint">Rate and review this book</p>
        </div>
      </section>

      <!-- Notes (Phase 4) -->
      <section class="book-detail__section book-detail__section--future">
        <h3 class="book-detail__section-title">
          Notes
          <span class="book-detail__coming-soon">Coming soon</span>
        </h3>
        <div class="book-detail__notes-placeholder">
          <p v-if="book.notes" class="book-detail__notes-text">{{ book.notes }}</p>
          <p v-else class="book-detail__notes-hint">Capture your thoughts, quotes, and highlights</p>
        </div>
      </section>

      <!-- Reading Dates (Phase 4) -->
      <section class="book-detail__section book-detail__section--future">
        <h3 class="book-detail__section-title">
          Reading Dates
          <span class="book-detail__coming-soon">Coming soon</span>
        </h3>
        <div class="book-detail__dates">
          <div class="book-detail__date-item">
            <span class="book-detail__date-label">Added</span>
            <span>{{ formatDate(book.dateAdded) }}</span>
          </div>
          <div class="book-detail__date-item">
            <span class="book-detail__date-label">Started</span>
            <span>{{ book.dateStarted ? formatDate(book.dateStarted) : '—' }}</span>
          </div>
          <div class="book-detail__date-item">
            <span class="book-detail__date-label">Finished</span>
            <span>{{ book.dateFinished ? formatDate(book.dateFinished) : '—' }}</span>
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
const { shelves: allShelves } = useShelvesStore()
const showShelfPicker = ref(false)
const movingShelf = ref(false)

const userBookId = computed(() => route.params.id as string)

const progressWidth = computed(() => {
  if (book.value?.progressPercent) {
    return `${parseFloat(book.value.progressPercent)}%`
  }
  if (book.value?.currentPage && book.value?.pageCount) {
    return `${Math.round((book.value.currentPage / book.value.pageCount) * 100)}%`
  }
  return '0%'
})

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
  }
  catch {
    // Could show a toast
  }
  finally {
    movingShelf.value = false
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

    &--future {
      opacity: 0.7;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 1;
      }
    }
  }

  &__section-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__coming-soon {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    background: var(--sub-bg-color);
    padding: 2px $spacing-sm;
    border-radius: $radius-full;
  }

  &__description {
    @include body-text;
    line-height: 1.7;
  }

  // --- Progress placeholder ---
  &__progress-placeholder {
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
    transition: width 0.5s $ease-out-expo;
    min-width: 0;
  }

  &__progress-text {
    @include meta-text;
  }

  // --- Rating placeholder ---
  &__rating-placeholder {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__stars {
    display: flex;
    gap: $spacing-xs;
  }

  &__star {
    font-size: 1.5rem;
    color: var(--border-color);
    line-height: 1;
    cursor: default;

    &--filled {
      color: var(--rating-color);
    }
  }

  &__rating-hint {
    @include meta-text;
  }

  // --- Notes placeholder ---
  &__notes-placeholder {
    padding: $spacing-md;
    background: var(--sub-bg-color);
    border-radius: $radius-md;
    border: 1px dashed var(--border-color);
    min-height: 6rem;
  }

  &__notes-text {
    @include body-text;
    white-space: pre-wrap;
  }

  &__notes-hint {
    @include meta-text;
    font-style: italic;
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
}
</style>
