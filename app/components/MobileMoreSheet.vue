<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="open" class="more-sheet" @click.self="emit('close')">
        <div class="more-sheet__panel" role="dialog" aria-label="More options">
          <div class="more-sheet__handle" aria-hidden="true" />

          <nav class="more-sheet__nav" aria-label="Additional navigation">
            <NuxtLink
              v-for="item in items"
              :key="item.to"
              :to="item.to"
              class="more-sheet__link"
              @click="emit('close')"
            >
              <component :is="item.icon" :size="20" class="more-sheet__icon" />
              <span class="more-sheet__label">{{ item.label }}</span>
              <ChevronRight :size="16" class="more-sheet__chevron" />
            </NuxtLink>
          </nav>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { Settings, Users, ChevronRight } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const items = [
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.more-sheet {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: rgba(0, 0, 0, 0.4);

  &__panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--sub-bg-color);
    border-radius: $radius-xl $radius-xl 0 0;
    padding: $spacing-sm $spacing-md;
    padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom, 0px));
  }

  &__handle {
    width: 2rem;
    height: 0.25rem;
    margin: 0 auto $spacing-md;
    border-radius: $radius-full;
    background-color: var(--border-color);
  }

  &__nav {
    @include flex-column;
    gap: $spacing-xs;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    color: var(--text-color);
    text-decoration: none;
    border-radius: $radius-lg;
    transition: background-color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      background-color: var(--surface-color);
    }

    &.router-link-active {
      color: var(--highlight-color);
    }
  }

  &__icon {
    flex-shrink: 0;
    color: var(--text-color-muted);

    .router-link-active & {
      color: var(--highlight-color);
    }
  }

  &__label {
    flex: 1;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--text-color-muted);
  }
}

// --- Transitions ---

.sheet-enter-active,
.sheet-leave-active {
  transition: background-color 0.25s ease;

  .more-sheet__panel {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.sheet-enter-from,
.sheet-leave-to {
  background-color: rgba(0, 0, 0, 0);

  .more-sheet__panel {
    transform: translateY(100%);
  }
}
</style>
