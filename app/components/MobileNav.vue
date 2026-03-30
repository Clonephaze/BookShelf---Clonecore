<template>
  <nav class="mobile-nav" aria-label="Mobile navigation">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="mobile-nav__link"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <component :is="item.icon" :size="20" />
      <span class="mobile-nav__label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { Library, Search, Target, BarChart3, Settings } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: none;
  justify-content: space-around;
  padding: $spacing-sm $spacing-xs;
  padding-bottom: env(safe-area-inset-bottom, $spacing-sm);
  background-color: var(--sub-bg-color);
  border-top: 1px solid var(--border-color-subtle);

  @include respond-below($breakpoint-lg) {
    display: flex;
  }

  &__link {
    @include flex-column;
    align-items: center;
    gap: 2px;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-decoration: none;
    border-radius: $radius-sm;
    transition: color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      color: var(--text-color);
    }

    &.router-link-active,
    &[aria-current="page"] {
      color: var(--highlight-color);
    }
  }

  &__label {
    line-height: 1;
  }
}
</style>
