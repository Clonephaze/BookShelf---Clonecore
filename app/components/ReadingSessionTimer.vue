<template>
  <div v-if="session.active" class="session-timer" :class="{ 'session-timer--ambient': ambient }">
    <!-- Ambient mode: minimal overlay -->
    <template v-if="ambient">
      <div class="session-timer__ambient-backdrop" @click="ambient = false" />
      <div class="session-timer__ambient-content">
        <img
          v-if="session.active.bookCoverSmall || session.active.bookCover"
          :src="session.active.bookCoverSmall || session.active.bookCover!"
          :alt="session.active.bookTitle"
          class="session-timer__ambient-cover"
        >
        <span class="session-timer__ambient-time">{{ session.displayTime }}</span>
        <span class="session-timer__ambient-title">{{ session.active.bookTitle }}</span>
        <button class="session-timer__ambient-exit" @click="ambient = false">
          <Minimize2 :size="20" />
        </button>
      </div>
    </template>

    <!-- Normal mode -->
    <template v-else>
      <div class="session-timer__card">
        <div class="session-timer__header">
          <div class="session-timer__book-info">
            <img
              v-if="session.active.bookCoverSmall"
              :src="session.active.bookCoverSmall"
              :alt="session.active.bookTitle"
              class="session-timer__cover"
            >
            <div class="session-timer__meta">
              <span class="session-timer__book-title">{{ session.active.bookTitle }}</span>
              <span class="session-timer__book-author">{{ session.active.bookAuthor }}</span>
            </div>
          </div>
          <button
            class="session-timer__ambient-btn"
            aria-label="Ambient mode"
            title="Ambient mode"
            @click="ambient = true"
          >
            <Maximize2 :size="18" />
          </button>
        </div>

        <!-- Timer display -->
        <div class="session-timer__display">
          <!-- Progress ring for countdown -->
          <svg
            v-if="session.active.timerMode === 'countdown'"
            class="session-timer__ring"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--border-color)"
              stroke-width="6"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--progress-color)"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="ringOffset"
              class="session-timer__ring-progress"
            />
          </svg>
          <div class="session-timer__time-wrapper">
            <span class="session-timer__time">{{ session.displayTime }}</span>
            <span class="session-timer__mode-label">
              {{ session.active.timerMode === 'countdown' ? 'remaining' : 'elapsed' }}
            </span>
          </div>
        </div>

        <!-- Controls -->
        <div class="session-timer__controls">
          <button
            v-if="session.active.status === 'active'"
            class="session-timer__btn session-timer__btn--secondary"
            @click="handlePause"
          >
            <Pause :size="18" />
            Pause
          </button>
          <button
            v-else
            class="session-timer__btn session-timer__btn--primary"
            @click="handleResume"
          >
            <Play :size="18" />
            Resume
          </button>

          <button
            class="session-timer__btn session-timer__btn--finish"
            @click="showEndPrompt = true"
          >
            <CheckCircle :size="18" />
            Finish
          </button>

          <button
            class="session-timer__btn session-timer__btn--ghost"
            @click="showAbandonConfirm = true"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Countdown finished banner -->
        <div v-if="session.isCountdownFinished" class="session-timer__finished-banner">
          <Bell :size="16" />
          <span>Timer complete! Finish when you're ready.</span>
        </div>
      </div>

      <!-- End session prompt -->
      <Teleport to="body">
        <div v-if="showEndPrompt" class="session-timer__overlay" @click.self="showEndPrompt = false">
          <div class="session-timer__prompt" role="dialog" aria-label="End reading session">
            <h3 class="session-timer__prompt-title">Finish Session</h3>
            <p class="session-timer__prompt-subtitle">
              {{ session.formatDuration(session.totalSeconds) }} reading
              <strong>{{ session.active.bookTitle }}</strong>
            </p>
            <div class="session-timer__prompt-field">
              <label for="session-end-page">What page are you on now?</label>
              <input
                id="session-end-page"
                v-model.number="endPageInput"
                type="number"
                :min="session.active.startPage ?? 0"
                :max="session.active.bookPageCount ?? undefined"
                :placeholder="session.active.startPage != null ? `Started at page ${session.active.startPage}` : 'Page number'"
              >
              <span v-if="pagesReadPreview != null" class="session-timer__prompt-pages">
                {{ pagesReadPreview }} pages read
              </span>
            </div>
            <div class="session-timer__prompt-actions">
              <button class="session-timer__btn session-timer__btn--secondary" @click="showEndPrompt = false">
                Cancel
              </button>
              <button class="session-timer__btn session-timer__btn--primary" @click="handleComplete">
                Save Session
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Abandon confirm -->
      <Teleport to="body">
        <div v-if="showAbandonConfirm" class="session-timer__overlay" @click.self="showAbandonConfirm = false">
          <div class="session-timer__prompt" role="dialog" aria-label="Abandon session">
            <h3 class="session-timer__prompt-title">Abandon Session?</h3>
            <p class="session-timer__prompt-subtitle">
              This will discard your {{ session.formatDuration(session.totalSeconds) }} session.
            </p>
            <div class="session-timer__prompt-actions">
              <button class="session-timer__btn session-timer__btn--secondary" @click="showAbandonConfirm = false">
                Keep Reading
              </button>
              <button class="session-timer__btn session-timer__btn--danger" @click="handleAbandon">
                Abandon
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Pause, Play, CheckCircle, X, Maximize2, Minimize2, Bell } from 'lucide-vue-next'

