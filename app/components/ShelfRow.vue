<script setup lang="ts">
import type { ShelfBook } from '~/stores/library'

const props = withDefaults(defineProps<{
  name: string
  slug: string
  bookCount: number
  books: ShelfBook[]
  isDefault?: boolean
  showHeader?: boolean
}>(), {
  showHeader: true,
})

const emit = defineEmits<{
  openBook: [userBookId: string, el: HTMLElement]
}>()

const trackEl = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// The turn zone starts this fraction from the right edge of the visible track
const TURN_START_FRACTION = 0.35
// The transition from cover→spine takes this fraction of the visible track
const TRANSITION_FRACTION = 0.15
// Remaining right portion after transition is fully-spined books
let rafId: number | null = null

// --- Scroll state ---

function updateScrollState() {
  const el = trackEl.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 10
  // scrollWidth is now stable because updateEndPadding sets a pixel min-width
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scrollBy(direction: 'left' | 'right') {
  const el = trackEl.value
  if (!el) return
  // Scroll by the width of the flat (non-turn) zone so one press reveals
  // a full new set of cover-facing books.
  const distance = el.clientWidth * (1 - TURN_START_FRACTION)
  el.scrollBy({
    left: direction === 'left' ? -distance : distance,
    behavior: 'smooth',
  })
}

// --- Scroll-driven rotation: set --turn on each book ---

function updateBookTurns() {
  const el = trackEl.value
  if (!el) return

  const trackRect = el.getBoundingClientRect()
  const trackRight = trackRect.right
  const trackWidth = trackRect.width

  // Transition starts here (rightmost 35% of visible area)
  const turnStart = trackRight - trackWidth * TURN_START_FRACTION
  // Transition ends here — books beyond are fully spined
  const turnEnd = turnStart + trackWidth * TRANSITION_FRACTION

  const bookEls = el.querySelectorAll<HTMLElement>('[data-book-id]')

  for (const bookEl of bookEls) {
    const rect = bookEl.getBoundingClientRect()
    const centerX = (rect.left + rect.right) / 2

    let turn: number

    if (centerX <= turnStart) {
      // Main area — flat, cover facing
      turn = 0
    } else if (centerX <= turnEnd) {
      // Transition zone — gradually rotate to spine
      turn = (centerX - turnStart) / (turnEnd - turnStart)
    } else {
      // Past transition — fully spined
      turn = 1
    }

    turn = Math.round(Math.min(1, Math.max(0, turn)) * 1000) / 1000
    bookEl.style.setProperty('--turn', String(turn))
  }
}

function updateEndPadding() {
  const el = trackEl.value
  if (!el) return
  const booksEl = el.querySelector<HTMLElement>('.shelf-row__books')
  if (!booksEl) return

  const bookEls = el.querySelectorAll<HTMLElement>('[data-book-id]')
  const bookCount = bookEls.length

  if (bookCount === 0) {
    booksEl.style.minWidth = ''
    return
  }

  // Measure one book's full cover width from the inner __box which always
  // keeps width: var(--bw), unaffected by the --turn-driven collapse.
  const firstBox = bookEls[0]?.querySelector<HTMLElement>('.book-on-shelf__box')
  const coverWidth = firstBox ? firstBox.offsetWidth : 0
  if (coverWidth === 0) return

  const styles = getComputedStyle(booksEl)
  const gap = parseFloat(styles.columnGap) || 0
  const padLeft = parseFloat(styles.paddingLeft) || 0
  const naturalWidth = padLeft + coverWidth * bookCount + gap * Math.max(0, bookCount - 1)

  if (naturalWidth > el.clientWidth) {
    // Lock min-width in pixels so scrollWidth stays stable even when --turn
    // collapses individual book widths. The extra 35% of viewport gives room
    // to scroll the last books fully into the flat cover zone.
    const turnPadding = el.clientWidth * TURN_START_FRACTION
    booksEl.style.minWidth = `${naturalWidth + turnPadding}px`
  } else {
    booksEl.style.minWidth = ''
  }
}

function onTrackScroll() {
  updateScrollState()
  if (rafId != null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    updateBookTurns()
  })
}

function onTrackWheel(event: WheelEvent) {
  const el = trackEl.value
  if (!el) return
  // Only intercept vertical wheel when the track is scrollable horizontally
  if (el.scrollWidth <= el.clientWidth) return
  if (event.deltaY === 0) return
  event.preventDefault()
  el.scrollLeft += event.deltaY
}

function handleBookOpen(userBookId: string, el: HTMLElement) {
  emit('openBook', userBookId, el)
}

// Lifecycle
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateEndPadding()
  updateScrollState()
  updateBookTurns()
  requestAnimationFrame(() => {
    updateBookTurns()
    updateScrollState()
  })

  // Recalculate on container resize (window resize, layout shift)
  if (trackEl.value) {
    resizeObserver = new ResizeObserver(() => {
      updateEndPadding()
      updateBookTurns()
      updateScrollState()
    })
    resizeObserver.observe(trackEl.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (rafId != null) cancelAnimationFrame(rafId)
})

