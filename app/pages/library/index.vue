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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        New shelf
      </button>
    </div>

    <!-- Library search -->
    <div v-if="libraryStore.loaded && libraryStore.data.length > 0" class="library__search">
      <SearchBar
        v-model="searchQuery"
        placeholder="Search your library..."
        @search="() => {}"
      />
      <p v-if="isFiltering" class="library__search-results">
        {{ totalMatches }} {{ totalMatches === 1 ? 'book' : 'books' }} matching "{{ searchQuery.trim() }}"
        <button class="library__search-clear" @click="clearSearch">Clear</button>
      </p>
    </div>

    <!-- Goal progress widget -->
    <GoalWidget v-if="isAuthenticated || isGuest" />

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
        <div class="library__skeleton-shelf">
          <div v-for="m in 12" :key="m" class="library__skeleton-book" />
        </div>
        <div class="library__skeleton-surface" />
      </div>
    </div>

    <!-- Shelves -->
    <div v-else-if="libraryStore.data.length" class="library__shelves">
      <template v-if="isFiltering && filteredShelves.length === 0">
        <div class="library__search-empty">
          <p>No books match "{{ searchQuery.trim() }}"</p>
          <button class="library__search-clear" @click="clearSearch">Clear search</button>
        </div>
      </template>
      <ShelfRow
        v-for="shelf in filteredShelves"
        :key="shelf.id"
        :name="shelf.name"
        :slug="shelf.slug"
        :book-count="shelf.bookCount"
        :books="shelf.books"
        :is-default="shelf.isDefault"
        class="animate-fade-in-up"
        @open-book="onOpenBook"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="library__empty-state">
      <div class="library__empty-state-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="library__empty-icon" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
        <p v-if="isGuest">Sign up to create shelves and start tracking your reading.</p>
        <p v-else>Your library is empty — find your next read in Search.</p>
        <NuxtLink to="/search" class="library__empty-cta">Search for books</NuxtLink>
      </div>
    </div>

    <!-- Book detail panel -->
    <BookDetailPanel
      v-if="detailBookId"
      :user-book-id="detailBookId"
      :source-el="detailSourceEl"
      @close="closeDetail"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Library — Bookshelf' })

const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()

const libraryStore = useLibraryStore()
const shelvesStore = useShelvesStore()

// Library search
const { query: searchQuery, filteredShelves, totalMatches, isFiltering, clear: clearSearch } = useLibrarySearch(
  computed(() => libraryStore.data),
)

// New shelf form
const showNewShelf = ref(false)
const newShelfName = ref('')
const creatingShelf = ref(false)
const newShelfInput = ref<HTMLInputElement>()

// Book detail panel
const detailBookId = ref<string | null>(null)
const detailSourceEl = ref<HTMLElement | null>(null)

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

function onOpenBook(userBookId: string, el: HTMLElement) {
  detailBookId.value = userBookId
  detailSourceEl.value = el
}

function closeDetail() {
  detailBookId.value = null
  detailSourceEl.value = null
  // Revalidate in case something changed (move shelf, remove)
  libraryStore.revalidate()
}

watch(showNewShelf, (val) => {
  if (val) {
    nextTick(() => newShelfInput.value?.focus())
  }
})

watch([isAuthenticated, isGuest], ([authed, guest]) => {
  if (authed || guest) libraryStore.fetch()
}, { immediate: true })

onMounted(() => {
  if (isAuthenticated.value || isGuest.value) libraryStore.revalidate()
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.library {
  @include container($library-max-width);
  padding-bottom: $spacing-3xl;

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
    margin-bottom: $spacing-xl;
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

  // --- Library search ---
  &__search {
    margin-bottom: $spacing-lg;
  }

  &__search-results {
    @include meta-text;
    margin-top: $spacing-sm;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__search-clear {
    background: none;
    border: none;
    color: var(--progress-color);
    font-family: $font-family-body;
    font-size: $font-size-xs;
    cursor: pointer;
    padding: 0;

    &:hover {
      text-decoration: underline;
    }
  }

  &__search-empty {
    text-align: center;
    padding: $spacing-2xl $spacing-md;
    color: var(--text-color-muted);
    font-family: $font-family-body;
    @include flex-column;
    align-items: center;
    gap: $spacing-sm;
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
    gap: $spacing-3xl;
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

  &__skeleton-shelf {
    display: flex;
    gap: 0.15rem;
    padding: $spacing-md $spacing-sm 0;
  }

  &__skeleton-book {
    width: 2.25rem;
    aspect-ratio: 2 / 3;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
    flex-shrink: 0;
  }

  &__skeleton-surface {
    height: 14px;
    background: var(--sub-bg-color);
    border-radius: 0 0 3px 3px;
  }

  // --- Shelves ---
  &__shelves {
    @include flex-column;
    gap: $spacing-2xl;
  }

  // --- Empty state ---
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
