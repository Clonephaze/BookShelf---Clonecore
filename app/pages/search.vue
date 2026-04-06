<script setup lang="ts">
import type { BookSearchResult } from '~~/server/services/book-api/types'
definePageMeta({
  layout: 'default',
})

useHead({ title: 'Search — Bookshelf' })
useSeoMeta({
  ogTitle: 'Search Books — Bookshelf',
  ogDescription: 'Search millions of books by title, author, or ISBN.',
})

const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()

const searchStore = useSearchStore()
const shelvesStore = useShelvesStore()
const toast = useToast()

// Track which books are currently being added (UI-only, ephemeral)
const addingBooks = ref(new Set<string>())

// Detail modal (UI-only, ephemeral)
const selectedBook = ref<BookSearchResult | null>(null)

// Add book to shelf
async function addBook(book: BookSearchResult, shelfId: string) {
  if (isGuest.value) {
    toast.success('Sign up to save books to your library')
    return
  }
  const bookKey = book.isbn13 || book.isbn10 || book.title
  addingBooks.value.add(bookKey)

  try {
    await $fetch('/api/books/add', {
      method: 'POST',
      body: { book, shelfId },
    })
    searchStore.markInLibrary(bookKey)
  }
  catch (err: unknown) {
    searchStore.errorMessage = err instanceof Error ? err.message : 'Failed to add book'
  }
  finally {
    addingBooks.value.delete(bookKey)
  }
}

function isAdding(book: BookSearchResult): boolean {
  const key = book.isbn13 || book.isbn10 || book.title
  return addingBooks.value.has(key)
}

async function onSortChange(sort: string) {
  if (sort === 'best-match' || sort === 'relevance') {
    await searchStore.refetchWithSort(sort as 'best-match' | 'relevance')
  }
  // title / author / newest are handled client-side in the store computed
}

onMounted(() => {
  shelvesStore.fetch()

  // If navigated with ?q= param (e.g. from header search), run the search
  const q = useRoute().query.q
  if (typeof q === 'string' && q.trim().length >= 2) {
    searchStore.doSearch(q.trim())
  }
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
      v-model="searchStore.query"
      :loading="searchStore.loading"
      @search="searchStore.doSearch"
    />

    <!-- Error -->
    <div
      v-if="searchStore.errorMessage"
      class="search-page__error"
      role="alert"
    >
      {{ searchStore.errorMessage }}
    </div>

    <!-- Guest notice -->
    <div
      v-if="isGuest && searchStore.searched && searchStore.results.length"
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
      v-if="searchStore.loading"
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
    <template v-else-if="searchStore.results.length">
      <!-- Filter bar -->
      <div class="search-page__filters">
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': searchStore.filters.hasCover }"
          @click="searchStore.filters.hasCover = !searchStore.filters.hasCover"
        >
          Has cover
        </button>
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': searchStore.filters.hasPages }"
          @click="searchStore.filters.hasPages = !searchStore.filters.hasPages"
        >
          Has page count
        </button>
        <select
          v-if="searchStore.availableGenres.length"
          v-model="searchStore.filters.genre"
          class="filter-select"
          aria-label="Filter by genre"
        >
          <option value="">
            All genres
          </option>
          <option
            v-for="g in searchStore.availableGenres"
            :key="g"
            :value="g"
          >
            {{ g }}
          </option>
        </select>
        <button
          v-if="searchStore.activeFilterCount > 0"
          class="filter-clear"
          @click="searchStore.clearFilters"
        >
          Clear filters
        </button>

        <div class="search-page__filters-spacer" />

        <select
          v-model="searchStore.sortBy"
          class="filter-select filter-select--sort"
          aria-label="Sort results"
          @change="onSortChange(searchStore.sortBy)"
        >
          <option value="best-match">Best match</option>
          <option value="relevance">Relevance</option>
          <option value="title">Title A–Z</option>
          <option value="author">Author A–Z</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <div class="search-page__results">
        <p class="search-page__count">
          {{ searchStore.filteredResults.length }} of {{ searchStore.results.length }} result{{ searchStore.results.length === 1 ? '' : 's' }}
          <template v-if="searchStore.activeFilterCount > 0">
            ({{ searchStore.activeFilterCount }} filter{{ searchStore.activeFilterCount === 1 ? '' : 's' }} active)
          </template>
        </p>
        <div class="search-page__list">
          <BookSearchResultCard
            v-for="(book, index) in searchStore.filteredResults"
            :key="book.isbn13 || book.isbn10 || `${book.title}-${index}`"
            :book="book"
            :shelves="shelvesStore.shelves"
            :in-library="searchStore.isInLibrary(book)"
            :adding="isAdding(book)"
            :style="{ '--stagger-index': index }"
            @add="addBook"
            @view="selectedBook = $event"
          />
        </div>
        <p
          v-if="searchStore.filteredResults.length === 0"
          class="search-page__no-filter-match"
        >
          No results match your filters.
          <button
            class="search-page__clear-link"
            @click="searchStore.clearFilters"
          >
            Clear filters
          </button>
        </p>
      </div>
    </template>

    <!-- Empty state: searched but no results -->
    <div
      v-else-if="searchStore.searched && !searchStore.loading"
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
        No books found for "<strong>{{ searchStore.query }}</strong>"
      </p>
      <p class="search-page__empty-hint">
        Try a different title, author, or ISBN
      </p>
    </div>

    <!-- Initial state: haven't searched yet -->
    <div
      v-else-if="!searchStore.searched"
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
      :shelves="shelvesStore.shelves"
      :in-library="searchStore.isInLibrary(selectedBook)"
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

  &__filters-spacer {
    flex: 1;
    min-width: $spacing-md;
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

  &--sort {
    margin-left: auto;
    color: var(--text-color);
    font-weight: $font-weight-medium;
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
