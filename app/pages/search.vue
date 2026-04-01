<script setup lang="ts">
import type { BookSearchResult } from '~/server/services/book-api/types'

definePageMeta({
  layout: 'default',
})

useHead({ title: 'Search — Bookshelf' })

const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()

// Search state
const query = ref('')
const results = ref<BookSearchResult[]>([])
const loading = ref(false)
const searched = ref(false)
const errorMessage = ref('')

// Shelves for the "add to shelf" picker
const { shelves, fetchShelves: fetchShelvesComposable } = useShelves()

// Track which books the user already has
const libraryBookIds = ref(new Set<string>())

// Track which books are currently being added
const addingBooks = ref(new Set<string>())

// Detail modal
const selectedBook = ref<BookSearchResult | null>(null)

// Filters
const filters = reactive({
  hasCover: false,
  hasPages: false,
  genre: '',
})

// Collect all unique genres from results
const availableGenres = computed(() => {
  const genres = new Set<string>()
  for (const book of results.value) {
    book.genres?.forEach(g => genres.add(g))
  }
  return [...genres].sort()
})

// Filtered results
const filteredResults = computed(() => {
  let list = results.value
  if (filters.hasCover) {
    list = list.filter(b => b.coverUrl)
  }
  if (filters.hasPages) {
    list = list.filter(b => b.pageCount)
  }
  if (filters.genre) {
    list = list.filter(b => b.genres?.includes(filters.genre))
  }
  return list
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.hasCover) count++
  if (filters.hasPages) count++
  if (filters.genre) count++
  return count
})

function clearFilters() {
  filters.hasCover = false
  filters.hasPages = false
  filters.genre = ''
}

async function fetchShelves() {
  await fetchShelvesComposable()
}