const session = useSessionStore()
const toast = useToast()
const libraryStore = useLibraryStore()

const emit = defineEmits<{
  completed: []
  abandoned: []
}>()

const ambient = ref(false)
const showEndPrompt = ref(false)
const showAbandonConfirm = ref(false)
const endPageInput = ref<number | null>(null)

const pagesReadPreview = computed(() => {
  if (endPageInput.value == null || session.active?.startPage == null) return null
  const diff = endPageInput.value - session.active.startPage
  return diff > 0 ? diff : null
})

// Countdown ring
const circumference = 2 * Math.PI * 52
const ringOffset = computed(() => {
  if (!session.active || session.active.timerMode !== 'countdown') return 0
  const target = session.active.timerDurationSeconds ?? 1
  const progress = Math.min(1, session.totalSeconds / target)
  return circumference * (1 - progress)
})

// Pre-fill endPage from book's currentPage when prompt opens
watch(showEndPrompt, (open) => {
  if (open && session.active) {
    endPageInput.value = session.active.currentPage ?? session.active.startPage ?? null
  }
})

async function handlePause() {
  try {
    await session.pause()
  }
  catch {
    toast.error('Failed to pause')
  }
}

async function handleResume() {
  try {
    await session.resume()
  }
  catch {
    toast.error('Failed to resume')
  }
}

async function handleComplete() {
  try {
    await session.complete(endPageInput.value ?? undefined)
    showEndPrompt.value = false
    toast.success('Session saved!')
    libraryStore.revalidate()
    emit('completed')
  }
  catch {
    toast.error('Failed to save session')
  }
}

async function handleAbandon() {
  try {
    await session.abandon()
    showAbandonConfirm.value = false
    toast.success('Session abandoned')
    emit('abandoned')
  }
  catch {
    toast.error('Failed to abandon session')
  }
}

