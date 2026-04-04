<template>
  <div
    class="user-avatar"
    :class="[`user-avatar--${size}`]"
    :style="!avatarSrc ? { backgroundColor: 'var(--highlight-color-subtle)', color: 'var(--highlight-color)' } : undefined"
  >
    <img
      v-if="avatarSrc"
      :src="avatarSrc"
      :alt="name || 'User avatar'"
      class="user-avatar__img"
    >
    <span v-else class="user-avatar__initial">{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  avatarId?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
}>()

const avatarSrc = computed(() => {
  const avatar = getAvatar(props.avatarId)
  return avatar?.src ?? null
})

const initial = computed(() =>
  props.name?.charAt(0)?.toUpperCase() ?? '?',
)
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  &--sm {
    width: 28px;
    height: 28px;
  }

  &--md, &:not(.user-avatar--sm):not(.user-avatar--lg) {
    width: 36px;
    height: 36px;
  }

  &--lg {
    width: 64px;
    height: 64px;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__initial {
    font-family: $font-family-heading;
    font-weight: $font-weight-bold;
    line-height: 1;
    user-select: none;

    .user-avatar--sm & {
      font-size: 0.75rem;
    }

    .user-avatar--md &,
    .user-avatar:not(.user-avatar--sm):not(.user-avatar--lg) & {
      font-size: 0.875rem;
    }

    .user-avatar--lg & {
      font-size: 1.5rem;
    }
  }
}
</style>
