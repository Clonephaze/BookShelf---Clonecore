<script setup lang="ts">
const props = defineProps<{
  userBookId: string
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  coverUrlSmall?: string | null
  rating?: number | null
  dateAdded?: string | null
  progressPercent?: string | null
}>()

const emit = defineEmits<{
  'open': [userBookId: string]
}>()

// Use small cover for cards, fall back to full cover
const coverSrc = computed(() => props.coverUrl || props.coverUrlSmall || undefined)

const { simpleShelfView } = useAppearance()

const isOpening = ref(false)

function handleClick() {
  if (simpleShelfView.value) {
    emit('open', props.userBookId)
    return
  }
  isOpening.value = true
  // Let the animation play, then navigate
  setTimeout(() => {
    emit('open', props.userBookId)
  }, 600)
}
</script>

<template>
  <button
    class="book-card"
    :class="{ 'book-card--opening': isOpening, 'book-card--simple': simpleShelfView }"
    type="button"
    :aria-label="`Open ${title} by ${author}`"
    @click="handleClick"
  >
    <div class="book-card__cover-wrapper">
      <!-- Spine -->
      <div class="book-card__spine" />
      <!-- Front cover (the part that flips) -->
      <div class="book-card__front">
        <BookCover
          :src="coverSrc"
          :title="title"
          :author="author"
          width="100%"
        />
      </div>
      <!-- Pages visible behind the cover -->
      <div class="book-card__pages">
        <div class="book-card__pages-lines" />
      </div>
    </div>

    <div class="book-card__info">
      <h4 class="book-card__title">{{ title }}</h4>
      <p class="book-card__author">{{ author }}</p>
      <div v-if="rating" class="book-card__rating">
        <span
          v-for="star in 5"
          :key="star"
          class="book-card__star"
          :class="{ 'book-card__star--filled': star <= rating }"
        >★</span>
      </div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.book-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;
  @include focus-visible-highlight;

  &:hover .book-card__cover-wrapper {
    transform: translateY(-4px);
  }

  &:hover .book-card__front {
    box-shadow: var(--shadow-lg);
  }

  &__cover-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    perspective: 900px;
    transition: transform 0.3s $ease-out-quart;
  }

  &__spine {
    position: absolute;
    left: 0;
    top: 2%;
    bottom: 2%;
    width: 12px;
    background: linear-gradient(
      90deg,
      var(--border-color) 0%,
      var(--sub-bg-color) 40%,
      var(--border-color) 100%
    );
    border-radius: 2px 0 0 2px;
    z-index: 1;
    transform-origin: left center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__front {
    position: absolute;
    inset: 0;
    border-radius: $radius-sm;
    overflow: hidden;
    box-shadow: var(--shadow-book);
    transform-origin: left center;
    transition: transform 0.6s $ease-out-expo, box-shadow 0.3s ease;
    z-index: 2;
    backface-visibility: hidden;

    // Make the BookCover fill this element
    :deep(.book-cover) {
      width: 100% !important;
      height: 100%;
      aspect-ratio: unset;
    }
  }

  &__pages {
    position: absolute;
    inset: 2%;
    left: 6px;
    background: #f5f0e8;
    border-radius: 0 $radius-sm $radius-sm 0;
    overflow: hidden;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__pages-lines {
    position: absolute;
    inset: 15% 20% 15% 10%;
    background: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 8px,
      #ddd8d0 8px,
      #ddd8d0 9px
    );
    opacity: 0.5;
  }

  // --- Opening animation ---
  &--opening &__spine {
    opacity: 1;
  }

  &--opening &__pages {
    opacity: 1;
  }

  &--opening &__front {
    transform: rotateY(-160deg);
    box-shadow: none;
  }

  &--opening &__cover-wrapper {
    transform: translateY(-4px);
  }

  // --- Simple mode (no 3D) ---
  &--simple &__cover-wrapper {
    perspective: none;
  }

  &--simple &__spine,
  &--simple &__pages {
    display: none;
  }

  &--simple &__front {
    transform: none !important;
    transition: box-shadow 0.2s ease;
  }

  &--simple#{&}--opening &__front {
    transform: none !important;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 2px;
  }

  &__title {
    font-family: var(--font-heading);
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    @include truncate(2);
    line-height: 1.3;
  }

  &__author {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    @include truncate;
  }

  &__rating {
    display: flex;
    gap: 1px;
    margin-top: 2px;
  }

  &__star {
    font-size: 0.7rem;
    color: var(--border-color);
    line-height: 1;

    &--filled {
      color: var(--rating-color);
    }
  }
}
</style>
