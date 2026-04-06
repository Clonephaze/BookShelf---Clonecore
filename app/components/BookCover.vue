<script setup lang="ts">
const props = defineProps<{
  src?: string
  title: string
  author: string
  width?: string
}>()

const loaded = ref(false)
const error = ref(false)
const hdSrc = ref<string | null>(null)

/** The actual src to render — HD upgrade if available, otherwise original */
const displaySrc = computed(() => hdSrc.value || props.src)

function onLoad(e: Event) {
  const img = e.target as HTMLImageElement

  // Detect Google Books "image not available" placeholder (575×750)
  if (img.naturalWidth === 575 && img.naturalHeight === 750) {
    error.value = true
    return
  }

  loaded.value = true
}

function onError() {
  error.value = true
}

/**
 * Progressive enhancement: if the src is a Google Books zoom=1 thumbnail,
 * try loading zoom=3 in the background. If it loads and isn't the
 * "image not available" placeholder, swap it in for a sharper cover.
 */
watchEffect(() => {
  const src = props.src
  if (!src?.includes('books.google.com')) return
  if (src.includes('zoom=3')) return // already HD

  const zoom3Url = src.replace(/zoom=\d/, 'zoom=3')
  if (zoom3Url === src) return

  const img = new Image()
  img.onload = () => {
    // Google's placeholder is exactly 575×750
    if (img.naturalWidth !== 575 || img.naturalHeight !== 750) {
      hdSrc.value = zoom3Url
    }
  }
  // If zoom=3 fails, we just keep the zoom=1 baseline — no action needed
  img.src = zoom3Url
})
</script>

<template>
  <div
    class="book-cover"
    :style="{ width: props.width || '8rem' }"
  >
    <img
      v-if="displaySrc && !error"
      :src="displaySrc"
      :alt="`Cover of ${title}`"
      class="book-cover__image"
      :class="{ 'book-cover__image--loaded': loaded }"
      loading="lazy"
      width="160"
      height="240"
      @load="onLoad"
      @error="onError"
    >
    <div
      v-if="!displaySrc || error || !loaded"
      class="book-cover__placeholder"
      :class="{ 'book-cover__placeholder--behind': displaySrc && !error }"
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
