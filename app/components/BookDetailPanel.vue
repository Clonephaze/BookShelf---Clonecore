<script setup lang="ts">
const props = defineProps<{
  userBookId: string
  sourceEl?: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

const detail = useBookDetail(computed(() => props.userBookId))
const { loading, error, book, fetchBook, shelvesStore } = detail

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
  fetchBookAndShow()
  shelvesStore.fetch()

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
              :detail="detail"
              :user-book-id="userBookId"
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
                      class="detail-panel__cover-change"
                      aria-label="Change cover"
                      @click="detail.showCoverPicker.value = !detail.showCoverPicker.value"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </button>
                  </div>
                  <CoverPicker
                    v-if="detail.showCoverPicker.value"
                    :user-book-id="userBookId"
                    @updated="detail.onCoverUpdated"
                    @close="detail.showCoverPicker.value = false"
                  />
                </div>
              </template>

              <template #after-header>
                <NuxtLink
                  :to="`/library/book/${userBookId}`"
                  class="detail-panel__full-page"
                  @click="$emit('close')"
                >
                  View full page →
                </NuxtLink>
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

    :deep(.bdc) {
      display: grid;
      grid-template-columns: 12rem 1fr;
      gap: $spacing-xl;

      @include respond-to($breakpoint-md) {
        grid-template-columns: 14rem 1fr;
      }

      @include respond-below($breakpoint-md) {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
      }
    }

    :deep(.bdc__cover-area) {
      grid-row: 1;
      grid-column: 1;
    }

    :deep(.bdc__header),
    :deep(.bdc__description),
    :deep(.bdc__progress),
    :deep(.bdc__rating-row),
    :deep(.bdc__notes-row),
    :deep(.bdc__dates-row),
    :deep(.bdc__actions),
    :deep(.bdc__sources) {
      grid-column: 1 / -1;

      @include respond-to($breakpoint-md) {
        grid-column: 2;
      }
    }

    :deep(.bdc__header) {
      grid-row: 1;

      @include respond-below($breakpoint-md) {
        grid-row: auto;
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
    grid-column: 1 / -1;
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
