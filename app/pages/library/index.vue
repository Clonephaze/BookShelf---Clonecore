<template>
  <div class="library">
    <h2 class="library__title">Your Library</h2>
    <p class="library__subtitle">Your book collection lives here — add books from Search.</p>

    <div v-if="shelves.length" class="library__shelves">
      <section v-for="shelf in shelves" :key="shelf.id" class="library__shelf">
        <div class="library__shelf-header">
          <h3 class="library__shelf-name">{{ shelf.name }}</h3>
        </div>
        <p class="library__empty">No books on this shelf yet.</p>
      </section>
    </div>

    <div v-else class="library__empty-state">
      <p>Your shelves will appear here once your account is set up.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Library — Bookshelf' })

const { isAuthenticated } = useAuth()

interface Shelf {
  id: string
  name: string
  slug: string
}

const shelves = ref<Shelf[]>([])

async function fetchShelves() {
  if (!isAuthenticated.value) return
  try {
    shelves.value = await $fetch('/api/shelves')
  }
  catch {
    // Will show empty state
  }
}

watch(isAuthenticated, (val) => {
  if (val) fetchShelves()
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.library {
  @include container($library-max-width);

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-xs;
  }

  &__subtitle {
    @include body-text;
    margin-bottom: $spacing-2xl;
  }

  &__shelves {
    @include flex-column;
    gap: $spacing-2xl;
  }

  &__shelf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
  }

  &__shelf-name {
    @include heading($font-size-lg);
  }

  &__empty {
    @include meta-text;
    padding: $spacing-xl;
    text-align: center;
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    border: 1px dashed var(--border-color);
  }

  &__empty-state {
    @include flex-center;
    min-height: 40vh;
    @include body-text;
    text-align: center;
  }
}
</style>
