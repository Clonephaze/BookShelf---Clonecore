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

    <div class="library__header">
      <div>
        <h2 class="library__title">Your Library</h2>
        <p class="library__subtitle">Your book collection lives here — add books from Search.</p>
      </div>
      <button
        v-if="isAuthenticated && !isGuest"
        class="library__new-shelf-btn"
        @click="showNewShelf = true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        New shelf
      </button>
    </div>

    <!-- New shelf form -->
    <div v-if="showNewShelf" class="library__new-shelf animate-fade-in-scale">
      <input
        ref="newShelfInput"
        v-model="newShelfName"
        type="text"
        class="library__new-shelf-input"
        placeholder="Shelf name..."
        maxlength="50"
        @keydown.enter="createShelf"
        @keydown.escape="showNewShelf = false"
      >
      <button
        class="library__new-shelf-save"
        :disabled="!newShelfName.trim() || creatingShelf"
        @click="createShelf"
      >
        Create
      </button>
      <button class="library__new-shelf-cancel" @click="showNewShelf = false">
        Cancel
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="libraryStore.loading && !libraryStore.loaded" class="library__loading">
      <div v-for="n in 3" :key="n" class="library__skeleton-section">
        <div class="library__skeleton-heading" />
        <div class="library__skeleton-grid">
          <div v-for="m in 5" :key="m" class="library__skeleton-book" />
        </div>
      </div>
    </div>

    <!-- Shelves with books -->
    <div v-else-if="libraryStore.data.length" class="library__shelves">
      <section
        v-for="shelf in libraryStore.data"
        :key="shelf.id"
        class="library__shelf animate-fade-in-up"
      >
        <div class="library__shelf-header">
          <NuxtLink
            :to="`/library/${shelf.slug}`"
            class="library__shelf-name-link"
          >
            <h3 class="library__shelf-name">
              {{ shelf.name }}
              <span class="library__shelf-count">{{ shelf.bookCount }}</span>
            </h3>
          </NuxtLink>
          <div class="library__shelf-actions">
            <button
              v-if="!shelf.isDefault && confirmDeleteShelf !== shelf.id"
              class="library__shelf-delete-btn"
              aria-label="Delete shelf"
              @click="confirmDeleteShelf = shelf.id"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
            <div v-if="confirmDeleteShelf === shelf.id" class="library__shelf-delete-confirm">
              <span class="library__shelf-delete-warning">Delete shelf?</span>
              <button
                class="library__shelf-delete-yes"
                :disabled="deletingShelf"
                @click="deleteShelf(shelf.id)"
              >
                Yes
              </button>
              <button
                class="library__shelf-delete-no"
                @click="confirmDeleteShelf = null"
              >
                No
              </button>
            </div>
            <NuxtLink
              v-if="shelf.bookCount > 0"
              :to="`/library/${shelf.slug}`"
              class="library__view-all"
            >
              View all
            </NuxtLink>
          </div>
        </div>

        <BookGrid
          v-if="shelf.books.length"
          :books="shelf.books.slice(0, 8)"
          @open="openBook"
        />
        <div v-else class="library__empty">
          <p>No books on this shelf yet.</p>
          <NuxtLink to="/search" class="library__search-link">Search for books</NuxtLink>
        </div>
      </section>
    </div>

    <div v-else class="library__empty-state">
      <div class="library__empty-state-content">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="library__empty-icon"
          aria-hidden="true"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
        </svg>
        <p v-if="isGuest">Sign up to create shelves and start tracking your reading.</p>
        <p v-else>Your library is empty — find your next read in Search.</p>
        <NuxtLink to="/search" class="library__empty-cta">Search for books</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Library — Bookshelf' })

const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()

const libraryStore = useLibraryStore()
const shelvesStore = useShelvesStore()

const showNewShelf = ref(false)
const newShelfName = ref('')
const creatingShelf = ref(false)
const newShelfInput = ref<HTMLInputElement>()
const confirmDeleteShelf = ref<string | null>(null)
const deletingShelf = ref(false)

