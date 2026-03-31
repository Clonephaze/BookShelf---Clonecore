<template>
  <NuxtLayout name="landing">
    <div class="landing-hero">
      <h1 class="landing-hero__title">Your reading life, beautifully organized.</h1>
      <p class="landing-hero__subtitle">
        Search for books, organize your shelves, track your progress, and explore your reading year.
      </p>
      <div class="landing-hero__actions">
        <div class="landing-hero__actions-row">
          <NuxtLink to="/signup" class="btn btn--primary">Sign Up</NuxtLink>
          <NuxtLink to="/login" class="btn btn--secondary">Sign In</NuxtLink>
        </div>
        <button class="btn btn--ghost" @click="enterGuestMode">Try as Guest</button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { enterGuestMode } = useGuest()
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.landing-hero {
  @include flex-column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: $spacing-xl;
  text-align: center;

  &__title {
    @include heading($font-size-3xl);
    max-width: 16ch;
    margin-bottom: $spacing-lg;
  }

  &__subtitle {
    @include body-text;
    max-width: 48ch;
    margin-bottom: $spacing-2xl;
    color: var(--text-color-secondary);
    font-size: $font-size-lg;
  }

  &__actions {
    @include flex-column;
    align-items: center;
    gap: $spacing-md;
  }

  &__actions-row {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;
    justify-content: center;
  }
}

.btn {
  &--primary {
    @include button-primary;
  }

  &--secondary {
    @include button-secondary;
  }

  &--ghost {
    @include body-text;
    background: transparent;
    border: none;
    color: var(--text-color-secondary);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: $spacing-xs $spacing-sm;
    transition: color 0.15s;

    &:hover {
      color: var(--highlight-color);
    }
  }
}
</style>
