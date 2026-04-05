<template>
  <div class="shelf-view">
    <NuxtLink to="/library" class="shelf-view__back">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      Library
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="shelf-view__loading">
      <div class="shelf-view__skeleton-title" />
      <div class="shelf-view__skeleton-toolbar" />
      <div class="shelf-view__skeleton-shelf">
        <div v-for="n in 12" :key="n" class="shelf-view__skeleton-book" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="shelf-view__error">
      <p>Couldn't load this shelf.</p>
      <NuxtLink to="/library" class="shelf-view__error-link">Return to library</NuxtLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="shelf-view__header">
        <div class="shelf-view__title-area">
          <h2 v-if="!editing" class="shelf-view__title">
            {{ shelfName }}
            <span class="shelf-view__count">{{ sortedBooks.length }} {{ sortedBooks.length === 1 ? 'book' : 'books' }}</span>
          </h2>
          <div v-else class="shelf-view__edit-name animate-fade-in-scale">
            <input
              ref="editInput"
              v-model="editName"
              type="text"
              class="shelf-view__edit-input"
              maxlength="50"
              @keydown.enter="saveRename"
              @keydown.escape="editing = false"
            >
            <button class="shelf-view__edit-save" :disabled="!editName.trim()" @click="saveRename">Save</button>
            <button class="shelf-view__edit-cancel" @click="editing = false">Cancel</button>
          </div>
        </div>

        <div v-if="shelf && !shelf.isDefault" class="shelf-view__shelf-actions">
          <button class="shelf-view__action-btn" @click="startRename">Rename</button>
          <button class="shelf-view__action-btn shelf-view__action-btn--danger" @click="confirmDelete">Delete</button>
        </div>
      </div>

      <!-- Toolbar: sort -->
      <div v-if="books.length" class="shelf-view__toolbar">
        <div class="shelf-view__sort">
          <label for="sort-select" class="shelf-view__sort-label">Sort by</label>
          <select id="sort-select" v-model="sortBy" class="shelf-view__sort-select">
            <option value="date-added">Date added</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <!-- Book grid -->
      <ShelfGrid
        :books="sortedBooks"
        empty-message="This shelf is empty."
        @open="onOpenBook"
      />
      <div v-if="!sortedBooks.length" class="shelf-view__empty-action">
        <NuxtLink to="/search" class="shelf-view__search-link">Search for books to add</NuxtLink>
      </div>
    </template>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="shelf-view__confirm-backdrop" @click.self="showDeleteConfirm = false">
        <div class="shelf-view__confirm" role="alertdialog" aria-label="Delete shelf confirmation">
          <h3 class="shelf-view__confirm-title">Delete "{{ shelfName }}"?</h3>
          <p class="shelf-view__confirm-text">Books on this shelf won't be deleted from your library, but they'll be removed from this shelf.</p>
          <div class="shelf-view__confirm-actions">
            <button class="shelf-view__confirm-cancel" @click="showDeleteConfirm = false">Cancel</button>
            <button class="shelf-view__confirm-delete" :disabled="deleting" @click="deleteShelf">Delete shelf</button>
          </div>
        </div>
      </div>
    </Teleport>

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

const route = useRoute()

interface ShelfBook {
  userBookId: string
  bookId: string
  title: string
  author: string
  coverUrl: string | null
  coverUrlSmall: string | null
  pageCount: number | null
  rating: number | null
  dateAdded: string | null
  dateFinished: string | null
  currentPage: number | null
  progressPercent: string | null
}

const loading = ref(true)
const error = ref(false)
const shelf = ref<{ id: string; name: string; slug: string; isDefault: boolean } | null>(null)
const books = ref<ShelfBook[]>([])
const sortBy = ref('date-added')

const shelvesStore = useShelvesStore()

// Rename state
const editing = ref(false)
const editName = ref('')
const editInput = ref<HTMLInputElement>()

// Delete state
const showDeleteConfirm = ref(false)
const deleting = ref(false)

// Book detail panel
const detailBookId = ref<string | null>(null)
const detailSourceEl = ref<HTMLElement | null>(null)

const slug = computed(() => route.params.slug as string)
const shelfName = computed(() => shelf.value?.name ?? '')

useHead({
  title: computed(() => shelfName.value ? `${shelfName.value} — Bookshelf` : 'Shelf — Bookshelf'),
})

