<script setup lang="ts">
import type { BookSearchResult } from '~/server/services/book-api/types'

const props = defineProps<{
  book: BookSearchResult
  shelves: { id: string, name: string }[]
  inLibrary?: boolean
  adding?: boolean
}>()

const emit = defineEmits<{
  'close': []
  'add': [book: BookSearchResult, shelfId: string]
}>()

const showShelfPicker = ref(false)

function onAdd(shelfId: string) {
  showShelfPicker.value = false
  emit('add', props.book, shelfId)
}

function onBackdropClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('book-modal__backdrop')) {
    emit('close')
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="book-modal__backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="`Details for ${book.title}`"
      @click="onBackdropClick"
    >
      <div class="book-modal">
        <button
          class="book-modal__close"
          aria-label="Close"
          @click="$emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div class="book-modal__layout">
          <!-- Large cover -->
          <div class="book-modal__cover-area">
            <BookCover
              :src="book.coverUrl"
              :title="book.title"
              :author="book.author"
              width="14rem"
            />
          </div>

          <!-- Details -->
          <div class="book-modal__details">
            <h2 class="book-modal__title">
              {{ book.title }}
            </h2>
            <p class="book-modal__author">
              {{ book.author }}
              <template v-if="book.additionalAuthors?.length">
                <span
                  v-for="a in book.additionalAuthors"
                  :key="a"
                  class="book-modal__additional-author"
                >
                  , {{ a }}
                </span>
              </template>
            </p>

            <div class="book-modal__meta">
              <div v-if="book.publishedDate" class="book-modal__meta-item">
                <span class="book-modal__meta-label">Published</span>
                <span>{{ book.publishedDate }}</span>
              </div>
              <div v-if="book.pageCount" class="book-modal__meta-item">
                <span class="book-modal__meta-label">Pages</span>
                <span>{{ book.pageCount }}</span>
              </div>
              <div v-if="book.publisher" class="book-modal__meta-item">
                <span class="book-modal__meta-label">Publisher</span>
                <span>{{ book.publisher }}</span>
              </div>
              <div v-if="book.isbn13" class="book-modal__meta-item">
                <span class="book-modal__meta-label">ISBN-13</span>
                <span class="book-modal__isbn">{{ book.isbn13 }}</span>
              </div>
              <div v-if="book.isbn10 && !book.isbn13" class="book-modal__meta-item">
                <span class="book-modal__meta-label">ISBN-10</span>
                <span class="book-modal__isbn">{{ book.isbn10 }}</span>
              </div>
            </div>

            <div
              v-if="book.genres?.length"
              class="book-modal__genres"
            >
              <span
                v-for="genre in book.genres"
                :key="genre"
                class="book-modal__genre-tag"
              >
                {{ genre }}
              </span>
            </div>

            <p
              v-if="book.description"
              class="book-modal__description"
            >
              {{ book.description }}
            </p>

            <!-- Actions -->
            <div class="book-modal__actions">
              <span
                v-if="inLibrary"
                class="book-modal__in-library"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Already in your library
              </span>
              <template v-else>
                <button
                  v-if="!showShelfPicker"
                  class="book-modal__add-btn"
                  :disabled="adding"
                  @click="showShelfPicker = true"
                >
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
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Add to shelf
                </button>
                <div
                  v-else
                  class="book-modal__shelf-picker"
                >
                  <button
                    v-for="shelf in shelves"
                    :key="shelf.id"
                    class="book-modal__shelf-option"
                    :disabled="adding"
                    @click="onAdd(shelf.id)"
                  >
                    {{ shelf.name }}
                  </button>
                  <button
                    class="book-modal__shelf-cancel"
                    @click="showShelfPicker = false"
                  >
                    Cancel
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.book-modal {
  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    animation: fade-in 200ms ease both;
  }
}

.book-modal {
  position: relative;
  width: 100%;
  max-width: 48rem;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--surface-color);
  border-radius: $radius-xl;
  box-shadow: var(--shadow-lg);
  padding: $spacing-xl;
  animation: fade-in-scale 300ms cubic-bezier(0.16, 1, 0.3, 1) both;

  &__close {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    color: var(--text-color-muted);
    background: none;
    border: none;
    border-radius: $radius-full;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease;
    z-index: 1;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }
  }

  &__layout {
    display: flex;
    gap: $spacing-xl;

    @include respond-below($breakpoint-md) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__cover-area {
    flex-shrink: 0;
  }

  &__details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
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

  &__additional-author {
    color: var(--text-color-muted);
  }

  &__meta {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
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
    font-size: $font-size-base;
    line-height: 1.65;
    color: var(--text-color-secondary);
    max-height: 12rem;
    overflow-y: auto;
  }

  &__actions {
    margin-top: $spacing-sm;
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__in-library {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--success-color);
    background: var(--highlight-color-subtle);
    border-radius: $radius-full;
  }

  &__add-btn {
    @include button-primary;
    gap: $spacing-xs;
  }

  &__shelf-picker {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    animation: fade-in-scale 150ms cubic-bezier(0.16, 1, 0.3, 1) both;
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
}
</style>
