<script setup lang="ts">
interface LibraryBook {
  userBookId: string
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  coverUrlSmall?: string | null
  rating?: number | null
  dateAdded?: string | null
  progressPercent?: string | null
}

defineProps<{
  books: LibraryBook[]
}>()

const emit = defineEmits<{
  'open': [userBookId: string]
}>()
</script>

<template>
  <div v-if="books.length" class="book-grid">
    <BookCard
      v-for="(book, i) in books"
      :key="book.userBookId"
      v-bind="book"
      class="book-grid__item animate-fade-in-up stagger-item"
      :style="{ '--stagger-index': i }"
      @open="emit('open', $event)"
    />
  </div>
  <div v-else class="book-grid__empty">
    <slot name="empty">
      <p class="book-grid__empty-text">No books yet</p>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: $spacing-lg;

  @include respond-to($breakpoint-md) {
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: $spacing-xl;
  }

  @include respond-to($breakpoint-xl) {
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  }

  &__empty {
    @include flex-center;
    min-height: 12rem;
    padding: $spacing-xl;
    text-align: center;
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    border: 1px dashed var(--border-color);
  }

  &__empty-text {
    @include meta-text;
  }
}
</style>
