<template>
  <nav class="mobile-nav" aria-label="Mobile navigation">
    <!-- Notch SVG background -->
    <svg
      class="mobile-nav__notch"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 56"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path :d="notchPath" fill="var(--sub-bg-color)" />
    </svg>

    <div class="mobile-nav__bar">
      <!-- Left items -->
      <NuxtLink
        v-for="item in leftItems"
        :key="item.to"
        :to="item.to"
        class="mobile-nav__link"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <component :is="item.icon" :size="22" />
        <span class="mobile-nav__label">{{ item.label }}</span>
      </NuxtLink>

      <!-- Center action -->
      <div class="mobile-nav__center-spacer" />

      <!-- Right items -->
      <NuxtLink
        v-for="item in rightItems"
        :key="item.to"
        :to="item.to"
        class="mobile-nav__link"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <component :is="item.icon" :size="22" />
        <span class="mobile-nav__label">{{ item.label }}</span>
      </NuxtLink>

      <!-- More button -->
      <button
        class="mobile-nav__link"
        :class="{ 'mobile-nav__link--sheet-open': moreOpen }"
        aria-label="More options"
        @click="emit('toggle-more')"
      >
        <MoreHorizontal :size="22" />
        <span class="mobile-nav__label">More</span>
      </button>
    </div>

    <NuxtLink
      :to="centerAction.to"
      class="mobile-nav__center"
      :aria-label="centerAction.label"
      :aria-current="isActive(centerAction.to) ? 'page' : undefined"
    >
      <component :is="centerAction.icon" :size="26" />
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { Library, Search, Target, BarChart3, MoreHorizontal } from 'lucide-vue-next'

defineProps<{ moreOpen: boolean }>()
const emit = defineEmits<{ 'toggle-more': [] }>()

const route = useRoute()

const leftItems = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/goals', label: 'Goals', icon: Target },
]

const centerAction = { to: '/search', label: 'Search', icon: Search }

const rightItems = [
  { to: '/stats', label: 'Stats', icon: BarChart3 },
]

// SVG notch: bar with a smooth concave dip in the center for the FAB
const notchPath = [
  'M0,6 L0,56 L400,56 L400,6',
  'C400,2.7 397.3,0 394,0',
  'L230,0',
  'C226,0 222.4,1.6 220,4.8',
  'A32,32 0 0,1 180,4.8',
  'C177.6,1.6 174,0 170,0',
  'L6,0',
  'C2.7,0 0,2.7 0,6 Z',
].join(' ')

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

  @include respond-below($breakpoint-md) {
    display: block;
  }

  &__notch {
    position: absolute;
    bottom: env(safe-area-inset-bottom, 0px);
    left: 0;
    right: 0;
    width: 100%;
    height: 3.5rem;
    filter: drop-shadow(0 -1px 2px rgba(0, 0, 0, 0.06));
    pointer-events: none;
  }

  // Safe-area fill below the notch (for devices with home indicators)
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: env(safe-area-inset-bottom, 0px);
    background-color: var(--sub-bg-color);
  }

  &__bar {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    padding: $spacing-sm 0;
    padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom, 0px));
    z-index: 1;
  }

  &__center-spacer {
    width: 4rem;
    flex-shrink: 0;
  }

  &__link {
    @include flex-column;
    align-items: center;
    gap: 2px;
    flex: 1;
    padding: $spacing-xs 0;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-decoration: none;
    transition: color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      color: var(--text-color);
    }

    &.router-link-active,
    &[aria-current="page"],
    &--sheet-open {
      color: var(--highlight-color);
    }
  }

  &__label {
    line-height: 1;
  }

  &__center {
    @include flex-center;
    position: absolute;
    bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    width: 3.5rem;
    height: 3.5rem;
    border-radius: $radius-full;
    background-color: var(--highlight-color);
    color: #fff;
    text-decoration: none;
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
    z-index: 2;
    transition: background-color $transition-fast, transform 0.2s ease, box-shadow $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      background-color: var(--highlight-color-hover);
    }

    &:active {
      transform: translateX(-50%) scale(0.94);
      box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.2);
    }

    &.router-link-active,
    &[aria-current="page"] {
      background-color: var(--highlight-color-hover);
      box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
