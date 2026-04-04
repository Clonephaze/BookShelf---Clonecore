<template>
  <div class="header-nav" role="navigation" aria-label="Main navigation">
    <!-- Tier 1: Brand bar -->
    <div class="header-nav__top">
      <div class="header-nav__top-inner">
        <NuxtLink to="/library" class="header-nav__brand">
          <span class="header-nav__logo">Bookshelf</span>
        </NuxtLink>

        <form class="header-nav__search" role="search" @submit.prevent="onSearch">
          <Search :size="16" class="header-nav__search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            class="header-nav__search-input"
            placeholder="Search books…"
            aria-label="Search books"
          >
        </form>

        <div class="header-nav__actions">
          <ThemeSwitcher />
          <button
            v-if="user"
            class="header-nav__user-btn"
            aria-label="User menu"
            @click="$emit('toggle-user-menu')"
          >
            <span class="header-nav__avatar">{{ userInitial }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tier 2: Tab bar -->
    <div class="header-nav__tabs">
      <div class="header-nav__tabs-inner">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="header-nav__tab"
          :class="{ 'header-nav__tab--active': isActive(tab.to) }"
          :aria-current="isActive(tab.to) ? 'page' : undefined"
        >
          <component :is="tab.icon" :size="16" class="header-nav__tab-icon" />
          <span>{{ tab.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Library, Target, BarChart3, Settings, Users } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

defineProps<{
  user: { name: string } | null
}>()

defineEmits<{ 'toggle-user-menu': [] }>()

const searchQuery = ref('')

function onSearch() {
  const q = searchQuery.value.trim()
  if (q.length >= 2) {
    router.push({ path: '/search', query: { q } })
    searchQuery.value = ''
  }
}
const tabs = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const userInitial = computed(() => {
  const user = useAuth().user.value
  return user?.name?.charAt(0)?.toUpperCase() ?? '?'
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.header-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--sub-bg-color);
  border-bottom: 1px solid var(--border-color-subtle);

  @include respond-below($breakpoint-md) {
    display: none;
  }

  // --- Tier 1: Brand bar ---

  &__top {
    border-bottom: 1px solid var(--border-color-subtle);
  }

  &__top-inner {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    max-width: $page-max-width;
    margin: 0 auto;
    padding: $spacing-sm $spacing-xl;
  }

  &__brand {
    text-decoration: none;
    flex-shrink: 0;
  }

  &__logo {
    font-family: $font-family-heading;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  // --- Search bar ---

  &__search {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex: 1;
    max-width: 28rem;
    margin: 0 auto;
    padding: $spacing-sm $spacing-md;
    background-color: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:focus-within {
      border-color: var(--highlight-color);
      box-shadow: 0 0 0 2px rgba(var(--highlight-color-rgb), 0.15);
    }
  }

  &__search-icon {
    color: var(--text-color-muted);
    flex-shrink: 0;
  }

  &__search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: $font-size-sm;
    font-family: $font-family-body;
    color: var(--text-color);

    &::placeholder {
      color: var(--text-color-muted);
    }
  }

  // --- Actions ---

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
  }

  &__user-btn {
    @include flex-center;
    width: 2rem;
    height: 2rem;
    border-radius: $radius-full;
    background-color: var(--highlight-color);
    color: #fff;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    transition: background-color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      background-color: var(--highlight-color-hover);
    }
  }

  &__avatar {
    line-height: 1;
  }

  // --- Tier 2: Tab bar ---

  &__tabs {
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__tabs-inner {
    display: flex;
    align-items: stretch;
    gap: $spacing-xs;
    max-width: $page-max-width;
    margin: 0 auto;
    padding: 0 $spacing-xl;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color-muted);
    text-decoration: none;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color $transition-fast, border-color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      color: var(--text-color);
    }

    &--active {
      color: var(--highlight-color);
      border-bottom-color: var(--highlight-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__tab-icon {
    flex-shrink: 0;
  }
}
</style>
