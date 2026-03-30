<template>
  <nav class="sidebar-nav" aria-label="Main navigation">
    <ul class="sidebar-nav__list">
      <li v-for="item in navItems" :key="item.to">
        <NuxtLink :to="item.to" class="sidebar-nav__link" :aria-current="isActive(item.to) ? 'page' : undefined">
          <component :is="item.icon" :size="18" class="sidebar-nav__icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>

    <div v-if="shelves.length" class="sidebar-nav__section">
      <h3 class="sidebar-nav__heading">Shelves</h3>
      <ul class="sidebar-nav__list">
        <li v-for="shelf in shelves" :key="shelf.id">
          <NuxtLink :to="`/library/${shelf.slug}`" class="sidebar-nav__link">
            <component :is="shelfIcon(shelf.icon)" :size="16" class="sidebar-nav__icon" />
            <span>{{ shelf.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {
  Library,
  Search,
  Target,
  BarChart3,
  Settings,
  Bookmark,
  BookOpen,
  CheckCircle,
  type LucideIcon,
} from 'lucide-vue-next'

interface Shelf {
  id: string
  name: string
  slug: string
  icon: string | null
}

defineProps<{
  shelves: Shelf[]
}>()

const route = useRoute()

const navItems = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

const shelfIconMap: Record<string, LucideIcon> = {
  'bookmark': Bookmark,
  'book-open': BookOpen,
  'check-circle': CheckCircle,
}

function shelfIcon(icon: string | null): LucideIcon {
  return (icon && shelfIconMap[icon]) || Bookmark
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.sidebar-nav {
  @include flex-column;
  gap: $spacing-lg;

  &__list {
    @include flex-column;
    gap: $spacing-xs;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color-secondary);
    border-radius: $radius-md;
    text-decoration: none;
    transition: color $transition-fast, background-color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      color: var(--text-color);
      background-color: var(--surface-color);
    }

    &.router-link-active,
    &[aria-current="page"] {
      color: var(--highlight-color);
      background-color: var(--highlight-color-subtle);
      font-weight: $font-weight-semibold;
    }
  }

  &__icon {
    flex-shrink: 0;
  }

  &__section {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__heading {
    padding: 0 $spacing-md;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
</style>
