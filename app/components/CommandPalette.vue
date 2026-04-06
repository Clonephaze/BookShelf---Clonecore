<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const inputRef = ref<HTMLInputElement>()
const query = ref('')
const selectedIndex = ref(0)

const router = useRouter()
const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()
const libraryStore = useLibraryStore()

// --- Command registry ---
interface Command {
  id: string
  label: string
  hint?: string
  icon: string
  section: 'navigation' | 'library' | 'actions'
  action: () => void
}

const navigationCommands = computed<Command[]>(() => {
  const cmds: Command[] = [
    { id: 'nav-library', label: 'Library', hint: 'Your shelves & books', icon: 'library', section: 'navigation', action: () => router.push('/library') },
    { id: 'nav-search', label: 'Search Books', hint: 'Find new books to read', icon: 'search', section: 'navigation', action: () => router.push('/search') },
    { id: 'nav-stats', label: 'Statistics', hint: 'Reading insights & charts', icon: 'chart', section: 'navigation', action: () => router.push('/stats') },
    { id: 'nav-goals', label: 'Goals', hint: 'Reading goals & progress', icon: 'target', section: 'navigation', action: () => router.push('/goals') },
    { id: 'nav-friends', label: 'Friends', hint: 'Social & reading circles', icon: 'users', section: 'navigation', action: () => router.push('/friends') },
    { id: 'nav-settings', label: 'Settings', hint: 'Account & preferences', icon: 'settings', section: 'navigation', action: () => router.push('/settings') },
  ]
  if (isAuthenticated.value || isGuest.value) {
    cmds.push(
      { id: 'nav-year-review', label: 'Year in Review', hint: `${new Date().getFullYear()} reading story`, icon: 'sparkles', section: 'navigation', action: () => router.push(`/stats/year/${new Date().getFullYear()}`) },
    )
  }
  return cmds
})

const libraryCommands = computed<Command[]>(() => {
  if (!libraryStore.loaded) return []
  const books: Command[] = []
  for (const shelf of libraryStore.data) {
    for (const book of shelf.books) {
      if (books.some(b => b.id === `book-${book.userBookId}`)) continue
      books.push({
        id: `book-${book.userBookId}`,
        label: book.title,
        hint: book.author,
        icon: 'book',
        section: 'library',
        action: () => router.push(`/library/book/${book.userBookId}`),
      })
    }
  }
  return books
})

const actionCommands = computed<Command[]>(() => {
  const cmds: Command[] = []
  if (!isGuest.value && isAuthenticated.value) {
    cmds.push(
      { id: 'action-add-book', label: 'Add a Book', hint: 'Search & add to library', icon: 'plus', section: 'actions', action: () => router.push('/search') },
    )
  }
  return cmds
})

const allCommands = computed(() => [
  ...navigationCommands.value,
  ...actionCommands.value,
  ...libraryCommands.value,
])

// --- Fuzzy filter ---
function normalise(s: string) {
  return s.toLowerCase().replace(/['']/g, "'").trim()
}

function fuzzyMatch(text: string, q: string): boolean {
  const normalText = normalise(text)
  const normalQ = normalise(q)
  // Simple substring match + word-start matching
  if (normalText.includes(normalQ)) return true
  // Check if each word in query matches start of any word in text
  const queryWords = normalQ.split(/\s+/)
  const textWords = normalText.split(/\s+/)
  return queryWords.every(qw =>
    textWords.some(tw => tw.startsWith(qw)),
  )
}

const filtered = computed(() => {
  const q = query.value.trim()
  if (!q) return allCommands.value.slice(0, 20)
  return allCommands.value.filter(cmd =>
    fuzzyMatch(cmd.label, q)
    || (cmd.hint && fuzzyMatch(cmd.hint, q)),
  ).slice(0, 20)
})

// Group by section for display
const groupedResults = computed(() => {
  const groups: { section: string; label: string; commands: Command[] }[] = []
  const sectionLabels: Record<string, string> = {
    navigation: 'Go to',
    actions: 'Actions',
    library: 'Your Books',
  }
  const sectionOrder = ['navigation', 'actions', 'library']

  for (const section of sectionOrder) {
    const cmds = filtered.value.filter(c => c.section === section)
    if (cmds.length > 0) {
      groups.push({ section, label: sectionLabels[section] ?? section, commands: cmds })
    }
  }
  return groups
})

