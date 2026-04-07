<template>
  <NuxtLink
    v-if="insight.link"
    :to="insight.link"
    class="insight-card"
    :class="`insight-card--${insight.type}`"
  >
    <span class="insight-card__icon" aria-hidden="true">{{ insight.icon }}</span>
    <div class="insight-card__content">
      <span class="insight-card__title">{{ insight.title }}</span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="insight-card__body" v-html="renderedBody" />
    </div>
    <button
      class="insight-card__dismiss"
      aria-label="Dismiss insight"
      @click.prevent.stop="$emit('dismiss', insight.id)"
    >
      <X :size="14" />
    </button>
  </NuxtLink>
  <div
    v-else
    class="insight-card"
    :class="`insight-card--${insight.type}`"
  >
    <span class="insight-card__icon" aria-hidden="true">{{ insight.icon }}</span>
    <div class="insight-card__content">
      <span class="insight-card__title">{{ insight.title }}</span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="insight-card__body" v-html="renderedBody" />
    </div>
    <button
      class="insight-card__dismiss"
      aria-label="Dismiss insight"
      @click="$emit('dismiss', insight.id)"
    >
      <X :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

export interface InsightData {
  id: string
  type: 'projection' | 'goal' | 'trend' | 'milestone' | 'stale' | 'streak'
  icon: string
  title: string
  body: string
  link?: string
  bookTitle?: string
}

const props = defineProps<{
  insight: InsightData
}>()

defineEmits<{
  dismiss: [id: string]
}>()

/** Render **bold** markdown in body text (with HTML escaping for safety) */
const renderedBody = computed(() => {
  const escaped = props.insight.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease;
  position: relative;
  border-left: 3px solid transparent;

  &:is(a):hover {
    background: var(--sub-bg-color);
  }

  &__icon {
    font-size: $font-size-lg;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 0.1em;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: block;
    font-family: $font-family-body;
    font-weight: $font-weight-semibold;
    font-size: $font-size-sm;
    color: var(--text-color);
    margin-bottom: $spacing-xs;
  }

  &__body {
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
    line-height: 1.5;
    margin: 0;

    :deep(strong) {
      color: var(--text-color);
      font-weight: $font-weight-medium;
    }
  }

  &__dismiss {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: var(--text-color-muted);
    cursor: pointer;
    border-radius: $radius-sm;
    padding: 0;
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }
  }

  &:hover &__dismiss {
    opacity: 1;
  }

  // Type-specific left accents
  &--goal {
    border-left: 3px solid var(--progress-color);
  }

  &--projection {
    border-left: 3px solid var(--highlight-color);
  }

  &--trend {
    border-left: 3px solid var(--rating-color);
  }

  &--milestone {
    border-left: 3px solid var(--success-color);
  }

  &--stale {
    border-left: 3px solid var(--warning-color);
  }

  &--streak {
    border-left: 3px solid var(--error-color);
  }
}
</style>
