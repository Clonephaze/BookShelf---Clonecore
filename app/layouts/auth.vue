<template>
  <div class="layout-auth">
    <main class="auth-container">
      <NuxtLink to="/" class="auth-brand" aria-label="Back to home">
        <h1>Bookshelf</h1>
      </NuxtLink>
      <NuxtLink to="/" class="auth-back">&larr; Back to home</NuxtLink>
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.layout-auth {
  @include flex-center;
  min-height: 100dvh;
  padding: $spacing-md;
  background-color: var(--bg-color);
}

.auth-container {
  width: 100%;
  max-width: 24rem;
}

.auth-brand {
  display: block;
  margin-bottom: $spacing-sm;
  text-align: center;
  text-decoration: none;

  h1 {
    @include heading($font-size-2xl);
    font-weight: $font-weight-bold;
  }
}

.auth-back {
  @include meta-text;
  display: block;
  text-align: center;
  margin-bottom: $spacing-xl;
  color: var(--text-color-muted);

  &:hover {
    color: var(--highlight-color);
  }
}
</style>
