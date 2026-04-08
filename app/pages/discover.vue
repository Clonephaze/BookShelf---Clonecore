<script setup lang="ts">
import { Sparkles, RefreshCw, TrendingUp, BookOpen, Star } from 'lucide-vue-next'
import type { BookSearchResult } from '~~/server/services/book-api/types'
import type { Recommendation } from '~/composables/useRecommendations'

definePageMeta({ layout: 'default' })
useHead({ title: 'Discover — Bookshelf' })
useSeoMeta({
  ogTitle: 'Discover Books — Bookshelf',
  ogDescription: 'Personalized book recommendations based on your reading history.',
})

const { isGuest } = useGuest()
const { recommendations, loading, fetchRecommendations, dismiss } = useRecommendations()
const shelvesStore = useShelvesStore()
const toast = useToast()

// Trending
const trending = ref<BookSearchResult[]>([])
const trendingLoading = ref(true)

// Shelf data for add-to-shelf
onMounted(async () => {
  await Promise.all([
    fetchRecommendations(),
    shelvesStore.fetch(),
    fetchTrending(),
  ])
})

async function fetchTrending() {
  trendingLoading.value = true
  try {
    const data = await $fetch<{ results: BookSearchResult[] }>('/api/discover/trending', {
      query: { limit: 15 },
    })
    trending.value = data.results
  }
  catch {
    // Trending is optional — fail silently
  }
  finally {
    trendingLoading.value = false
  }
}

// Detail modal
const selectedBook = ref<BookSearchResult | null>(null)
const addingBooks = ref(new Set<string>())

function viewRecommendation(bookId: string) {
  const rec = recommendations.value.find(r => r.bookId === bookId)
  if (!rec) return
  selectedBook.value = recToSearchResult(rec)
}

function viewTrendingBook(book: BookSearchResult) {
  selectedBook.value = book
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
    hardcoverSlug: rec.hardcoverSlug,
    hardcoverId: rec.hardcoverId,
    hardcoverRating: rec.hardcoverRating,
    hardcoverRatingsCount: rec.hardcoverRatingsCount,
    seriesName: rec.seriesName,
    seriesPosition: rec.seriesPosition,
    seriesSlug: rec.seriesSlug,
    moods: rec.moods ?? undefined,
    contentWarnings: rec.contentWarnings ?? undefined,
    audioSeconds: rec.audioSeconds,
    hasAudiobook: rec.hasAudiobook,
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
    useLibraryStore().invalidate()
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

    <!-- Trending section -->
    <section v-if="trending.length > 0 || trendingLoading" class="discover__trending">
      <h2 class="discover__section-title">
        <TrendingUp :size="20" />
        Trending on Hardcover
      </h2>
      <div v-if="trendingLoading" class="discover__trending-loading">
        <div v-for="i in 6" :key="i" class="discover__trending-skeleton" />
      </div>
      <div v-else class="discover__trending-scroll">
        <button
          v-for="book in trending"
          :key="book.hardcoverSlug || book.title"
          class="discover__trending-card"
          @click="viewTrendingBook(book)"
        >
          <img
            v-if="book.coverUrl"
            :src="book.coverUrl"
            :alt="book.title"
            class="discover__trending-cover"
            loading="lazy"
          />
          <div v-else class="discover__trending-cover discover__trending-cover--placeholder">
            <BookOpen :size="20" />
          </div>
          <div class="discover__trending-info">
            <span class="discover__trending-title">{{ book.title }}</span>
            <span class="discover__trending-author">{{ book.author }}</span>
            <div v-if="book.hardcoverRating" class="discover__trending-rating">
              <Star :size="12" />
              {{ book.hardcoverRating.toFixed(1) }}
            </div>
          </div>
        </button>
      </div>
    </section>

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

    <!-- Detail panel (unified) -->
    <BookDetailPanel
      v-if="selectedBook"
      :preview-book="selectedBook"
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

  &__trending {
    margin-bottom: $spacing-2xl;
  }

  &__section-title {
    @include heading;
    font-size: $font-size-lg;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    color: var(--text-color);
  }

  &__trending-loading {
    display: flex;
    gap: $spacing-md;
    overflow: hidden;
  }

  &__trending-skeleton {
    width: 140px;
    height: 260px;
    border-radius: $radius-md;
    background: var(--border-color);
    animation: pulse 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  &__trending-scroll {
    display: flex;
    gap: $spacing-md;
    overflow-x: auto;
    padding-bottom: $spacing-sm;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;

    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 2px;
    }
  }

  &__trending-card {
    display: flex;
    flex-direction: column;
    width: 140px;
    flex-shrink: 0;
    scroll-snap-align: start;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    transition: transform 0.15s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  &__trending-cover {
    width: 140px;
    height: 210px;
    object-fit: cover;
    border-radius: $radius-md;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }
  }

  &__trending-info {
    margin-top: $spacing-sm;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__trending-title {
    @include body-text;
    font-size: $font-size-sm;
    font-weight: 600;
    color: var(--text-color);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.3;
  }

  &__trending-author {
    font-size: $font-size-xs;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__trending-rating {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: $font-size-xs;
    color: var(--highlight-color);
    margin-top: 2px;
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
