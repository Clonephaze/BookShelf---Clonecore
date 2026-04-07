<template>
  <div class="layout-landing">
    <main>
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.layout-landing {
  min-height: 100dvh;
  background-color: var(--bg-color);
}
</style>
