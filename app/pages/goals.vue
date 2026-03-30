<template>
  <div class="page-stub">
    <h2 class="page-stub__title">Reading Goals</h2>
    <p class="page-stub__text">Set and track your annual reading goal — Phase 4</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Goals — Bookshelf' })
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.page-stub {
  @include flex-column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-sm;
  }

  &__text {
    @include body-text;
  }
}
</style>
