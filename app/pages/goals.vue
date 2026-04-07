<template>
  <div class="goals">
    <header class="goals__header">
      <h1 class="goals__title">Reading Goals</h1>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="goals__loading">
      <div class="goals__skeleton goals__skeleton--ring" />
      <div class="goals__skeleton goals__skeleton--text" />
      <div class="goals__skeleton goals__skeleton--text goals__skeleton--short" />
    </div>

    <template v-else>
      <!-- Yearly goal -->
      <section v-if="yearlyGoal" class="goals__current">
        <h2 class="goals__section-label">{{ currentYear }} Goal</h2>
        <div class="goals__ring-container">
          <svg
            class="goals__ring"
            viewBox="0 0 120 120"
            role="img"
            :aria-label="`Reading progress: ${yearlyGoal.booksCompleted} of ${yearlyGoal.targetBooks} books`"
          >
            <circle class="goals__ring-bg" cx="60" cy="60" :r="RADIUS" />
            <circle
              class="goals__ring-fill"
              :class="{ 'goals__ring-fill--complete': paceStatus === 'complete' }"
              cx="60" cy="60" :r="RADIUS"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="yearlyOffset"
            />
          </svg>
          <div class="goals__ring-label" aria-hidden="true">
            <span class="goals__ring-count">{{ yearlyGoal.booksCompleted }}</span>
            <span class="goals__ring-target">of {{ yearlyGoal.targetBooks }}</span>
          </div>
        </div>
        <div class="goals__info">
          <span class="goals__pace" :class="`goals__pace--${paceStatus}`">{{ paceLabel }}</span>
          <p v-if="paceStatus !== 'complete'" class="goals__expected">
            Expected by now: {{ expectedBooks }} books
          </p>
          <div class="goals__actions">
            <button v-if="yearlyGoal.booksCompleted > 0" class="goals__view-books-btn" @click="openBooksPopover(yearlyGoal)">
              View books
            </button>
            <template v-if="editingId !== yearlyGoal.id">
              <button class="goals__edit-btn" @click="startEdit(yearlyGoal)">Edit goal</button>
            </template>
            <form v-else class="goals__edit-form" @submit.prevent="saveEdit(yearlyGoal.id)">
              <label class="goals__edit-label" :for="`edit-${yearlyGoal.id}`">Books this year:</label>
              <input :id="`edit-${yearlyGoal.id}`" v-model.number="editTarget" type="number" min="1" max="999" class="goals__edit-input">
              <button type="submit" class="goals__edit-save">Save</button>
              <button type="button" class="goals__edit-cancel" @click="editingId = null">Cancel</button>
            </form>
          </div>
        </div>
      </section>

      <!-- No yearly goal CTA -->
      <section v-else class="goals__cta">
        <div class="goals__cta-icon" aria-hidden="true">📚</div>
        <h2 class="goals__cta-title">Set a reading goal for {{ currentYear }}</h2>
        <p class="goals__cta-text">Track your progress throughout the year and stay motivated.</p>
        <form class="goals__cta-form" @submit.prevent="createGoal('yearly')">
          <label class="goals__cta-label" for="new-yearly-target">I want to read</label>
          <input id="new-yearly-target" v-model.number="newYearlyTarget" type="number" min="1" max="999" placeholder="12" class="goals__cta-input" required>
          <span class="goals__cta-suffix">books this year</span>
          <button type="submit" class="goals__cta-submit" :disabled="!newYearlyTarget || newYearlyTarget < 1">Set Goal</button>
        </form>
      </section>

      <!-- Sub-goals row: Monthly + Weekly -->
      <div class="goals__subgoals">
        <!-- Monthly goal -->
        <div class="goals__subgoal">
          <template v-if="monthlyGoal">
            <h3 class="goals__subgoal-title">{{ monthName }} Goal</h3>
            <div class="goals__subgoal-bar-wrapper">
              <div class="goals__subgoal-bar">
                <div
                  class="goals__subgoal-bar-fill"
                  :class="{ 'goals__subgoal-bar-fill--complete': goalPaceStatus(monthlyGoal) === 'complete' }"
                  :style="{ transform: `scaleX(${goalProgress(monthlyGoal)})` }"
                />
              </div>
              <span class="goals__subgoal-count">{{ monthlyGoal.booksCompleted }} / {{ monthlyGoal.targetBooks }}</span>
            </div>
            <span class="goals__pace goals__pace--sm" :class="`goals__pace--${goalPaceStatus(monthlyGoal)}`">
              {{ goalPaceLabel(monthlyGoal) }}
            </span>
            <div v-if="editingId !== monthlyGoal.id" class="goals__subgoal-actions">
              <button v-if="monthlyGoal.booksCompleted > 0" class="goals__view-books-btn goals__view-books-btn--sm" @click="openBooksPopover(monthlyGoal)">View books</button>
              <button class="goals__edit-btn goals__edit-btn--sm" @click="startEdit(monthlyGoal)">Edit</button>
            </div>
            <form v-else class="goals__edit-form" @submit.prevent="saveEdit(monthlyGoal.id)">
              <input :id="`edit-${monthlyGoal.id}`" v-model.number="editTarget" type="number" min="1" max="999" class="goals__edit-input">
              <button type="submit" class="goals__edit-save">Save</button>
              <button type="button" class="goals__edit-cancel" @click="editingId = null">Cancel</button>
            </form>
          </template>
          <template v-else>
            <h3 class="goals__subgoal-title">{{ monthName }}</h3>
            <form class="goals__subgoal-set" @submit.prevent="createGoal('monthly')">
              <input v-model.number="newMonthlyTarget" type="number" min="1" max="99" placeholder="4" class="goals__edit-input">
              <button type="submit" class="goals__edit-save" :disabled="!newMonthlyTarget || newMonthlyTarget < 1">Set</button>
            </form>
          </template>
        </div>

        <!-- Weekly goal -->
        <div class="goals__subgoal">
          <template v-if="weeklyGoal">
            <h3 class="goals__subgoal-title">Week {{ currentWeek }} Goal</h3>
            <div class="goals__subgoal-bar-wrapper">
              <div class="goals__subgoal-bar">
                <div
                  class="goals__subgoal-bar-fill"
                  :class="{ 'goals__subgoal-bar-fill--complete': goalPaceStatus(weeklyGoal) === 'complete' }"
                  :style="{ transform: `scaleX(${goalProgress(weeklyGoal)})` }"
                />
              </div>
              <span class="goals__subgoal-count">{{ weeklyGoal.booksCompleted }} / {{ weeklyGoal.targetBooks }}</span>
            </div>
            <span class="goals__pace goals__pace--sm" :class="`goals__pace--${goalPaceStatus(weeklyGoal)}`">
              {{ goalPaceLabel(weeklyGoal) }}
            </span>
            <div v-if="editingId !== weeklyGoal.id" class="goals__subgoal-actions">
              <button v-if="weeklyGoal.booksCompleted > 0" class="goals__view-books-btn goals__view-books-btn--sm" @click="openBooksPopover(weeklyGoal)">View books</button>
              <button class="goals__edit-btn goals__edit-btn--sm" @click="startEdit(weeklyGoal)">Edit</button>
            </div>
            <form v-else class="goals__edit-form" @submit.prevent="saveEdit(weeklyGoal.id)">
              <input :id="`edit-${weeklyGoal.id}`" v-model.number="editTarget" type="number" min="1" max="999" class="goals__edit-input">
              <button type="submit" class="goals__edit-save">Save</button>
              <button type="button" class="goals__edit-cancel" @click="editingId = null">Cancel</button>
            </form>
          </template>
          <template v-else>
            <h3 class="goals__subgoal-title">This Week</h3>
            <form class="goals__subgoal-set" @submit.prevent="createGoal('weekly')">
              <input v-model.number="newWeeklyTarget" type="number" min="1" max="99" placeholder="1" class="goals__edit-input">
              <button type="submit" class="goals__edit-save" :disabled="!newWeeklyTarget || newWeeklyTarget < 1">Set</button>
            </form>
          </template>
        </div>
      </div>

      <!-- Goal history -->
      <section v-if="pastYearlyGoals.length > 0" class="goals__history">
        <h2 class="goals__history-title">Past Years</h2>
        <ul class="goals__history-list">
          <li v-for="goal in pastYearlyGoals" :key="goal.id" class="goals__history-item">
            <span class="goals__history-year">{{ goal.year }}</span>
            <span class="goals__history-progress">
              {{ goal.booksCompleted }} / {{ goal.targetBooks }} books
            </span>
            <span
              class="goals__history-badge"
              :class="goal.booksCompleted >= goal.targetBooks ? 'goals__history-badge--complete' : 'goals__history-badge--incomplete'"
            >
              {{ goal.booksCompleted >= goal.targetBooks ? 'Completed' : 'Incomplete' }}
            </span>
          </li>
        </ul>
      </section>
      <!-- Books popover -->
      <Teleport to="body">
        <Transition name="popover">
          <div v-if="popoverGoal" class="goals-popover-overlay" @click.self="closePopover" @keydown.escape="closePopover">
            <div class="goals-popover" role="dialog" aria-label="Books for this goal">
              <header class="goals-popover__header">
                <h3 class="goals-popover__title">{{ popoverTitle }}</h3>
                <button class="goals-popover__close" aria-label="Close" @click="closePopover">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </header>
              <div v-if="popoverLoading" class="goals-popover__loading">Loading books&hellip;</div>
              <div v-else-if="popoverBooks.length === 0" class="goals-popover__empty">No books yet</div>
              <div v-else class="goals-popover__shelf">
                <ShelfRow :books="popoverBooks" :show-header="false" @open-book="openBookDetail" />
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Book detail panel (opened from popover) -->
      <BookDetailPanel
        v-if="detailBookId"
        :user-book-id="detailBookId"
        @close="detailBookId = null"
      />

    </template>
  </div>
