<template>
  <div class="page-stub">
    <h2 class="page-stub__title">Search</h2>
    <p class="page-stub__text">Find books by title, author, or ISBN — Phase 2</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Search — Bookshelf' })
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