async function createShelf() {
  const name = newShelfName.value.trim()
  if (!name) return
  creatingShelf.value = true
  try {
    await $fetch('/api/shelves', {
      method: 'POST',
      body: { name },
    })
    newShelfName.value = ''
    showNewShelf.value = false
    await shelvesStore.invalidate()
    await libraryStore.invalidate()
  }
  catch {
    // Could show error
  }
  finally {
    creatingShelf.value = false
  }
}

function openBook(userBookId: string) {
  navigateTo(`/library/book/${userBookId}`)
}

async function deleteShelf(shelfId: string) {
  deletingShelf.value = true
  try {
    await $fetch(`/api/shelves/${shelfId}`, { method: 'DELETE' })
    confirmDeleteShelf.value = null
    await shelvesStore.invalidate()
    await libraryStore.invalidate()
  }
  catch {
    // Could show error
  }
  finally {
    deletingShelf.value = false
  }
}

watch(showNewShelf, (val) => {
  if (val) {
    nextTick(() => newShelfInput.value?.focus())
  }
})

watch(isAuthenticated, (val) => {
  if (val) libraryStore.fetch()
}, { immediate: true })

onMounted(() => {
  if (isAuthenticated.value) libraryStore.revalidate()
})
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
    border-left: 4px solid var(--highlight-color);
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

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-2xl;
  }

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-xs;
  }

  &__subtitle {
    @include body-text;
  }

  &__new-shelf-btn {
    @include button-secondary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    gap: $spacing-xs;
  }

  // --- New shelf form ---
  &__new-shelf {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;
    padding: $spacing-md;
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    border: 1px solid var(--border-color);
  }

  &__new-shelf-input {
    flex: 1;
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-base;
    color: var(--text-color);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;

    &::placeholder {
      color: var(--text-color-muted);
    }

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__new-shelf-save {
    @include button-primary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  &__new-shelf-cancel {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;

    &:hover {
      color: var(--text-color);
    }
  }

  // --- Loading skeleton ---
  &__loading {
    @include flex-column;
    gap: $spacing-2xl;
  }

  &__skeleton-section {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  &__skeleton-heading {
    height: 1.5rem;
    width: 10rem;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
    margin-bottom: $spacing-md;
  }

  &__skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: $spacing-lg;
  }

  &__skeleton-book {
    aspect-ratio: 2 / 3;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  // --- Shelves ---
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

  &__shelf-name-link {
    text-decoration: none;
  }

  &__shelf-name {
    @include heading($font-size-lg);
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    transition: color $transition-fast;

    .library__shelf-name-link:hover & {
      color: var(--highlight-color);
    }
  }

  &__shelf-count {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    background: var(--sub-bg-color);
    padding: 2px $spacing-sm;
    border-radius: $radius-full;
  }

  &__shelf-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__shelf-delete-btn {
    @include flex-center;
    width: 1.75rem;
    height: 1.75rem;
    color: var(--text-color-muted);
    background: none;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    opacity: 0;
    transition: opacity $transition-fast, color $transition-fast, background-color $transition-fast;

    .library__shelf:hover & {
      opacity: 1;
    }

    &:hover {
      color: var(--error-color);
      background: var(--sub-bg-color);
    }
  }

  &__shelf-delete-confirm {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    animation: fade-in-scale 150ms $ease-out-expo both;
  }

  &__shelf-delete-warning {
    font-size: $font-size-sm;
    color: var(--error-color);
    font-weight: $font-weight-medium;
  }

  &__shelf-delete-yes {
    padding: 2px $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: #fff;
    background: var(--error-color);
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;

    &:hover { opacity: 0.85; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__shelf-delete-no {
    padding: 2px $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;

    &:hover { color: var(--text-color); }
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

  &__empty {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-sm;
    @include meta-text;
    padding: $spacing-xl;
    text-align: center;
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    border: 1px dashed var(--border-color);
  }

  &__search-link {
    font-size: $font-size-sm;
    color: var(--highlight-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__empty-state {
    @include flex-center;
    min-height: 40vh;
  }

  &__empty-state-content {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }

  &__empty-icon {
    color: var(--text-color-muted);
    opacity: 0.5;
  }

  &__empty-cta {
    @include button-primary;
    text-decoration: none;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }
}
</style>
