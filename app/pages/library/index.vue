<template>
  <div class="library">
    <div v-if="isGuest" class="library__guest-banner">
      <p class="library__guest-banner-text">
        You're browsing as a guest — your data won't be saved.
      </p>
      <div class="library__guest-banner-actions">
        <NuxtLink to="/signup" class="library__guest-cta">Create account</NuxtLink>
        <NuxtLink to="/login" class="library__guest-cta library__guest-cta--secondary">Sign in</NuxtLink>
      </div>
    </div>

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
      <p v-if="isGuest">Sign up to create shelves and start tracking your reading.</p>
      <p v-else>Your shelves will appear here once your account is set up.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Library — Bookshelf' })

const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()

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

  &__guest-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    margin-bottom: $spacing-xl;
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    border-left: 4px solid var(--color-highlight);
  }

  &__guest-banner-text {
    @include body-text;
    color: var(--text-color-secondary);
  }

  &__guest-banner-actions {
    display: flex;
    gap: $spacing-sm;
    flex-shrink: 0;
  }

  &__guest-cta {
    @include button-primary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    text-decoration: none;

    &--secondary {
      @include button-secondary;
      font-size: $font-size-sm;
      padding: $spacing-xs $spacing-md;
    }
  }

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
