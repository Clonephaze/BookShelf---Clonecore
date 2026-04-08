<script setup lang="ts">
import type { BookSearchResult } from '~~/server/services/book-api/types'
import type { BookDetail } from '~/composables/useBookDetail'

const props = defineProps<{
  userBookId?: string
  sourceEl?: HTMLElement | null
  // Preview mode props (for search/discover)
  previewBook?: BookSearchResult
  shelves?: { id: string, name: string }[]
  inLibrary?: boolean
  adding?: boolean
}>()

const emit = defineEmits<{
  close: []
  add: [book: BookSearchResult, shelfId: string]
}>()

const isPreview = computed(() => !!props.previewBook)

// Library mode: use composable
const detail = props.userBookId
  ? useBookDetail(computed(() => props.userBookId!))
  : null

const loading = detail ? detail.loading : ref(false)
const error = detail ? detail.error : ref(false)
const book = computed(() => {
  if (isPreview.value) return previewBookDetail.value
  return detail?.book.value ?? null
})
const fetchBook = detail?.fetchBook ?? (() => Promise.resolve())
const shelvesStore = detail?.shelvesStore ?? { fetch: () => Promise.resolve() }

// Convert BookSearchResult to BookDetail for preview mode
// audioSeconds may be fetched asynchronously from HC GraphQL
const fetchedAudioSeconds = ref<number | null>(null)

const previewBookDetail = computed<BookDetail | null>(() => {
  if (!props.previewBook) return null
  const b = props.previewBook
  return {
    title: b.title,
    author: b.author,
    additionalAuthors: b.additionalAuthors,
    coverUrl: b.coverUrl,
    isbn13: b.isbn13,
    isbn10: b.isbn10,
    pageCount: b.pageCount,
    publishedDate: b.publishedDate,
    publisher: b.publisher,
    genres: b.genres,
    description: b.description,
    openLibraryKey: b.openLibraryKey,
    googleBooksId: b.googleBooksId,
    hardcoverSlug: b.hardcoverSlug,
    hardcoverId: b.hardcoverId,
    audioSeconds: fetchedAudioSeconds.value ?? b.audioSeconds,
    hasAudiobook: b.hasAudiobook,
    moods: b.moods,
    contentWarnings: b.contentWarnings,
    seriesName: b.seriesName,
    seriesPosition: b.seriesPosition,
    seriesSlug: b.seriesSlug,
    hardcoverRating: b.hardcoverRating,
    hardcoverRatingsCount: b.hardcoverRatingsCount,
  }
})

// Preview mode: add to shelf
const showPreviewShelfPicker = ref(false)
function onPreviewAdd(shelfId: string) {
  if (!props.previewBook) return
  showPreviewShelfPicker.value = false
  emit('add', props.previewBook, shelfId)
}

const panelEl = ref<HTMLElement>()
const coverEl = ref<HTMLElement>()
const showContent = ref(false)

// Override fetchBook to trigger fade-in on load
const originalFetch = fetchBook
async function fetchBookAndShow() {
  await originalFetch()
  nextTick(() => {
    showContent.value = true
  })
}

// --- FLIP zoom animation ---
function animateCoverIn() {
  if (!props.sourceEl || !coverEl.value) return

  const sourceRect = props.sourceEl.getBoundingClientRect()
  const targetRect = coverEl.value.getBoundingClientRect()

  const deltaX = sourceRect.left - targetRect.left
  const deltaY = sourceRect.top - targetRect.top
  const scaleX = sourceRect.width / targetRect.width
  const scaleY = sourceRect.height / targetRect.height

  coverEl.value.animate(
    [
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
        borderRadius: '2px',
      },
      {
        transform: 'translate(0, 0) scale(1, 1)',
        borderRadius: '6px',
      },
    ],
    {
      duration: 400,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
    },
  )
}

