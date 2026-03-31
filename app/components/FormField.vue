<template>
  <div class="form-field" :class="{ 'form-field--error': error }">
    <label :for="id" class="form-field__label">{{ label }}</label>
    <div class="form-field__input-wrap">
      <input
        :id="id"
        ref="inputRef"
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        class="form-field__input"
        :aria-describedby="error ? `${id}-error` : undefined"
        :aria-invalid="!!error"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <button
        v-if="type === 'password'"
        type="button"
        class="form-field__toggle"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <component :is="showPassword ? EyeOff : Eye" :size="18" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-error`" class="form-field__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  id: string
  label: string
  type?: string
  modelValue: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
  error?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPassword = ref(false)
const inputRef = ref<HTMLInputElement>()

const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type ?? 'text'
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.form-field {
  @include flex-column;
  gap: $spacing-xs;

  &__label {
    @include meta-text;
    font-weight: $font-weight-medium;
    color: var(--text-color);
  }

  &__input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    font-size: $font-size-base;
    color: var(--text-color);
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder {
      color: var(--text-color-muted);
    }

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
      box-shadow: 0 0 0 3px var(--highlight-color-subtle);
    }
    
    // Prevent autofill background color - clashes with color scheme
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--surface-color) inset;
      -webkit-text-fill-color: var(--text-color);
      caret-color: var(--text-color);
      transition: background-color 5000s ease-in-out 0s; //prevent chrome autofill background flash
    }
  }

  &__toggle {
    position: absolute;
    right: $spacing-sm;
    display: flex;
    align-items: center;
    padding: $spacing-xs;
    color: var(--text-color-muted);
    border-radius: $radius-sm;
    transition: color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      color: var(--text-color);
    }
  }

  &--error &__input {
    border-color: var(--error-color);

    &:focus {
      box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.15);
    }
  }

  &__error {
    font-size: $font-size-sm;
    color: var(--error-color);
  }
}
</style>