// Search books
async function doSearch(q: string) {
  if (!q || q.length < 2) return

  loading.value = true
  searched.value = true
  errorMessage.value = ''
  results.value = []
  clearFilters()

  try {
    const data = await $fetch<{ results: BookSearchResult[], total: number }>('/api/books/search', {
      params: { q, limit: 20 },
    })
    results.value = data.results
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

// Add book to shelf
async function addBook(book: BookSearchResult, shelfId: string) {
  const bookKey = book.isbn13 || book.isbn10 || book.title
  addingBooks.value.add(bookKey)

  try {
    await $fetch('/api/books/add', {
      method: 'POST',
      body: { book, shelfId },
    })
    libraryBookIds.value.add(bookKey)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add book'
    errorMessage.value = message
  } finally {
    addingBooks.value.delete(bookKey)
  }
}

function isInLibrary(book: BookSearchResult): boolean {
  const key = book.isbn13 || book.isbn10 || book.title
  return libraryBookIds.value.has(key)
}

function isAdding(book: BookSearchResult): boolean {
  const key = book.isbn13 || book.isbn10 || book.title
  return addingBooks.value.has(key)
}

onMounted(() => {
  fetchShelves()
})
</script>

<template>
  <div class="search-page">
    <header class="search-page__header">
      <h1 class="search-page__title">
        Search Books
      </h1>
      <p class="search-page__subtitle">
        Find books by title, author, or ISBN
      </p>
    </header>

    <SearchBar
      v-model="query"
      :loading="loading"
      @search="doSearch"
    />

    <!-- Error -->
    <div
      v-if="errorMessage"
      class="search-page__error"
      role="alert"
    >
      {{ errorMessage }}
    </div>

    <!-- Guest notice -->
    <div
      v-if="isGuest && searched && results.length"
      class="search-page__guest-notice"
    >
      <p>Sign up to save books to your library</p>
      <NuxtLink
        to="/signup"
        class="search-page__guest-link"
      >
        Create an account
      </NuxtLink>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="search-page__skeleton"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="skeleton-card"
      >
        <div class="skeleton-card__cover" />
        <div class="skeleton-card__info">
          <div class="skeleton-card__title" />
          <div class="skeleton-card__author" />
          <div class="skeleton-card__meta" />
        </div>
      </div>
    </div>

    <!-- Filters + Results -->
    <template v-else-if="results.length">
      <!-- Filter bar -->
      <div class="search-page__filters">
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': filters.hasCover }"
          @click="filters.hasCover = !filters.hasCover"
        >
          Has cover
        </button>
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': filters.hasPages }"
          @click="filters.hasPages = !filters.hasPages"
        >
          Has page count
        </button>
        <select
          v-if="availableGenres.length"
          v-model="filters.genre"
          class="filter-select"
          aria-label="Filter by genre"
        >
          <option value="">
            All genres
          </option>
          <option
            v-for="g in availableGenres"
            :key="g"
            :value="g"
          >
            {{ g }}
          </option>
        </select>
        <button
          v-if="activeFilterCount > 0"
          class="filter-clear"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <div class="search-page__results">
        <p class="search-page__count">
          {{ filteredResults.length }} of {{ results.length }} result{{ results.length === 1 ? '' : 's' }}
          <template v-if="activeFilterCount > 0">
            ({{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} active)
          </template>
        </p>
        <div class="search-page__list">
          <BookSearchResultCard
            v-for="(book, index) in filteredResults"
            :key="book.isbn13 || book.isbn10 || `${book.title}-${index}`"
            :book="book"
            :shelves="shelves"
            :in-library="isInLibrary(book)"
            :adding="isAdding(book)"
            :style="{ '--stagger-index': index }"
            @add="addBook"
            @view="selectedBook = $event"
          />
        </div>
        <p
          v-if="filteredResults.length === 0"
          class="search-page__no-filter-match"
        >
          No results match your filters.
          <button
            class="search-page__clear-link"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </p>
      </div>
    </template>

    <!-- Empty state: searched but no results -->
    <div
      v-else-if="searched && !loading"
      class="search-page__empty"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="M8 11h6" />
      </svg>
      <p class="search-page__empty-text">
        No books found for "<strong>{{ query }}</strong>"
      </p>
      <p class="search-page__empty-hint">
        Try a different title, author, or ISBN
      </p>
    </div>

    <!-- Initial state: haven't searched yet -->
    <div
      v-else-if="!searched"
      class="search-page__initial"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      </svg>
      <p class="search-page__initial-text">
        Search millions of books
      </p>
      <p class="search-page__initial-hint">
        Powered by Open Library &amp; Google Books
      </p>
    </div>

    <!-- Book detail modal -->
    <BookDetailModal
      v-if="selectedBook"
      :book="selectedBook"
      :shelves="shelves"
      :in-library="isInLibrary(selectedBook)"
      :adding="isAdding(selectedBook)"
      @close="selectedBook = null"
      @add="addBook"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.search-page {
  @include container($library-max-width);
  padding-top: $spacing-xl;
  padding-bottom: $spacing-2xl;

  &__header {
    margin-bottom: $spacing-lg;
  }

  &__title {
    @include heading($font-size-2xl);
  }

  &__subtitle {
    @include meta-text;
    margin-top: $spacing-xs;
  }

  &__error {
    margin-top: $spacing-md;
    padding: $spacing-sm $spacing-md;
    color: var(--error-color);
    background: var(--surface-color);
    border: 1px solid var(--error-color);
    border-radius: $radius-md;
    font-size: $font-size-sm;
  }

  &__guest-notice {
    margin-top: $spacing-md;
    padding: $spacing-sm $spacing-md;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    background: var(--highlight-color-subtle);
    border-radius: $radius-md;
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
  }

  &__guest-link {
    @include button-primary;
    padding: $spacing-xs $spacing-md;
    font-size: $font-size-sm;
  }

  &__count {
    @include meta-text;
    margin-top: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  // Skeleton loading
  &__skeleton {
    margin-top: $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  // Filter bar
  &__filters {
    margin-top: $spacing-lg;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }

  &__no-filter-match {
    margin-top: $spacing-xl;
    text-align: center;
    color: var(--text-color-muted);
    font-size: $font-size-sm;
  }

  &__clear-link {
    background: none;
    border: none;
    color: var(--highlight-color);
    cursor: pointer;
    font: inherit;
    text-decoration: underline;
    padding: 0;

    &:hover {
      color: var(--highlight-color-hover);
    }
  }

  // Empty & initial states
  &__empty,
  &__initial {
    margin-top: $spacing-3xl;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: var(--text-color-muted);
    gap: $spacing-sm;

    svg {
      opacity: 0.4;
      margin-bottom: $spacing-sm;
    }
  }

  &__empty-text,
  &__initial-text {
    font-size: $font-size-lg;
    color: var(--text-color-secondary);
  }

  &__empty-hint,
  &__initial-hint {
    @include meta-text;
  }
}

// Skeleton cards
.skeleton-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;

  &__cover {
    width: 6rem;
    aspect-ratio: 2 / 3;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__title {
    width: 70%;
    height: 1.25rem;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 100ms;
  }

  &__author {
    width: 45%;
    height: 1rem;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 200ms;
  }

  &__meta {
    width: 55%;
    height: 0.875rem;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 300ms;
  }
}

// Filter chips
.filter-chip {
  padding: $spacing-xs $spacing-md;
  font-family: $font-family-body;
  font-size: $font-size-sm;
  color: var(--text-color-secondary);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-full;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    border-color: var(--highlight-color);
    color: var(--highlight-color);
  }

  &--active {
    background: var(--highlight-color);
    border-color: var(--highlight-color);
    color: #fff;

    &:hover {
      background: var(--highlight-color-hover);
      border-color: var(--highlight-color-hover);
      color: #fff;
    }
  }
}

.filter-select {
  padding: $spacing-xs $spacing-md;
  padding-right: $spacing-lg;
  font-family: $font-family-body;
  font-size: $font-size-sm;
  color: var(--text-color-secondary);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-full;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238c8278' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  transition: border-color 0.15s ease;

  &:hover,
  &:focus {
    border-color: var(--highlight-color);
    outline: none;
  }
}

.filter-clear {
  padding: $spacing-xs $spacing-sm;
  font-family: $font-family-body;
  font-size: $font-size-xs;
  color: var(--text-color-muted);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: var(--text-color);
  }
}
</style>
