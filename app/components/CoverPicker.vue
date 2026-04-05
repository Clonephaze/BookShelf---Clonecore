<script setup lang="ts">
const props = defineProps<{
  userBookId: string
}>()

const emit = defineEmits<{
  updated: [coverUrl: string]
  close: []
}>()

interface CoverOption {
  url: string
  source: string
  label: string
}

const loading = ref(true)
const covers = ref<CoverOption[]>([])
const selecting = ref<string | null>(null)
const toast = useToast()

async function fetchCovers() {
  loading.value = true
  try {
    covers.value = await $fetch<CoverOption[]>(`/api/books/${props.userBookId}/covers`)
  }
  catch {
    toast.error('Could not load cover options')
  }
  finally {
    loading.value = false
  }
}

async function selectCover(cover: CoverOption) {
  if (cover.source === 'current') return
  selecting.value = cover.url
  try {
    await $fetch(`/api/books/${props.userBookId}/cover`, {
      method: 'PATCH',
      body: { coverUrl: cover.url },
    })
    toast.success('Cover updated')
    useLibraryStore().invalidate()
    emit('updated', cover.url)
  }
  catch {
    toast.error('Could not update cover')
  }
  finally {
    selecting.value = null
  }
}

// Track broken images to hide them
const brokenImages = ref(new Set<string>())
function onImageError(url: string) {
  brokenImages.value.add(url)
}

const visibleCovers = computed(() =>
  covers.value.filter(c => !brokenImages.value.has(c.url)),
)

onMounted(fetchCovers)
</script>

<template>
  <div class="cover-picker" role="dialog" aria-label="Choose a cover">
    <div class="cover-picker__header">
      <span class="cover-picker__title">Choose a cover</span>
      <button class="cover-picker__close" aria-label="Close" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <div v-if="loading" class="cover-picker__loading">
      <div v-for="i in 4" :key="i" class="cover-picker__skeleton" />
    </div>

    <div v-else-if="visibleCovers.length === 0" class="cover-picker__empty">
      No alternative covers found.
    </div>

    <div v-else class="cover-picker__grid">
      <button
        v-for="cover in visibleCovers"
        :key="cover.url"
        class="cover-picker__option"
        :class="{
          'cover-picker__option--current': cover.source === 'current',
          'cover-picker__option--selecting': selecting === cover.url,
        }"
        :disabled="!!selecting || cover.source === 'current'"
        :aria-label="cover.label"
        @click="selectCover(cover)"
      >
        <img
          :src="cover.url"
          :alt="cover.label"
          class="cover-picker__img"
          loading="lazy"
          @error="onImageError(cover.url)"
        >
        <span class="cover-picker__label">{{ cover.source === 'current' ? 'Current' : cover.source === 'openlibrary' ? 'Open Library' : 'Google' }}</span>
        <span v-if="selecting === cover.url" class="cover-picker__spinner" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.cover-picker {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg);
  padding: $spacing-md;
  max-width: 28rem;
  width: 100%;
  animation: fade-in-scale 200ms $ease-out-expo both;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    color: var(--text-color-muted);
    background: none;
    border: none;
    border-radius: $radius-full;
    cursor: pointer;
    transition: color $transition-fast, background-color $transition-fast;
    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }
  }

  &__loading {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: $spacing-sm;
  }

  &__skeleton {
    aspect-ratio: 2 / 3;
    background: var(--sub-bg-color);
    border-radius: $radius-md;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  &__empty {
    padding: $spacing-lg;
    text-align: center;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: $spacing-sm;
    max-height: 20rem;
    overflow-y: auto;
  }

  &__option {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs;
    background: none;
    border: 2px solid transparent;
    border-radius: $radius-md;
    cursor: pointer;
    transition: border-color $transition-fast, opacity $transition-fast;

    &:hover:not(:disabled) {
      border-color: var(--highlight-color);
    }

    &--current {
      border-color: var(--highlight-color);
      opacity: 0.7;
      cursor: default;
    }

    &--selecting {
      opacity: 0.5;
    }

    &:disabled:not(.cover-picker__option--current) {
      opacity: 0.5;
      cursor: wait;
    }
  }

  &__img {
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
  }

  &__label {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-align: center;
    line-height: 1.2;
  }

  &__spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: $radius-md;
    &::after {
      content: '';
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
