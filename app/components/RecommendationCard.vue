<script setup lang="ts">
import { X, Pen, BookOpen, Users, BookMarked, Globe, Lightbulb, type LucideIcon } from 'lucide-vue-next'
import type { Recommendation } from '~/composables/useRecommendations'

defineProps<{
  recommendation: Recommendation
}>()

defineEmits<{
  dismiss: [bookId: string]
  view: [bookId: string]
}>()

const reasonIcons: Record<string, LucideIcon> = {
  author: Pen,
  genre: BookOpen,
  collaborative: Users,
  because_you_read: BookMarked,
  external: Globe,
}
</script>

<template>
  <article class="rec-card">
    <button
      class="rec-card__main"
      type="button"
      :aria-label="`View ${recommendation.title}`"
      @click="$emit('view', recommendation.bookId)"
    >
      <BookCover
        :src="recommendation.coverUrl ?? undefined"
        :title="recommendation.title"
        :author="recommendation.author"
        width="5.5rem"
      />

      <div class="rec-card__info">
        <h3 class="rec-card__title">{{ recommendation.title }}</h3>
        <p class="rec-card__author">{{ recommendation.author }}</p>

        <div class="rec-card__meta">
          <span v-if="recommendation.publishedDate">{{ recommendation.publishedDate }}</span>
          <span v-if="recommendation.pageCount">{{ recommendation.pageCount }} pages</span>
        </div>

        <div class="rec-card__reasons">
          <span
            v-for="(reason, i) in recommendation.reasons.slice(0, 2)"
            :key="i"
            class="rec-card__reason"
          >
            <component :is="reasonIcons[reason.type] ?? Lightbulb" :size="14" class="rec-card__reason-icon" />
            {{ reason.label }}
          </span>
        </div>
      </div>
    </button>

    <button
      class="rec-card__dismiss"
      type="button"
      aria-label="Not interested"
      title="Not interested"
      @click.stop="$emit('dismiss', recommendation.bookId)"
    >
      <X :size="16" />
    </button>
  </article>
</template>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;
@use '~/assets/scss/mixins' as *;

.rec-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-md;
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  background: var(--surface-color);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--highlight-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &__main {
    display: flex;
    gap: $spacing-md;
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    color: inherit;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__title {
    @include heading;
    font-size: $font-size-base;
    line-height: 1.3;
    color: var(--text-color);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__author {
    @include meta-text;
    color: var(--text-muted);
  }

  &__meta {
    @include meta-text;
    display: flex;
    gap: $spacing-sm;
    color: var(--text-muted);
    font-size: $font-size-xs;
  }

  &__reasons {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: $spacing-xs;
  }

  &__reason {
    @include meta-text;
    font-size: $font-size-xs;
    color: var(--highlight-color);
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__reason-icon {
    flex-shrink: 0;
    color: var(--highlight-color);
  }

  &__dismiss {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    @include flex-center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
    flex-shrink: 0;

    &:hover {
      background: var(--border-color);
      color: var(--text-color);
    }
  }
}
</style>