// Keyboard & click handlers
function onBackdropClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('detail-panel__backdrop')) {
    emit('close')
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'

  if (isPreview.value) {
    // Preview mode: no fetch needed, but resolve audio duration if missing
    showContent.value = true
    if (props.previewBook?.hasAudiobook && !props.previewBook.audioSeconds && props.previewBook.hardcoverId) {
      $fetch<{ audioSeconds: number | null }>('/api/books/audio-duration', {
        params: { hardcoverId: props.previewBook.hardcoverId },
      }).then((res) => {
        if (res.audioSeconds) fetchedAudioSeconds.value = res.audioSeconds
      }).catch(() => { /* non-critical */ })
    }
  } else {
    fetchBookAndShow()
    shelvesStore.fetch()
  }

  nextTick(() => {
    setTimeout(() => animateCoverIn(), 50)
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="detail-panel__backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="book ? `Details for ${book.title}` : 'Book details'"
      @click="onBackdropClick"
    >
      <div ref="panelEl" class="detail-panel">
        <button
          class="detail-panel__close"
          aria-label="Close"
          @click="$emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <!-- Loading skeleton -->
        <div v-if="loading" class="detail-panel__skeleton">
          <div class="detail-panel__skeleton-cover" />
          <div class="detail-panel__skeleton-info">
            <div class="detail-panel__skeleton-title" />
            <div class="detail-panel__skeleton-author" />
            <div class="detail-panel__skeleton-meta" />
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="detail-panel__error">
          <p>Couldn't load this book.</p>
          <button class="detail-panel__error-btn" @click="fetchBookAndShow">
            Try again
          </button>
        </div>

        <!-- Content -->
        <template v-else-if="book">
          <div class="detail-panel__layout" :class="{ 'detail-panel__layout--visible': showContent }">
            <BookDetailContent
              :detail="detail ?? undefined"
              :user-book-id="userBookId"
              :preview="isPreview"
              :preview-book="isPreview ? previewBookDetail ?? undefined : undefined"
              @remove="emit('close')"
            >
              <template #cover>
                <div class="detail-panel__cover-area">
                  <div ref="coverEl" class="detail-panel__cover">
                    <BookCover
                      :src="book.coverUrl ?? undefined"
                      :title="book.title"
                      :author="book.author"
                      width="100%"
                    />
                    <button
                      v-if="!isPreview"
                      class="detail-panel__cover-change"
                      aria-label="Change cover"
                      @click="detail!.showCoverPicker.value = !detail!.showCoverPicker.value"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </button>
                  </div>
                  <CoverPicker
                    v-if="!isPreview && detail?.showCoverPicker.value"
                    :user-book-id="userBookId!"
                    @updated="detail!.onCoverUpdated"
                    @close="detail!.showCoverPicker.value = false"
                  />
                </div>
              </template>

              <template #after-header>
                <NuxtLink
                  v-if="!isPreview && userBookId"
                  :to="`/library/book/${userBookId}`"
                  class="detail-panel__full-page"
                  @click="$emit('close')"
                >
                  View full page →
                </NuxtLink>
              </template>

              <template #footer>
                <!-- Preview mode: add to shelf actions -->
                <div v-if="isPreview" class="detail-panel__preview-actions">
                  <span
                    v-if="inLibrary"
                    class="detail-panel__in-library"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                    Already in your library
                  </span>
                  <template v-else>
                    <button
                      v-if="!showPreviewShelfPicker"
                      class="detail-panel__add-btn"
                      :disabled="adding"
                      @click="showPreviewShelfPicker = true"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      Add to shelf
                    </button>
                    <div v-else class="detail-panel__shelf-picker">
                      <button
                        v-for="shelf in shelves"
                        :key="shelf.id"
                        class="detail-panel__shelf-option"
                        :disabled="adding"
                        @click="onPreviewAdd(shelf.id)"
                      >{{ shelf.name }}</button>
                      <button
                        class="detail-panel__shelf-cancel"
                        @click="showPreviewShelfPicker = false"
                      >Cancel</button>
                    </div>
                  </template>
                </div>
              </template>
            </BookDetailContent>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.detail-panel {
  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: $spacing-xl;
    padding-top: 5vh;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    animation: fade-in 200ms ease both;

    @include respond-to($breakpoint-md) {
      align-items: center;
      padding-top: $spacing-xl;
    }
  }
}

.detail-panel {
  position: relative;
  width: 100%;
  max-width: 52rem;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--surface-color);
  border-radius: $radius-xl;
  box-shadow: var(--shadow-lg);
  padding: $spacing-xl;
  animation: fade-in-scale 300ms $ease-out-expo both;

  @include respond-to($breakpoint-md) {
    padding: $spacing-2xl;
  }

  @include respond-to($breakpoint-lg) {
    max-width: 72rem;
  }

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

  // --- Loading ---
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
    width: 12rem;
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
    height: 4rem;
    width: 100%;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  // --- Error ---
  &__error {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-2xl;
    @include body-text;
  }

  &__error-btn {
    @include button-secondary;
    font-size: $font-size-sm;
  }

  // --- Layout ---
  &__layout {
    opacity: 0;
    transition: opacity 0.3s ease;

    &--visible {
      opacity: 1;
    }

    // Outer grid: info + sidebar side-by-side on desktop
    :deep(.bdc) {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-xl;

      @include respond-to($breakpoint-lg) {
        grid-template-columns: 1fr 20rem;
      }
    }

    // Info region: cover + text side-by-side on md+
    :deep(.bdc__info) {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-md;

      @include respond-to($breakpoint-md) {
        grid-template-columns: 14rem 1fr;
        gap: $spacing-xl;
      }

      @include respond-below($breakpoint-md) {
        justify-items: center;
        text-align: center;
      }
    }

    :deep(.bdc__cover-area) {
      @include respond-to($breakpoint-md) {
        grid-column: 1;
        grid-row: 1;
        align-self: start;
      }
    }

    :deep(.series-panel) {
      @include respond-to($breakpoint-md) {
        grid-column: 1;
        grid-row: 2;
        align-self: start;
      }
    }

    :deep(.bdc__header),
    :deep(.bdc__description),
    :deep(.bdc__moods),
    :deep(.bdc__content-warnings),
    :deep(.bdc__sources),
    :deep(.detail-panel__preview-actions) {
      @include respond-to($breakpoint-md) {
        grid-column: 2;
      }
    }

    // Sidebar: sticky on desktop with left border
    :deep(.bdc__sidebar) {
      @include respond-to($breakpoint-lg) {
        position: sticky;
        top: 0;
        align-self: start;
        padding-left: $spacing-xl;
        border-left: 1px solid var(--border-color-subtle);
      }
    }
  }

  // --- Cover (panel-specific with FLIP) ---
  &__cover-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    width: 12rem;

    @include respond-to($breakpoint-md) {
      width: 14rem;
    }
  }

  &__cover {
    position: relative;
    transform-origin: top left;

    :deep(.book-cover) {
      width: 100% !important;
    }

    &:hover .detail-panel__cover-change {
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

  &__full-page {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: var(--highlight-color);
    }
  }

  // --- Preview mode actions ---
  &__preview-actions {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid var(--border-color-subtle);
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