const sortedBooks = computed(() => {
  const arr = [...books.value]
  switch (sortBy.value) {
    case 'title':
      return arr.sort((a, b) => a.title.localeCompare(b.title))
    case 'author':
      return arr.sort((a, b) => a.author.localeCompare(b.author))
    case 'rating':
      return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    case 'date-added':
    default:
      return arr.sort((a, b) => {
        const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0
        const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0
        return db - da
      })
  }
})

async function fetchShelfBooks() {
  loading.value = true
  error.value = false
  try {
    await shelvesStore.fetch()
    const match = shelvesStore.shelves.find(s => s.slug === slug.value)
    if (!match) {
      error.value = true
      loading.value = false
      return
    }
    shelf.value = match

    const data = await $fetch<{ shelf: { id: string; name: string; slug: string; isDefault: boolean }; books: ShelfBook[] }>(`/api/shelves/${match.id}/books`)
    books.value = data.books
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
  }
}

function onOpenBook(userBookId: string, el: HTMLElement) {
  detailBookId.value = userBookId
  detailSourceEl.value = el
}

function closeDetail() {
  detailBookId.value = null
  detailSourceEl.value = null
  fetchShelfBooks()
}

function startRename() {
  editName.value = shelfName.value
  editing.value = true
  nextTick(() => editInput.value?.focus())
}

async function saveRename() {
  const name = editName.value.trim()
  if (!name || !shelf.value) return
  try {
    await $fetch(`/api/shelves/${shelf.value.id}`, {
      method: 'PATCH',
      body: { name },
    })
    await shelvesStore.invalidate()
    await fetchShelfBooks()
    editing.value = false
  }
  catch {
    // Could show error
  }
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

async function deleteShelf() {
  if (!shelf.value) return
  deleting.value = true
  try {
    await $fetch(`/api/shelves/${shelf.value.id}`, { method: 'DELETE' })
    await shelvesStore.invalidate()
    await navigateTo('/library')
  }
  catch {
    // Could show error
  }
  finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

onMounted(fetchShelfBooks)
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.shelf-view {
  @include container($library-max-width);
  padding-bottom: $spacing-3xl;

  &__back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: var(--highlight-color);
    }
  }

  // --- Loading ---
  &__loading {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  &__skeleton-title {
    height: 2rem;
    width: 12rem;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
    margin-bottom: $spacing-md;
  }

  &__skeleton-toolbar {
    height: 2.5rem;
    width: 16rem;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
    margin-bottom: $spacing-xl;
  }

  &__skeleton-shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: $spacing-md;
    padding: $spacing-md 0;
  }

  &__skeleton-book {
    aspect-ratio: 2 / 3;
    background: var(--sub-bg-color);
    border-radius: $radius-sm;
  }

  &__skeleton-surface {
    display: none;
  }

  // --- Error ---
  &__error {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    min-height: 40vh;
    @include body-text;
    text-align: center;
  }

  &__error-link {
    @include button-secondary;
    text-decoration: none;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  // --- Header ---
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__title {
    @include heading($font-size-2xl);
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__count {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    background: var(--sub-bg-color);
    padding: 2px $spacing-sm;
    border-radius: $radius-full;
  }

  // --- Edit name ---
  &__edit-name {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__edit-input {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__edit-save {
    @include button-primary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  &__edit-cancel {
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

  // --- Shelf actions ---
  &__shelf-actions {
    display: flex;
    gap: $spacing-xs;
  }

  &__action-btn {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    transition: color $transition-fast, background-color $transition-fast;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }

    &--danger:hover {
      color: var(--error-color);
    }
  }

  // --- Toolbar ---
  &__toolbar {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__sort {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__sort-label {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__sort-select {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  // --- Empty action (below ShelfGrid empty) ---
  &__empty-action {
    @include flex-center;
    padding-bottom: $spacing-2xl;
    text-align: center;
  }

  &__search-link {
    font-size: $font-size-sm;
    color: var(--highlight-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // --- Delete confirmation ---
  &__confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-md;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    animation: fade-in 200ms ease both;
  }

  &__confirm {
    width: 100%;
    max-width: 24rem;
    padding: $spacing-xl;
    background: var(--surface-color);
    border-radius: $radius-xl;
    box-shadow: var(--shadow-lg);
    animation: fade-in-scale 300ms $ease-out-expo both;
  }

  &__confirm-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-sm;
  }

  &__confirm-text {
    @include body-text;
    font-size: $font-size-sm;
    margin-bottom: $spacing-lg;
  }

  &__confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }

  &__confirm-cancel {
    @include button-tertiary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  &__confirm-delete {
    @include button-base;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    background: var(--error-color);
    color: #fff;
    border: 2px solid var(--error-color);

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>