</template>

<script setup lang="ts">
import type { Goal, PeriodType } from '~/composables/useGoals'

definePageMeta({ layout: 'default' })
useHead({ title: 'Goals — Bookshelf' })
useSeoMeta({
  ogTitle: 'Reading Goals — Bookshelf',
  ogDescription: 'Set yearly, monthly, and weekly reading goals and track your pace.',
})

const {
  loading, currentYear, currentMonth, currentWeek,
  yearlyGoal, monthlyGoal, weeklyGoal,
  progress, paceStatus, expectedBooks, paceLabel,
  goalProgress, goalPaceStatus, goalPaceLabel,
  pastYearlyGoals,
  fetchGoals, setGoal, updateGoal,
} = useGoals()
const { isGuest } = useGuest()
const toast = useToast()

const RADIUS = 50
const circumference = 2 * Math.PI * RADIUS
const yearlyOffset = computed(() => circumference * (1 - progress.value))

const monthName = computed(() =>
  new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
)

// Edit state (shared across all goal types)
const editingId = ref<string | null>(null)
const editTarget = ref(0)

// New goal targets
const newYearlyTarget = ref<number | null>(null)
const newMonthlyTarget = ref<number | null>(null)
const newWeeklyTarget = ref<number | null>(null)

// Books popover state — matches ShelfBook shape for ShelfRow
import type { ShelfBook } from '~/stores/library'
type GoalBook = ShelfBook
const popoverGoal = ref<Goal | null>(null)
const popoverBooks = ref<GoalBook[]>([])
const popoverLoading = ref(false)

