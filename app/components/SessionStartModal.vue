<template>
  <Teleport to="body">
    <div v-if="open" class="start-session__overlay" @click.self="emit('close')">
      <div class="start-session__modal" role="dialog" aria-label="Start reading session">
        <h3 class="start-session__title">Start Reading Session</h3>

        <div v-if="bookTitle" class="start-session__book">
          <img
            v-if="bookCover"
            :src="bookCover"
            :alt="bookTitle"
            class="start-session__cover"
            width="60"
            height="90"
            loading="lazy"
          >
          <div class="start-session__book-meta">
            <span class="start-session__book-title">{{ bookTitle }}</span>
            <span v-if="bookAuthor" class="start-session__book-author">{{ bookAuthor }}</span>
          </div>
        </div>

        <!-- Timer mode -->
        <fieldset class="start-session__fieldset">
          <legend class="start-session__legend">Timer Mode</legend>
          <div class="start-session__mode-options">
            <button
              class="start-session__mode-btn"
              :class="{ 'start-session__mode-btn--active': mode === 'open' }"
              @click="mode = 'open'"
            >
              <Clock :size="18" />
              <span>Open-ended</span>
              <span class="start-session__mode-desc">Read as long as you like</span>
            </button>
            <button
              class="start-session__mode-btn"
              :class="{ 'start-session__mode-btn--active': mode === 'countdown' }"
              @click="mode = 'countdown'"
            >
              <Timer :size="18" />
              <span>Countdown</span>
              <span class="start-session__mode-desc">Set a target duration</span>
            </button>
          </div>
        </fieldset>

        <!-- Duration picker (countdown only) -->
        <div v-if="mode === 'countdown'" class="start-session__duration">
          <label for="session-duration" class="start-session__label">Duration</label>
          <div class="start-session__duration-presets">
            <button
              v-for="d in durationPresets"
              :key="d.seconds"
              class="start-session__preset"
              :class="{ 'start-session__preset--active': durationSeconds === d.seconds }"
              @click="durationSeconds = d.seconds"
            >
              {{ d.label }}
            </button>
          </div>
          <div class="start-session__duration-custom">
            <input
              id="session-duration"
              v-model.number="customMinutes"
              type="number"
              min="1"
              max="480"
              placeholder="Custom"
              @input="durationSeconds = (customMinutes || 30) * 60"
            >
            <span>minutes</span>
          </div>
        </div>

        <!-- Start page -->
        <div class="start-session__field">
          <label for="session-start-page" class="start-session__label">Starting page</label>
          <input
            id="session-start-page"
            v-model.number="startPage"
            type="number"
            min="0"
            :max="bookPageCount ?? undefined"
            :placeholder="currentPage != null ? `Current: page ${currentPage}` : 'Page number'"
          >
        </div>

        <!-- Actions -->
        <div class="start-session__actions">
          <button class="start-session__btn start-session__btn--secondary" @click="emit('close')">
            Cancel
          </button>
          <button class="start-session__btn start-session__btn--primary" :disabled="starting" @click="handleStart">
            <Play :size="16" />
            {{ starting ? 'Starting…' : 'Start Session' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Clock, Timer, Play } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  userBookId: string
  bookTitle: string
  bookAuthor?: string
  bookCover?: string | null
  bookPageCount?: number | null
  currentPage?: number | null
}>()

const emit = defineEmits<{
  close: []
  started: []
}>()

const session = useSessionStore()
const toast = useToast()

const mode = ref<'open' | 'countdown'>('open')
const durationSeconds = ref(1800) // 30 minutes default
const customMinutes = ref<number | null>(null)
const startPage = ref<number | null>(null)
const starting = ref(false)

const durationPresets = [
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 },
]

// Pre-fill start page from current page
watch(() => props.open, (open) => {
  if (open) {
    startPage.value = props.currentPage ?? null
    mode.value = 'open'
    durationSeconds.value = 1800
    customMinutes.value = null
  }
})

async function handleStart() {
  starting.value = true
  try {
    await session.startSession({
      userBookId: props.userBookId,
      timerMode: mode.value,
      timerDurationSeconds: mode.value === 'countdown' ? durationSeconds.value : undefined,
      startPage: startPage.value ?? undefined,
    })
    emit('started')
    emit('close')
    toast.success('Session started!')
  }
  catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message || 'Failed to start session'
    toast.error(msg)
  }
  finally {
    starting.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.start-session {
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 150;
    @include flex-center;
    padding: $spacing-md;
  }

  &__modal {
    @include card-base;
    padding: $spacing-xl;
    max-width: 28rem;
    width: 100%;
    @include flex-column;
    gap: $spacing-lg;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__book {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: var(--sub-bg-color);
    border-radius: $radius-md;
  }

  &__cover {
    width: 2.5rem;
    height: 3.75rem;
    object-fit: cover;
    border-radius: $radius-sm;
    flex-shrink: 0;
  }

  &__book-meta {
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

  &__fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  &__legend {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color);
    margin-bottom: $spacing-sm;
  }

  &__mode-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-sm;
  }

  &__mode-btn {
    @include button-base;
    @include flex-column;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-md;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    background: var(--surface-color);
    color: var(--text-color);
    text-align: center;
    transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      border-color: var(--highlight-color);
    }

    &--active {
      border-color: var(--highlight-color);
      background: color-mix(in srgb, var(--highlight-color) 8%, var(--surface-color));
      box-shadow: 0 0 0 1px var(--highlight-color);
    }

    span:first-of-type {
      font-weight: $font-weight-semibold;
      font-size: $font-size-sm;
    }
  }

  &__mode-desc {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    font-weight: $font-weight-regular !important;
  }

  &__label {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color);
    margin-bottom: $spacing-xs;
    display: block;
  }

  &__duration {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__duration-presets {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__preset {
    @include button-base;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid var(--border-color);
    border-radius: $radius-full;
    background: transparent;
    color: var(--text-color-muted);
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;

    &:hover {
      border-color: var(--highlight-color);
      color: var(--text-color);
    }

    &--active {
      background: var(--highlight-color);
      color: var(--highlight-text-color);
      border-color: var(--highlight-color);
    }
  }

  &__duration-custom {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    input {
      width: 5rem;
      padding: $spacing-xs $spacing-sm;
      border: 1px solid var(--border-color);
      border-radius: $radius-md;
      background: var(--sub-bg-color);
      color: var(--text-color);
      font-family: $font-family-body;
      font-size: $font-size-sm;

      &:focus {
        outline: none;
        border-color: var(--highlight-color);
      }
    }

    span {
      font-family: $font-family-body;
      font-size: $font-size-sm;
      color: var(--text-color-muted);
    }
  }

  &__field {
    @include flex-column;
    gap: $spacing-xs;

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

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding-top: $spacing-sm;
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
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
    border: 1px solid transparent;

    &--primary {
      background: var(--highlight-color);
      color: var(--highlight-text-color);

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
  }
}
</style>