// ESC to close modals
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showEndPrompt.value) showEndPrompt.value = false
    else if (showAbandonConfirm.value) showAbandonConfirm.value = false
    else if (ambient.value) ambient.value = false
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.session-timer {
  &__card {
    @include card-base;
    padding: $spacing-lg;
    @include flex-column;
    gap: $spacing-md;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
  }

  &__book-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    min-width: 0;
    flex: 1;
  }

  &__cover {
    width: 2.5rem;
    height: 3.75rem;
    object-fit: cover;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    flex-shrink: 0;
  }

  &__meta {
    @include flex-column;
    gap: 2px;
    min-width: 0;
  }

  &__book-title {
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__book-author {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__ambient-btn {
    @include button-base;
    padding: $spacing-xs;
    color: var(--text-color-muted);
    background: transparent;
    border: none;
    border-radius: $radius-sm;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }
  }

  // Timer display
  &__display {
    @include flex-center;
    position: relative;
    padding: $spacing-lg 0;
  }

  &__ring {
    position: absolute;
    width: 9rem;
    height: 9rem;
    transform: rotate(-90deg);
  }

  &__ring-progress {
    transition: stroke-dashoffset 1s linear;
  }

  &__time-wrapper {
    @include flex-column;
    align-items: center;
    gap: 2px;
    z-index: 1;
  }

  &__time {
    font-family: $font-family-heading;
    font-size: clamp(2rem, 6vw, 3rem);
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__mode-label {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  // Controls
  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
  }

  &__btn {
    @include button-base;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: all 0.15s ease;
    border: 1px solid transparent;

    &--primary {
      background: var(--highlight-color);
      color: var(--highlight-text-color);

      &:hover {
        filter: brightness(1.1);
      }
    }

    &--secondary {
      background: var(--sub-bg-color);
      color: var(--text-color);
      border-color: var(--border-color);

      &:hover {
        background: var(--border-color);
      }
    }

    &--finish {
      background: color-mix(in srgb, var(--progress-color) 15%, transparent);
      color: var(--progress-color);
      border-color: color-mix(in srgb, var(--progress-color) 30%, transparent);

      &:hover {
        background: color-mix(in srgb, var(--progress-color) 25%, transparent);
      }
    }

    &--danger {
      background: color-mix(in srgb, #ef5350 15%, transparent);
      color: #ef5350;
      border-color: color-mix(in srgb, #ef5350 30%, transparent);

      &:hover {
        background: color-mix(in srgb, #ef5350 25%, transparent);
      }
    }

    &--ghost {
      background: transparent;
      color: var(--text-color-muted);
      padding: $spacing-sm;

      &:hover {
        color: #ef5350;
        background: color-mix(in srgb, #ef5350 10%, transparent);
      }
    }
  }

  &__finished-banner {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: color-mix(in srgb, var(--progress-color) 12%, transparent);
    border-radius: $radius-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--progress-color);
  }

  // Ambient mode
  &__ambient-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    z-index: 200;
    cursor: pointer;
  }

  &__ambient-content {
    position: fixed;
    inset: 0;
    z-index: 201;
    @include flex-column;
    align-items: center;
    justify-content: center;
    gap: $spacing-lg;
  }

  &__ambient-cover {
    width: 8rem;
    height: 12rem;
    object-fit: cover;
    border-radius: $radius-md;
    box-shadow: var(--shadow-lg);
  }

  &__ambient-time {
    font-family: $font-family-heading;
    font-size: clamp(3rem, 10vw, 5rem);
    font-weight: $font-weight-bold;
    color: white;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__ambient-title {
    font-family: $font-family-body;
    font-size: $font-size-base;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    max-width: 20rem;
  }

  &__ambient-exit {
    position: fixed;
    top: $spacing-lg;
    right: $spacing-lg;
    @include button-base;
    padding: $spacing-sm;
    color: rgba(255, 255, 255, 0.5);
    background: transparent;
    border: none;

    &:hover {
      color: white;
    }
  }

  // Overlay + prompt
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 150;
    @include flex-center;
    padding: $spacing-md;
  }

  &__prompt {
    @include card-base;
    padding: $spacing-xl;
    max-width: 24rem;
    width: 100%;
    @include flex-column;
    gap: $spacing-md;
  }

  &__prompt-title {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__prompt-subtitle {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    line-height: 1.5;

    strong {
      color: var(--text-color);
    }
  }

  &__prompt-field {
    @include flex-column;
    gap: $spacing-xs;

    label {
      font-family: $font-family-body;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: var(--text-color);
    }

    input {
      padding: $spacing-sm $spacing-md;
      border: 1px solid var(--border-color);
      border-radius: $radius-md;
      background: var(--sub-bg-color);
      color: var(--text-color);
      font-family: $font-family-body;
      font-size: $font-size-base;
      width: 100%;

      &:focus {
        outline: none;
        border-color: var(--highlight-color);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--highlight-color) 25%, transparent);
      }
    }
  }

  &__prompt-pages {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--progress-color);
    font-weight: $font-weight-medium;
  }

  &__prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding-top: $spacing-sm;
  }
}
</style>
