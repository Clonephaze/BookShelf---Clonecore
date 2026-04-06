<script setup lang="ts">
import { Sparkles, RefreshCw } from 'lucide-vue-next'
import type { BookSearchResult } from '~~/server/services/book-api/types'
import type { Recommendation } from '~/composables/useRecommendations'

definePageMeta({ layout: 'default' })
useHead({ title: 'Discover — Bookshelf' })

const { isGuest } = useGuest()
const { recommendations, loading, fetchRecommendations, dismiss } = useRecommendations()
const shelvesStore = useShelvesStore()
const toast = useToast()

// Shelf data for add-to-shelf
onMounted(async () => {
  await Promise.all([
    fetchRecommendations(),
    shelvesStore.fetch(),
  ])
})

// Detail modal
const selectedBook = ref<BookSearchResult | null>(null)
const addingBooks = ref(new Set<string>())

function viewRecommendation(bookId: string) {
  const rec = recommendations.value.find(r => r.bookId === bookId)
  if (!rec) return
  selectedBook.value = recToSearchResult(rec)
}

function recToSearchResult(rec: Recommendation): BookSearchResult {
  return {
    title: rec.title,
    author: rec.author,
    coverUrl: rec.coverUrl ?? undefined,
    coverUrlSmall: rec.coverUrlSmall ?? undefined,
    genres: rec.genres ?? undefined,
    pageCount: rec.pageCount ?? undefined,
    publishedDate: rec.publishedDate ?? undefined,
    description: rec.description ?? undefined,
    isbn13: rec.isbn13,
    isbn10: rec.isbn10,
    openLibraryKey: rec.openLibraryKey,
    googleBooksId: rec.googleBooksId,
  }
}

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
    toast.success(`Added "${book.title}" to your library`)
    // Remove from recommendations since it's now in library
    const rec = recommendations.value.find(r => r.title === book.title)
    if (rec) dismiss(rec.bookId)
    selectedBook.value = null
  } catch {
    toast.error('Failed to add book')
  } finally {
    addingBooks.value.delete(bookKey)
  }
}

function isAdding(book: BookSearchResult): boolean {
  const key = book.isbn13 || book.isbn10 || book.title
  return addingBooks.value.has(key)
}

function handleDismiss(bookId: string) {
  dismiss(bookId)
}

async function refresh() {
  await fetchRecommendations(true)
}
</script>

<template>
  <div class="discover">
    <header class="discover__header">
      <div>
        <h1 class="discover__title">
          <Sparkles :size="24" class="discover__title-icon" />
          Discover
        </h1>
        <p class="discover__subtitle">Book recommendations based on your reading history</p>
      </div>
      <button
        class="discover__refresh"
        :disabled="loading"
        @click="refresh"
      >
        <RefreshCw :size="16" :class="{ 'spin': loading }" />
        Refresh
      </button>
    </header>

    <!-- Loading -->
    <div v-if="loading && recommendations.length === 0" class="discover__loading">
      <div v-for="i in 6" :key="i" class="discover__skeleton" />
    </div>

    <!-- Empty state -->
    <div v-else-if="recommendations.length === 0" class="discover__empty">
      <Sparkles :size="48" class="discover__empty-icon" />
      <h2 class="discover__empty-title">No recommendations yet</h2>
      <p class="discover__empty-desc">
        Add more books to your library, rate what you've read, and recommendations will appear here.
        The more you read and rate, the better the suggestions get.
      </p>
      <NuxtLink to="/search" class="discover__empty-cta">
        Search for books
      </NuxtLink>
    </div>

    <!-- Recommendations grid -->
    <div v-else class="discover__grid">
      <RecommendationCard
        v-for="rec in recommendations"
        :key="rec.bookId"
        :recommendation="rec"
        class="animate-fade-in-up stagger-item"
        @view="viewRecommendation"
        @dismiss="handleDismiss"
      />
    </div>

    <!-- Detail modal (reuse search modal) -->
    <BookDetailModal
      v-if="selectedBook"
      :book="selectedBook"
      :shelves="shelvesStore.shelves"
      :in-library="false"
      :adding="isAdding(selectedBook)"
      @close="selectedBook = null"
      @add="addBook"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;
@use '~/assets/scss/mixins' as *;

.discover {
  @include container($library-max-width);
  padding: $spacing-xl $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-xl;
    gap: $spacing-md;
  }

  &__title {
    @include heading;
    font-size: $font-size-2xl;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__title-icon {
    color: var(--highlight-color);
  }

  &__subtitle {
    @include body-text;
    color: var(--text-muted);
    margin-top: $spacing-xs;
  }

  &__refresh {
    @include button-tertiary;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
    flex-shrink: 0;

    .spin {
      animation: spin 1s linear infinite;
    }
  }

  &__loading {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $spacing-md;
  }

  &__skeleton {
    height: 140px;
    border-radius: $radius-lg;
    background: var(--border-color);
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__empty {
    @include flex-center;
    flex-direction: column;
    text-align: center;
    padding: $spacing-3xl $spacing-md;
    gap: $spacing-md;
  }

  &__empty-icon {
    color: var(--text-muted);
    opacity: 0.5;
  }

  &__empty-title {
    @include heading;
    font-size: $font-size-xl;
    color: var(--text-color);
  }

  &__empty-desc {
    @include body-text;
    color: var(--text-muted);
    max-width: 420px;
    line-height: 1.6;
  }

  &__empty-cta {
    @include button-primary;
    margin-top: $spacing-sm;
    text-decoration: none;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $spacing-md;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>
