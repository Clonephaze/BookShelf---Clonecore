<script setup lang="ts">
const props = defineProps<{
  src?: string
  title: string
  author: string
  width?: string
}>()

const loaded = ref(false)
const error = ref(false)

function onLoad() {
  loaded.value = true
}

function onError() {
  error.value = true
}
</script>

<template>
  <div
    class="book-cover"
    :style="{ width: props.width || '8rem' }"
  >
    <img
      v-if="src && !error"
      :src="src"
      :alt="`Cover of ${title}`"
      class="book-cover__image"
      :class="{ 'book-cover__image--loaded': loaded }"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    >
    <div
      v-if="!src || error || !loaded"
      class="book-cover__placeholder"
      :class="{ 'book-cover__placeholder--behind': src && !error }"
    >
      <span class="book-cover__placeholder-title">{{ title }}</span>
      <span class="book-cover__placeholder-author">{{ author }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.book-cover {
  aspect-ratio: 2 / 3;
  border-radius: $radius-sm;
  box-shadow: var(--shadow-book);
  overflow: hidden;
  position: relative;
  background-color: var(--sub-bg-color);
  flex-shrink: 0;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 300ms ease;

    &--loaded {
      opacity: 1;
    }
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-sm;
    text-align: center;
    background: linear-gradient(
      145deg,
      var(--highlight-color-subtle) 0%,
      var(--sub-bg-color) 100%
    );
    gap: $spacing-xs;

    &--behind {
      z-index: -1;
    }
  }

  &__placeholder-title {
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    @include truncate(3);
  }

  &__placeholder-author {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    @include truncate(2);
  }
}
</style>