const flatResults = computed(() => filtered.value)

// --- Keyboard nav ---
function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, flatResults.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter': {
      e.preventDefault()
      const cmd = flatResults.value[selectedIndex.value]
      if (cmd) execute(cmd)
      break
    }
      break
    case 'Escape':
      e.preventDefault()
      emit('close')
      break
  }
}

function execute(cmd: Command) {
  emit('close')
  nextTick(() => cmd.action())
}

// Reset on query change
watch(query, () => {
  selectedIndex.value = 0
})

// Focus on open
watch(() => props.visible, (val) => {
  if (val) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

// Icon map (simplified SVG paths)
function iconPath(icon: string): string {
  const icons: Record<string, string> = {
    library: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
    search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3',
    chart: 'M18 20V10M12 20V4M6 20v-6',
    target: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    sparkles: 'M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z',
    book: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
    plus: 'M5 12h14M12 5v14',
  }
  return icons[icon] ?? icons.search!
}
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="visible"
        class="palette-overlay"
        @mousedown.self="emit('close')"
      >
        <div
          class="palette"
          role="combobox"
          aria-expanded="true"
          aria-haspopup="listbox"
          @keydown="onKeydown"
        >
          <div class="palette__input-row">
            <svg class="palette__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="palette__input"
              placeholder="Search books, pages, actions..."
              aria-label="Command palette search"
              autocomplete="off"
            >
            <kbd class="palette__kbd">Esc</kbd>
          </div>

          <div class="palette__results" role="listbox">
            <template v-if="flatResults.length === 0">
              <div class="palette__empty">No results for "{{ query }}"</div>
            </template>
            <template v-for="group in groupedResults" :key="group.section">
              <div class="palette__group-label">{{ group.label }}</div>
              <button
                v-for="cmd in group.commands"
                :key="cmd.id"
                class="palette__item"
                :class="{ 'palette__item--selected': flatResults[selectedIndex]?.id === cmd.id }"
                role="option"
                :aria-selected="flatResults[selectedIndex]?.id === cmd.id"
                @click="execute(cmd)"
                @mouseenter="selectedIndex = flatResults.indexOf(cmd)"
              >
                <svg class="palette__item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="iconPath(cmd.icon)"/></svg>
                <div class="palette__item-text">
                  <span class="palette__item-label">{{ cmd.label }}</span>
                  <span v-if="cmd.hint" class="palette__item-hint">{{ cmd.hint }}</span>
                </div>
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  backdrop-filter: blur(2px);
}

.palette {
  width: 100%;
  max-width: 32rem;
  background: var(--surface-color);
  border-radius: $radius-xl;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  overflow: hidden;

  &__input-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid var(--border-color);
  }

  &__search-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--text-color-muted);
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    border: none;
    background: none;
    font-family: $font-family-body;
    font-size: $font-size-base;
    color: var(--text-color);
    outline: none;

    &::placeholder {
      color: var(--text-color-muted);
    }
  }

  &__kbd {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;
    padding: 1px $spacing-xs;
    line-height: 1.4;
  }

  &__results {
    max-height: 24rem;
    overflow-y: auto;
    padding: $spacing-sm 0;
  }

  &__group-label {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: $spacing-sm $spacing-lg $spacing-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    padding: $spacing-sm $spacing-lg;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s ease;

    &--selected {
      background: var(--sub-bg-color);
    }
  }

  &__item-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--text-color-muted);
    flex-shrink: 0;
  }

  &__item-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__item-label {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-hint {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__empty {
    padding: $spacing-xl $spacing-lg;
    text-align: center;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }
}

// --- Transition ---
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.15s ease;

  .palette {
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
}

.palette-enter-from,
.palette-leave-to {
  opacity: 0;

  .palette {
    transform: scale(0.97) translateY(-8px);
    opacity: 0;
  }
}
</style>