// Book detail panel state
const detailBookId = ref<string | null>(null)

const popoverTitle = computed(() => {
  const g = popoverGoal.value
  if (!g) return ''
  if (g.periodType === 'yearly') return `${g.year} — ${g.booksCompleted} books read`
  if (g.periodType === 'monthly') {
    const name = new Date(g.year, g.periodValue - 1).toLocaleString('en-US', { month: 'long' })
    return `${name} ${g.year} — ${g.booksCompleted} books`
  }
  return `Week ${g.periodValue}, ${g.year} — ${g.booksCompleted} books`
})

async function openBooksPopover(goal: Goal) {
  popoverGoal.value = goal
  popoverBooks.value = []
  popoverLoading.value = true
  try {
    popoverBooks.value = await $fetch<GoalBook[]>(`/api/goals/${goal.id}/books`)
  }
  catch {
    toast.error('Failed to load books')
    popoverGoal.value = null
  }
  finally {
    popoverLoading.value = false
  }
}

function closePopover() {
  popoverGoal.value = null
  popoverBooks.value = []
}

function openBookDetail(userBookId: string) {
  closePopover()
  detailBookId.value = userBookId
}

function startEdit(goal: Goal) {
  editTarget.value = goal.targetBooks
  editingId.value = goal.id
}