// Re-calculate when books change
watch(() => props.books.length, () => {
  nextTick(() => {
    updateEndPadding()
    updateBookTurns()
    updateScrollState()
  })
})
</script>

<template>
  <section class="shelf-row">
    <div v-if="showHeader" class="shelf-row__header">
      <NuxtLink :to="`/library/${slug}`" class="shelf-row__name-link">
        <h3 class="shelf-row__name">
          {{ name }}
          <span class="shelf-row__count">{{ bookCount }}</span>
        </h3>
      </NuxtLink>
      <NuxtLink
        v-if="bookCount > 0"
        :to="`/library/${slug}`"
        class="shelf-row__view-all"
      >
        View all
      </NuxtLink>
    </div>

    <div v-if="books.length" class="shelf-row__container">
      <!-- Left scroll arrow -->
      <button
        class="shelf-row__arrow shelf-row__arrow--left"
        :class="{ 'shelf-row__arrow--visible': canScrollLeft }"
        aria-label="Scroll left"
        @click="scrollBy('left')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <!-- Scrollable track -->
      <div
        ref="trackEl"
        class="shelf-row__track"
        @scroll.passive="onTrackScroll"
        @wheel="onTrackWheel"
      >
        <div class="shelf-row__books">
          <BookOnShelf
            v-for="book in books"
            :key="book.userBookId"
            v-bind="book"
            :data-book-id="book.userBookId"
            @open="handleBookOpen"
          />
        </div>
      </div>

      <!-- Shelf surface (the physical plank — outside scroll container) -->
      <div class="shelf-row__surface" />

      <!-- Right scroll arrow -->
      <button
        class="shelf-row__arrow shelf-row__arrow--right"
        :class="{ 'shelf-row__arrow--visible': canScrollRight }"
        aria-label="Scroll right"
        @click="scrollBy('right')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    <!-- Empty shelf -->
    <div v-else class="shelf-row__empty">
      <div class="shelf-row__empty-shelf">
        <p class="shelf-row__empty-text">No books on this shelf yet</p>
        <NuxtLink to="/search" class="shelf-row__search-link">Find books</NuxtLink>
      </div>
      <div class="shelf-row__surface" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.shelf-row {
  &__header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
    padding: 0 $spacing-xs;
  }

  &__name-link {
    text-decoration: none;
  }

  &__name {
    @include heading($font-size-lg);
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    transition: color $transition-fast;

    .shelf-row__name-link:hover & {
      color: var(--highlight-color);
    }
  }

  &__count {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    background: var(--sub-bg-color);
    padding: 2px $spacing-sm;
    border-radius: $radius-full;
  }

  &__view-all {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--highlight-color);
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: var(--highlight-color-hover);
    }
  }

  // --- Scroll container ---
  &__container {
    position: relative;
  }

  &__track {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0;

    // Hide scrollbar but keep functionality
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &__books {
    display: flex;
    align-items: flex-end;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-sm 0;
    min-width: min-content;

    // :deep(.book-on-shelf) {
      // scroll-snap-align: start;
    // }
  }

  // --- Shelf surface (the plank) ---
  &__surface {
    position: relative;
    height: 14px;
    background: linear-gradient(
      180deg,
      hsl(30, 18%, 38%) 0%,
      hsl(30, 20%, 30%) 30%,
      hsl(30, 22%, 22%) 100%
    );
    border-radius: 0 0 3px 3px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.2),
      0 8px 16px -4px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);

    // Wood grain hint
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        transparent 0px,
        transparent 40px,
        rgba(0, 0, 0, 0.04) 40px,
        rgba(0, 0, 0, 0.04) 41px
      );
      border-radius: inherit;
    }

    // Front lip highlight
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.06),
        rgba(255, 255, 255, 0.12),
        rgba(255, 255, 255, 0.06)
      );
      border-radius: 3px 3px 0 0;
    }
  }

  // --- Scroll arrows (hidden on touch-only devices) ---
  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-60%);
    z-index: 10;
    display: none;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    color: var(--text-color);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-full;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: background-color $transition-fast, box-shadow $transition-fast, opacity $transition-base;
    opacity: 0;
    pointer-events: none;

    // Only show on devices with a pointer (not touch-only)
    @media (hover: hover) and (pointer: fine) {
      display: flex;
    }

    &--visible {
      opacity: 0.9;
      pointer-events: auto;
    }

    &--visible:hover {
      background: var(--sub-bg-color);
      box-shadow: var(--shadow-lg);
      opacity: 1;
    }

    &--left {
      left: -$spacing-sm;
    }

    &--right {
      right: -$spacing-sm;
    }
  }

  // --- Empty state ---
  &__empty {
    position: relative;
  }

  &__empty-shelf {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xl $spacing-lg;
    text-align: center;
  }

  &__empty-text {
    @include meta-text;
  }

  &__search-link {
    font-size: $font-size-sm;
    color: var(--highlight-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
