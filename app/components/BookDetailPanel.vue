<script setup lang="ts">
const props = defineProps<{
  userBookId: string
  sourceEl?: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

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
const panelEl = ref<HTMLElement>()
const coverEl = ref<HTMLElement>()
const showContent = ref(false)

// Shelf actions
const shelvesStore = useShelvesStore()
const showShelfPicker = ref(false)
const movingShelf = ref(false)
const confirmingRemove = ref(false)
const removing = ref(false)

const progressWidth = computed(() => {
  if (book.value?.progressPercent) return `${parseFloat(book.value.progressPercent)}%`
  if (book.value?.currentPage && book.value?.pageCount) {
    return `${Math.round((book.value.currentPage / book.value.pageCount) * 100)}%`
  }
  return '0%'
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
    book.value = await $fetch<BookDetail>(`/api/books/${props.userBookId}`)
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
    nextTick(() => {
      showContent.value = true
    })
  }
}

async function moveToShelf(shelfId: string) {
  movingShelf.value = true
  showShelfPicker.value = false
  try {
    await $fetch(`/api/books/${props.userBookId}/shelf`, {
      method: 'PATCH',
      body: { shelfId },
    })
    await fetchBook()
  }
  catch {
    // Could show a toast
  }
  finally {
    movingShelf.value = false
  }
}

async function removeBook() {
  removing.value = true
  try {
    await $fetch(`/api/books/${props.userBookId}`, { method: 'DELETE' })
    useLibraryStore().invalidate()
    emit('close')
  }
  catch {
    removing.value = false
    confirmingRemove.value = false
  }
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
  fetchBook()
  shelvesStore.fetch()

  // Trigger FLIP after cover is rendered
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
          <button class="detail-panel__error-btn" @click="fetchBook">
            Try again
          </button>
        </div>

        <!-- Content -->
        <template v-else-if="book">
          <div class="detail-panel__layout" :class="{ 'detail-panel__layout--visible': showContent }">
            <!-- Cover with FLIP animation target -->
            <div ref="coverEl" class="detail-panel__cover">
              <BookCover
                :src="book.coverUrl ?? undefined"
                :title="book.title"
                :author="book.author"
                width="100%"
              />
            </div>

            <!-- Details -->
            <div class="detail-panel__details">
              <h2 class="detail-panel__title">{{ book.title }}</h2>
              <p class="detail-panel__author">
                {{ book.author }}
                <template v-if="book.additionalAuthors?.length">
                  <span
                    v-for="a in book.additionalAuthors"
                    :key="a"
                    class="detail-panel__coauthor"
                  >, {{ a }}</span>
                </template>
              </p>

              <!-- Shelf badges -->
              <div v-if="book.shelves?.length" class="detail-panel__shelves">
                <span
                  v-for="s in book.shelves"
                  :key="s.shelfId"
                  class="detail-panel__shelf-badge"
                >{{ s.shelfName }}</span>
              </div>

              <!-- Meta -->
              <div class="detail-panel__meta">
                <div v-if="book.publishedDate" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Published</span>
                  <span>{{ book.publishedDate }}</span>
                </div>
                <div v-if="book.pageCount" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Pages</span>
                  <span>{{ book.pageCount }}</span>
                </div>
                <div v-if="book.publisher" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">Publisher</span>
                  <span>{{ book.publisher }}</span>
                </div>
                <div v-if="book.isbn13" class="detail-panel__meta-item">
                  <span class="detail-panel__meta-label">ISBN</span>
                  <span class="detail-panel__isbn">{{ book.isbn13 }}</span>
                </div>
              </div>

              <!-- Genres -->
              <div v-if="book.genres?.length" class="detail-panel__genres">
                <span
                  v-for="genre in book.genres"
                  :key="genre"
                  class="detail-panel__genre-tag"
                >{{ genre }}</span>
              </div>

              <!-- Description -->
              <p v-if="book.description" class="detail-panel__description">
                {{ book.description }}
              </p>

              <!-- Reading progress -->
              <div v-if="book.currentPage || book.progressPercent" class="detail-panel__progress">
                <div class="detail-panel__progress-bar">
                  <div
                    class="detail-panel__progress-fill"
                    :style="{ width: progressWidth }"
                  />
                </div>
                <span class="detail-panel__progress-text">
                  <template v-if="book.currentPage && book.pageCount">
                    Page {{ book.currentPage }} of {{ book.pageCount }}
                  </template>
                </span>
              </div>

              <!-- Rating -->
              <div v-if="book.rating" class="detail-panel__rating">
                <span
                  v-for="star in 5"
                  :key="star"
                  class="detail-panel__star"
                  :class="{ 'detail-panel__star--filled': star <= (book.rating ?? 0) }"
                >★</span>
              </div>

              <!-- Dates -->
              <div class="detail-panel__dates">
                <span class="detail-panel__date">
                  Added {{ formatDate(book.dateAdded) }}
                </span>
                <span v-if="book.dateFinished" class="detail-panel__date">
                  Finished {{ formatDate(book.dateFinished) }}
                </span>
              </div>

              <!-- Actions -->
              <div class="detail-panel__actions">
                <button
                  v-if="!showShelfPicker"
                  class="detail-panel__action-btn"
                  @click="showShelfPicker = true"
                >
                  Move to shelf
                </button>
                <div v-else class="detail-panel__shelf-picker">
                  <button
                    v-for="shelf in shelvesStore.shelves"
                    :key="shelf.id"
                    class="detail-panel__shelf-option"
                    :disabled="movingShelf"
                    @click="moveToShelf(shelf.id)"
                  >{{ shelf.name }}</button>
                  <button
                    class="detail-panel__shelf-cancel"
                    @click="showShelfPicker = false"
                  >Cancel</button>
                </div>

                <button
                  v-if="!confirmingRemove"
                  class="detail-panel__remove-btn"
                  @click="confirmingRemove = true"
                >
                  Remove from library
                </button>
                <div v-else class="detail-panel__remove-confirm">
                  <span class="detail-panel__remove-warning">Remove this book?</span>
                  <button
                    class="detail-panel__remove-yes"
                    :disabled="removing"
                    @click="removeBook"
                  >Yes, remove</button>
                  <button
                    class="detail-panel__remove-no"
                    @click="confirmingRemove = false"
                  >Cancel</button>
                </div>
              </div>

              <!-- Source links -->
              <div
                v-if="book.openLibraryKey || book.googleBooksId || book.isbn13"
                class="detail-panel__sources"
              >
                <span class="detail-panel__sources-label">Find this book:</span>
                <a
                  v-if="book.openLibraryKey"
                  :href="`https://openlibrary.org${book.openLibraryKey}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-panel__source-link"
                >Open Library</a>
                <a
                  v-if="book.googleBooksId"
                  :href="`https://books.google.com/books?id=${book.googleBooksId}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-panel__source-link"
                >Google Books</a>
                <a
                  v-if="book.isbn13 || book.isbn10"
                  :href="`https://www.goodreads.com/search?q=${book.isbn13 || book.isbn10}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-panel__source-link"
                >Goodreads</a>
              </div>

              <!-- View full page link -->
              <NuxtLink
                :to="`/library/book/${userBookId}`"
                class="detail-panel__full-page"
                @click="$emit('close')"
              >
                View full page →
              </NuxtLink>
            </div>
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
    display: flex;
    gap: $spacing-xl;
    opacity: 0;
    transition: opacity 0.3s ease;

    &--visible {
      opacity: 1;
    }

    @include respond-below($breakpoint-md) {
      flex-direction: column;
      align-items: center;
    }
  }

  // --- Cover ---
  &__cover {
    flex-shrink: 0;
    width: 12rem;
    transform-origin: top left;

    @include respond-to($breakpoint-md) {
      width: 14rem;
    }

    :deep(.book-cover) {
      width: 100% !important;
    }
  }

  // --- Details ---
  &__details {
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
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.2;

    @include respond-to($breakpoint-md) {
      font-size: $font-size-2xl;
    }
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

  // --- Progress ---
  &__progress {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__progress-bar {
    height: 4px;
    background: var(--sub-bg-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: $radius-full;
    transition: width $transition-base;
  }

  &__progress-text {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  // --- Rating ---
  &__rating {
    display: flex;
    gap: 2px;
  }

  &__star {
    font-size: $font-size-base;
    color: var(--border-color);
    line-height: 1;

    &--filled {
      color: var(--rating-color);
    }
  }

  // --- Dates ---
  &__dates {
    display: flex;
    gap: $spacing-md;
  }

  &__date {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
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

    &:hover {
      text-decoration: underline;
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
}
</style>
