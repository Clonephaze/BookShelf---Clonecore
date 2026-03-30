<template>
  <div class="settings">
    <h2 class="settings__title">Settings</h2>

    <section class="settings__section">
      <h3 class="settings__section-title">Appearance</h3>
      <div class="settings__theme-options">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="settings__theme-btn"
          :class="{ 'settings__theme-btn--active': currentTheme === option.value }"
          @click="setTheme(option.value)"
        >
          <component :is="option.icon" :size="18" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </section>

    <section v-if="user" class="settings__section">
      <h3 class="settings__section-title">Account</h3>
      <div class="settings__account-info">
        <p><strong>Name:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Monitor, Sun, Moon, BookOpen, Contrast } from 'lucide-vue-next'
import type { Theme } from '~/composables/useTheme'

definePageMeta({ layout: 'default' })

useHead({ title: 'Settings — Bookshelf' })

const { user } = useAuth()
const { currentTheme, setTheme } = useTheme()

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'sepia', label: 'Sepia', icon: BookOpen },
  { value: 'contrast', label: 'High Contrast', icon: Contrast },
]
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.settings {
  @include container($content-max-width);

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-2xl;
  }

  &__section {
    margin-bottom: $spacing-2xl;
  }

  &__section-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid var(--border-color-subtle);
  }

  &__theme-options {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__theme-btn {
    @include button-tertiary;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;

    &--active {
      border-color: var(--highlight-color);
      color: var(--highlight-color);
      background-color: var(--highlight-color-subtle);
    }
  }

  &__account-info {
    @include flex-column;
    gap: $spacing-sm;
    @include body-text;

    strong {
      color: var(--text-color);
      font-weight: $font-weight-medium;
    }
  }
}
</style>
