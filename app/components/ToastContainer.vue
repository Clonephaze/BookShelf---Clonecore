<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="toast-container" aria-live="polite">
        <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          role="status"
        >
          {{ toast.message }}
        </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.toast-container {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  pointer-events: none;

  @include respond-to($breakpoint-md) {
    bottom: $spacing-xl;
  }
}

.toast {
  padding: $spacing-sm $spacing-lg;
  font-family: $font-family-body;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  border-radius: $radius-lg;
  box-shadow: var(--shadow-md);
  pointer-events: auto;

  &--success {
    color: #fff;
    background: var(--success-color);
  }

  &--error {
    color: #fff;
    background: var(--error-color);
  }
}

.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(1rem) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.95);
}
</style>
