<script setup lang="ts">
import { BookOpen, Check, ExternalLink } from 'lucide-vue-next'

interface SeriesBook {
  position: number | string
  title: string
  hardcoverSlug?: string | null
  coverUrl?: string | null
  bookId?: string | null
}

interface SeriesData {
  name: string
  slug: string
  authorName?: string | null
  booksCount: number
  books: SeriesBook[]
}

const props = defineProps<{
  seriesSlug?: string | null
  hardcoverSlug?: string | null
  currentBookTitle?: string
}>()

const seriesData = ref<SeriesData | null>(null)
const loading = ref(true)
const error = ref(false)

async function fetchSeriesData() {
  if (!props.seriesSlug && !props.hardcoverSlug) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = false

  try {
    if (props.seriesSlug) {
      // Direct series slug — fetch from main endpoint
      seriesData.value = await $fetch<SeriesData>(`/api/series/${encodeURIComponent(props.seriesSlug)}`)
    }
    else if (props.hardcoverSlug) {
      // Fallback: look up series by book's hardcover slug
      seriesData.value = await $fetch<SeriesData>(`/api/series/for-book/${encodeURIComponent(props.hardcoverSlug)}`)
    }
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchSeriesData)

function isCurrentBook(book: SeriesBook): boolean {
  return !!props.currentBookTitle && book.title === props.currentBookTitle
}

function searchForSeries() {
  if (seriesData.value?.name) {
    navigateTo(`/search?q=${encodeURIComponent(seriesData.value.name)}`)
  }
}

function searchForBook(book: SeriesBook) {
  if (!isCurrentBook(book)) {
    navigateTo(`/search?q=${encodeURIComponent(book.title)}`)
  }
}
</script>

<template>
  <div v-if="loading" class="series-panel series-panel--loading">
    <div class="series-panel__skeleton" />
  </div>

  <div v-else-if="seriesData && seriesData.books.length > 0" class="series-panel">
    <div class="series-panel__header">
      <BookOpen :size="16" class="series-panel__icon" />
      <div>
        <button class="series-panel__title" @click="searchForSeries">
          {{ seriesData.name }}
        </button>
        <p v-if="seriesData.authorName" class="series-panel__author">
          by {{ seriesData.authorName }} &middot; {{ seriesData.booksCount }} books
        </p>
      </div>
    </div>

    <ol class="series-panel__list">
      <li
        v-for="book in seriesData.books"
        :key="book.hardcoverSlug || book.title"
        class="series-panel__item"
        :class="{
          'series-panel__item--current': isCurrentBook(book),
          'series-panel__item--owned': book.bookId,
          'series-panel__item--clickable': !isCurrentBook(book),
        }"
        :role="!isCurrentBook(book) ? 'button' : undefined"
        :tabindex="!isCurrentBook(book) ? 0 : undefined"
        @click="searchForBook(book)"
        @keydown.enter="searchForBook(book)"
      >
        <span class="series-panel__position">{{ book.position }}</span>
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="book.title"
          class="series-panel__cover"
          loading="lazy"
        >
        <div class="series-panel__info">
          <span class="series-panel__book-title">
            {{ book.title }}
            <Check v-if="book.bookId" :size="12" class="series-panel__owned-icon" />
          </span>
          <span v-if="isCurrentBook(book)" class="series-panel__current-badge">
            Current
          </span>
        </div>
      </li>
    </ol>

    <a
      v-if="seriesData.slug"
      :href="`https://hardcover.app/series/${seriesData.slug}`"
      target="_blank"
      rel="noopener noreferrer"
      class="series-panel__link"
    >
      View full series on Hardcover <ExternalLink :size="12" />
    </a>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/variables' as *;
@use '~/assets/scss/mixins' as *;

.series-panel {
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  padding: $spacing-md;
  margin-top: $spacing-lg;
  background-color: var(--bg-elevated);

  &--loading {
    min-height: 80px;
  }

  &__skeleton {
    height: 60px;
    border-radius: $radius-md;
    background: var(--border-color);
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__icon {
    color: var(--highlight-color);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__title {
    @include body-text;
    font-weight: 600;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;

    &:hover {
      color: var(--highlight-color);
      text-decoration: underline;
    }
  }

  &__author {
    font-size: $font-size-xs;
    color: var(--text-muted);
    margin-top: 1px;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    max-height: 300px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    transition: background-color 0.15s ease;

    &--current {
      background-color: color-mix(in srgb, var(--highlight-color) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--highlight-color) 25%, transparent);
    }

    &--owned {
      opacity: 1;
    }

    &:not(&--owned):not(&--current) {
      opacity: 0.7;
    }

    &--clickable {
      cursor: pointer;

      &:hover {
        background-color: color-mix(in srgb, var(--highlight-color) 8%, transparent);
        opacity: 1;
      }
    }
  }

  &__position {
    font-size: $font-size-xs;
    color: var(--text-muted);
    min-width: 20px;
    text-align: center;
    font-weight: 500;
  }

  &__cover {
    width: 28px;
    height: 42px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__book-title {
    @include body-text;
    font-size: $font-size-sm;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__owned-icon {
    color: var(--success-color, #22c55e);
    flex-shrink: 0;
  }

  &__current-badge {
    font-size: $font-size-xs;
    color: var(--highlight-color);
    background-color: color-mix(in srgb, var(--highlight-color) 15%, transparent);
    padding: 1px $spacing-xs;
    border-radius: $radius-full;
    white-space: nowrap;
    font-weight: 500;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: var(--text-muted);
    text-decoration: none;
    margin-top: $spacing-md;
    padding-top: $spacing-sm;
    border-top: 1px solid var(--border-color);
    transition: color 0.15s ease;

    &:hover {
      color: var(--highlight-color);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>