async function saveEdit(goalId: string) {
  if (isGuest.value) {
    toast.success('Sign up to set reading goals')
    return
  }
  if (!editTarget.value || editTarget.value < 1) return
  const ok = await updateGoal(goalId, editTarget.value)
  if (ok) {
    editingId.value = null
    toast.success('Goal updated')
  }
}

async function createGoal(periodType: PeriodType) {
  if (isGuest.value) {
    toast.success('Sign up to set reading goals')
    return
  }
  const target = periodType === 'yearly' ? newYearlyTarget.value
    : periodType === 'monthly' ? newMonthlyTarget.value
      : newWeeklyTarget.value
  if (!target || target < 1) return
  const ok = await setGoal(target, periodType)
  if (ok) {
    toast.success('Goal set!')
    if (periodType === 'yearly') newYearlyTarget.value = null
    else if (periodType === 'monthly') newMonthlyTarget.value = null
    else newWeeklyTarget.value = null
  }
}

// Non-blocking fetch — no await, shows loading skeleton while fetching
fetchGoals()
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.goals {
  @include container;
  padding-top: $spacing-2xl;
  padding-bottom: $spacing-3xl;

  &__header {
    margin-bottom: $spacing-2xl;
  }

  &__title {
    @include heading($font-size-2xl);
  }

  // Loading
  &__loading {
    @include flex-column;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-3xl 0;
  }

  &__skeleton {
    background: var(--sub-bg-color);
    border-radius: $radius-md;
    animation: pulse 1.5s ease-in-out infinite;

    &--ring {
      width: 10rem;
      height: 10rem;
      border-radius: $radius-full;
    }

    &--text {
      width: 14rem;
      height: 1.25rem;
    }

    &--short {
      width: 8rem;
    }
  }

  // Current goal
  &__current {
    @include flex-column;
    align-items: center;
    gap: $spacing-xl;
    padding: $spacing-2xl;
    @include card-base;
    text-align: center;
  }

  &__section-label {
    @include heading($font-size-lg);
  }

  // Progress ring
  &__ring-container {
    position: relative;
    width: 10rem;
    height: 10rem;
  }

  &__ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__ring-bg {
    fill: none;
    stroke: var(--border-color);
    stroke-width: 8;
  }

  &__ring-fill {
    fill: none;
    stroke: var(--progress-color);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.8s ease;

    &--complete {
      stroke: var(--success-color);
    }
  }

  &__ring-label {
    position: absolute;
    inset: 0;
    @include flex-center;
    @include flex-column;
    gap: 0.125rem;
  }

  &__ring-count {
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__ring-target {
    @include meta-text;
  }

  // Info
  &__info {
    @include flex-column;
    align-items: center;
    gap: $spacing-sm;
  }

  &__pace {
    display: inline-block;
    padding: $spacing-xs $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;

    &--sm {
      font-size: $font-size-xs;
      padding: 0.125rem $spacing-sm;
    }

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

  &__expected {
    @include meta-text;
  }

  // Actions
  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-sm;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__view-books-btn {
    @include button-secondary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;

    &--sm {
      font-size: $font-size-xs;
      padding: 0.125rem $spacing-sm;
    }
  }

  &__subgoal-actions {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__edit-btn {
    @include button-secondary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;

    &--sm {
      font-size: $font-size-xs;
      padding: 0.125rem $spacing-sm;
    }
  }

  &__edit-form {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__edit-label {
    @include meta-text;
  }

  &__edit-input {
    width: 5rem;
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-base;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    background: var(--bg-color);
    color: var(--text-color);
    text-align: center;

    &:focus {
      outline: 2px solid var(--highlight-color);
      outline-offset: 1px;
    }
  }

  &__edit-save {
    @include button-primary;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
  }

  &__edit-cancel {
    @include button-base;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    color: var(--text-color-muted);
    background: none;
    border: none;

    &:hover {
      color: var(--text-color);
    }
  }

  // CTA
  &__cta {
    @include flex-column;
    align-items: center;
    text-align: center;
    gap: $spacing-md;
    padding: $spacing-3xl $spacing-xl;
    @include card-base;
  }

  &__cta-icon {
    font-size: 3rem;
  }

  &__cta-title {
    @include heading($font-size-xl);
  }

  &__cta-text {
    @include body-text;
    max-width: 28rem;
  }

  &__cta-form {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: $spacing-sm;
  }

  &__cta-label,
  &__cta-suffix {
    @include body-text;
  }

  &__cta-input {
    width: 5rem;
    padding: $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-lg;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    background: var(--bg-color);
    color: var(--text-color);
    text-align: center;

    &:focus {
      outline: 2px solid var(--highlight-color);
      outline-offset: 1px;
    }
  }

  &__cta-submit {
    @include button-primary;
  }

  // Subgoals row (monthly + weekly)
  &__subgoals {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-md;
    margin-top: $spacing-lg;

    @include respond-below($breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }

  &__subgoal {
    @include flex-column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-lg;
    @include card-base;
    text-align: center;
  }

  &__subgoal-title {
    font-family: $font-family-heading;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
  }

  &__subgoal-bar-wrapper {
    width: 100%;
    @include flex-column;
    gap: $spacing-xs;
  }

  &__subgoal-bar {
    width: 100%;
    height: 0.5rem;
    background: var(--border-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__subgoal-bar-fill {
    width: 100%;
    height: 100%;
    background: var(--progress-color);
    border-radius: $radius-full;
    transform-origin: left;
    transition: transform 0.6s ease;

    &--complete {
      background: var(--success-color);
    }
  }

  &__subgoal-count {
    @include meta-text;
  }

  &__subgoal-set {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  // History
  &__history {
    margin-top: $spacing-2xl;
  }

  &__history-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-md;
  }

  &__history-list {
    list-style: none;
    padding: 0;
    margin: 0;
    @include flex-column;
    gap: $spacing-sm;
  }

  &__history-item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    @include card-base;
  }

  &__history-year {
    font-family: $font-family-heading;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    min-width: 3rem;
  }

  &__history-progress {
    @include body-text;
    flex: 1;
  }

  &__history-badge {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-full;

    &--complete {
      background: color-mix(in srgb, var(--success-color) 15%, transparent);
      color: var(--success-color);
    }

    &--incomplete {
      background: color-mix(in srgb, var(--text-color-muted) 15%, transparent);
      color: var(--text-color-muted);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Books popover (Teleported to body — unscoped)
:global(.goals-popover-overlay) {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.55);
  animation: goals-fade-in 200ms ease both;
}

:global(.goals-popover) {
  position: relative;
  width: 100%;
  max-width: 36rem;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--surface-color);
  border-radius: $radius-xl;
  box-shadow: var(--shadow-lg);
  animation: goals-fade-in-scale 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

:global(.goals-popover__header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--surface-color);
  z-index: 1;
}

:global(.goals-popover__title) {
  font-family: $font-family-heading;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: var(--text-color);
}

:global(.goals-popover__close) {
  background: none;
  border: none;
  color: var(--text-color-muted);
  cursor: pointer;
  padding: $spacing-xs;
  line-height: 1;
  border-radius: $radius-sm;
  transition: color 0.15s ease;

  &:hover {
    color: var(--text-color);
  }
}

:global(.goals-popover__loading),
:global(.goals-popover__empty) {
  padding: $spacing-2xl;
  text-align: center;
  color: var(--text-color-muted);
  font-family: $font-family-body;
}

:global(.goals-popover__shelf) {
  padding: $spacing-md $spacing-lg $spacing-lg;
}

// Popover transition
:global(.popover-enter-active),
:global(.popover-leave-active) {
  transition: opacity 0.2s ease;
}

:global(.popover-enter-from),
:global(.popover-leave-to) {
  opacity: 0;
}

@keyframes goals-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes goals-fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
