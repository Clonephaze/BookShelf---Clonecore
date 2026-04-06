<script setup lang="ts">
import { BookOpen, Home, ArrowLeft, Search } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const is404 = computed(() => props.error.statusCode === 404)

useHead({
  title: computed(() => is404.value ? 'Page Not Found — Bookshelf' : 'Something Went Wrong — Bookshelf'),
})

// Literary easter egg: famous "lost" opening lines, shuffled per visit
const lostQuotes = [
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien', book: 'The Fellowship of the Ring' },
  { text: 'It is a truth universally acknowledged, that a page in want of content must be in want of a URL.', author: 'after Jane Austen', book: '' },
  { text: 'It was the best of pages, it was the worst of pages.', author: 'after Charles Dickens', book: '' },
  { text: 'Call me lost. Some pages ago — never mind how long precisely — having little or no content in my server…', author: 'after Herman Melville', book: '' },
  { text: 'In a hole in the ground there lived a page. Not a nasty, dirty, wet page — a comfortable, well-rendered page… but it seems to have wandered off.', author: 'after J.R.R. Tolkien', book: '' },
  { text: 'It was a bright cold day in April, and the clocks were striking 404.', author: 'after George Orwell', book: '' },
  { text: 'All happy pages are alike; each missing page is missing in its own way.', author: 'after Leo Tolstoy', book: '' },
  { text: 'The page, if there had been a page here, had vanished.', author: 'after Gabriel García Márquez', book: '' },
  { text: 'Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. This page, however, is not.', author: 'after J.K. Rowling', book: '' },
  { text: 'It is a truth universally acknowledged, that a single page in possession of a good URL, must be in want of some content.', author: 'after Jane Austen', book: '' },
  { text: 'I am an invisible page. No, I am not a spook like those pages that haunted Edgar Allan Poe.', author: 'after Ralph Ellison', book: '' },
  { text: 'Somewhere in la Mancha, in a place whose URL I do not care to remember, a page recently lived that kept a library…', author: 'after Cervantes', book: '' },
]

const quote = computed(() => {
  const idx = Math.floor(Math.random() * lostQuotes.length)
  const pick = lostQuotes[idx]
  return pick ?? { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien', book: 'The Fellowship of the Ring' }
})

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    clearError({ redirect: '/' })
  }
}
</script>

<template>
  <div class="error-page">
    <div class="error-page__container">
      <!-- Decorative book icon -->
      <div class="error-page__icon">
        <BookOpen :size="48" stroke-width="1.5" />
      </div>

      <!-- 404 content -->
      <template v-if="is404">
        <h1 class="error-page__code">404</h1>
        <p class="error-page__title">This page seems to have been mishelved.</p>

        <!-- Literary easter egg -->
        <blockquote class="error-page__quote">
          <p>"{{ quote.text }}"</p>
          <cite>— {{ quote.author }}</cite>
        </blockquote>
      </template>

      <!-- Generic error content -->
      <template v-else>
        <h1 class="error-page__code">{{ error.statusCode }}</h1>
        <p class="error-page__title">Something went wrong.</p>
        <p class="error-page__message">
          {{ error.statusMessage || error.message || 'An unexpected error occurred.' }}
        </p>
      </template>

      <!-- Actions -->
      <div class="error-page__actions">
        <button class="error-page__btn error-page__btn--secondary" @click="goBack">
          <ArrowLeft :size="18" />
          Go back
        </button>
        <button class="error-page__btn error-page__btn--primary" @click="clearError({ redirect: '/' })">
          <Home :size="18" />
          Home
        </button>
        <button v-if="is404" class="error-page__btn error-page__btn--secondary" @click="clearError({ redirect: '/search' })">
          <Search :size="18" />
          Search books
        </button>
      </div>

      <p class="error-page__hint">
        <template v-if="is404">
          Perhaps the page you're looking for is in another chapter.
        </template>
        <template v-else>
          Try refreshing the page or come back later.
        </template>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: 'Inter', sans-serif;

  &__container {
    max-width: 540px;
    text-align: center;
  }

  &__icon {
    color: var(--color-highlight);
    margin-bottom: 1.5rem;
    opacity: 0.7;
  }

  &__code {
    font-family: 'Lora', serif;
    font-size: clamp(4rem, 10vw, 7rem);
    font-weight: 700;
    line-height: 1;
    color: var(--color-highlight);
    margin: 0 0 0.5rem;
  }

  &__title {
    font-family: 'Lora', serif;
    font-size: clamp(1.2rem, 3vw, 1.5rem);
    font-weight: 500;
    margin: 0 0 1.5rem;
    color: var(--color-text-primary);
  }

  &__message {
    font-size: 0.95rem;
    color: var(--color-text-secondary);
    margin: 0 0 1.5rem;
    line-height: 1.6;
  }

  &__quote {
    margin: 0 0 2rem;
    padding: 1.25rem 1.5rem;
    background: var(--color-surface);
    border-left: 3px solid var(--color-highlight);
    border-radius: 0 8px 8px 0;
    text-align: left;

    p {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 1.05rem;
      line-height: 1.6;
      color: var(--color-text-primary);
      margin: 0 0 0.5rem;
    }

    cite {
      font-family: 'Inter', sans-serif;
      font-style: normal;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
    border: none;

    &--primary {
      background: var(--color-highlight);
      color: #fff;

      &:hover {
        background: var(--color-highlight-hover);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }

    &--secondary {
      background: var(--color-surface);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);

      &:hover {
        background: var(--color-sub-bg);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }
  }

  &__hint {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-style: italic;
  }
}
</style>
