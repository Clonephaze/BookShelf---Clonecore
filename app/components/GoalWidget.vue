<template>
  <NuxtLink v-if="currentGoal" to="/goals" class="goal-widget">
    <svg
      class="goal-widget__ring"
      viewBox="0 0 36 36"
      role="img"
      :aria-label="`${currentGoal.booksCompleted} of ${currentGoal.targetBooks} books read this year`"
    >
      <circle
        class="goal-widget__ring-bg"
        cx="18"
        cy="18"
        :r="RADIUS"
      />
      <circle
        class="goal-widget__ring-fill"
        :class="{ 'goal-widget__ring-fill--complete': paceStatus === 'complete' }"
        cx="18"
        cy="18"
        :r="RADIUS"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeOffset"
      />
    </svg>
    <span class="goal-widget__text">
      <strong>{{ currentGoal.booksCompleted }}</strong> / {{ currentGoal.targetBooks }} books
    </span>
    <span
      class="goal-widget__pace"
      :class="`goal-widget__pace--${paceStatus}`"
    >{{ paceLabel }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const { currentGoal, paceStatus, paceLabel, progress, fetchGoals } = useGoals()

const RADIUS = 14
const circumference = 2 * Math.PI * RADIUS
const strokeOffset = computed(() => circumference * (1 - progress.value))

// Non-blocking — no await, state is shared via useState so persists across navigations
fetchGoals()
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.goal-widget {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  @include card-base;
  text-decoration: none;
  @include focus-visible-highlight;

  &:hover {
    border-color: var(--highlight-color);
  }

  &__ring {
    width: 2.25rem;
    height: 2.25rem;
    flex-shrink: 0;
    transform: rotate(-90deg);
  }

  &__ring-bg {
    fill: none;
    stroke: var(--border-color);
    stroke-width: 3;
  }

  &__ring-fill {
    fill: none;
    stroke: var(--progress-color);
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s ease;

    &--complete {
      stroke: var(--success-color);
    }
  }

  &__text {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-secondary);

    strong {
      color: var(--text-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__pace {
    margin-left: auto;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    padding: 0.125rem $spacing-sm;
    border-radius: $radius-full;

    &--ahead {
      background: color-mix(in srgb, var(--success-color) 15%, transparent);
      color: var(--success-color);
    }

    &--on-track {
      background: color-mix(in srgb, var(--highlight-color) 15%, transparent);
      color: var(--highlight-color);
    }

    &--behind {
      background: color-mix(in srgb, var(--warning-color) 15%, transparent);
      color: var(--warning-color);
    }

    &--complete {
      background: color-mix(in srgb, var(--success-color) 15%, transparent);
      color: var(--success-color);
    }
  }
}
</style>
