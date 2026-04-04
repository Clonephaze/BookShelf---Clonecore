<template>
  <div class="page-stub">
    <h2 class="page-stub__title">Friends</h2>
    <p class="page-stub__text">Connect with your friends and see their reading activities — Phase 13</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Statistics — Bookshelf' })
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
