<template>
  <TransitionGroup
    v-if="books.length"
    name="shelf-move"
    tag="div"
    class="shelf-grid"
    :class="{ 'shelf-grid--row': layout === 'row' }"
  >
    <BookOnShelf
      v-for="(book, i) in books"
      :key="book.userBookId"
      v-bind="book"
      :class="{ 'shelf-grid__book-arrive': layout === 'row' }"
      :style="{ '--turn': '0', '--stagger-index': i }"
      @open="(id, el) => emit('open', id, el)"
    />
  </TransitionGroup>
  <div v-else class="shelf-grid__empty">
    <p>{{ emptyMessage }}</p>
  </div>
</template>

<script setup lang="ts">
export interface ShelfGridBook {
  userBookId: string
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  coverUrlSmall?: string | null
  pageCount?: number | null
  rating?: number | null
  currentPage?: number | null
  progressPercent?: string | null
  totalMinutes?: number | null
  currentMinutes?: number | null
}

withDefaults(defineProps<{
  books: ShelfGridBook[]
  emptyMessage?: string
  layout?: 'grid' | 'row'
}>(), {
  emptyMessage: 'No books yet',
  layout: 'grid',
})

const emit = defineEmits<{
  open: [userBookId: string, el: HTMLElement]
}>()
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.shelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: $spacing-lg $spacing-md;
  padding: $spacing-md 0;

  @include respond-to($breakpoint-md) {
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  }

  @include respond-to($breakpoint-xl) {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  }

  &--row {
    display: flex;
    overflow-x: auto;
    gap: $spacing-md;
    padding: $spacing-md $spacing-xs;
    // Smooth momentum scrolling
    -webkit-overflow-scrolling: touch;
    // Hide scrollbar but keep functionality
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

  &__book-arrive {
    animation: book-arrive 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(var(--stagger-index, 0) * 60ms);
  }

  &__empty {
    @include flex-center;
    flex-direction: column;
    @include meta-text;
    padding: $spacing-2xl;
    text-align: center;
  }
}

@keyframes book-arrive {
  from {
    opacity: 0;
    transform: rotateY(-75deg) scale(0.9);
  }
  to {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
  }
}

// FLIP layout transition for sort/filter reflow
.shelf-move-move {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.shelf-move-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.shelf-move-leave-active {
  transition: opacity 0.2s ease;
  position: absolute;
}

.shelf-move-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.shelf-move-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .shelf-move-move,
  .shelf-move-enter-active,
  .shelf-move-leave-active {
    transition: none;
  }
}
</style>
