<template>
  <button
    class="theme-switcher"
    :aria-label="`Current theme: ${currentTheme}. Click to cycle.`"
    @click="cycleTheme"
  >
    <component :is="themeIcon" :size="18" />
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon, Smartphone, Monitor } from 'lucide-vue-next'
import type { Theme } from '~/composables/useTheme'

const { currentTheme, setTheme } = useTheme()

const themeOrder: Theme[] = ['system', 'light', 'dark', 'oled']

const themeIcon = computed(() => {
  switch (currentTheme.value) {
    case 'light': return Sun
    case 'dark': return Moon
    case 'oled': return Smartphone
    default: return Monitor
  }
})

function cycleTheme() {
  const currentIndex = themeOrder.indexOf(currentTheme.value)
  const nextIndex = (currentIndex + 1) % themeOrder.length
  setTheme(themeOrder[nextIndex] ?? 'system')
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.theme-switcher {
  @include flex-center;
  width: 2.25rem;
  height: 2.25rem;
  color: var(--text-color-muted);
  border-radius: $radius-md;
  transition: color $transition-fast, background-color $transition-fast;
  @include focus-visible-highlight;

  &:hover {
    color: var(--text-color);
    background-color: var(--surface-color);
  }
}
</style>
