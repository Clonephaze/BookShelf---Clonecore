<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  loading?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [query: string]
}>()

const inputRef = ref<HTMLInputElement>()
const localValue = ref(props.modelValue)

let debounceTimer: ReturnType<typeof setTimeout>

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  localValue.value = value
  emit('update:modelValue', value)

  clearTimeout(debounceTimer)
  if (value.trim().length >= 2) {
    debounceTimer = setTimeout(() => {
      emit('search', value.trim())
    }, 400)
  }
}

function onSubmit() {
  clearTimeout(debounceTimer)
  const trimmed = localValue.value.trim()
  if (trimmed.length >= 2) {
    emit('search', trimmed)
  }
}

function onClear() {
  localValue.value = ''
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

onMounted(() => {
  inputRef.value?.focus()
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
})
</script>

<template>
  <form
    class="search-bar"
    role="search"
    @submit.prevent="onSubmit"
  >
    <div class="search-bar__input-wrapper">
      <svg
        class="search-bar__icon"
        :class="{ 'search-bar__icon--loading': loading }"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref="inputRef"
        type="search"
        class="search-bar__input"
        :value="localValue"
        :placeholder="placeholder || 'Search by title, author, or ISBN...'"
        aria-label="Search books"
        autocomplete="off"
        @input="onInput"
      >
      <button
        v-if="localValue"
        type="button"
        class="search-bar__clear"
        aria-label="Clear search"
        @click="onClear"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.search-bar {
  width: 100%;

  &__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__icon {
    position: absolute;
    left: $spacing-md;
    color: var(--text-color-muted);
    pointer-events: none;
    transition: color 0.2s ease;

    &--loading {
      animation: spin 1s linear infinite;
    }
  }

  &__input {
    width: 100%;
    padding: $spacing-sm $spacing-2xl;
    padding-left: calc($spacing-md + 20px + $spacing-sm);
    font-family: $font-family-body;
    font-size: $font-size-base;
    color: var(--text-color);
    background: var(--surface-color);
    border: 2px solid var(--border-color);
    border-radius: $radius-lg;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &::placeholder {
      color: var(--text-color-muted);
    }

    &:focus {
      border-color: var(--highlight-color);
      box-shadow: 0 0 0 3px var(--highlight-color-subtle);
    }

    // Remove default search cancel button
    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__clear {
    position: absolute;
    right: $spacing-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    color: var(--text-color-muted);
    background: none;
    border: none;
    border-radius: $radius-full;
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
