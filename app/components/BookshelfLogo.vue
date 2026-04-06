<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 512 512"
    class="bookshelf-logo"
    aria-hidden="true"
    role="img"
  >
    <rect v-if="!noBg" width="512" height="512" :rx="rounded ? 96 : 0" :fill="bg" />
    <g transform="translate(256,256)">
      <!-- Book spine -->
      <rect x="-80" y="-120" width="160" height="240" rx="8" fill="#A0592A" />
      <!-- Pages -->
      <rect x="-68" y="-108" width="136" height="216" rx="4" fill="#F4EBDB" />
      <!-- Text lines -->
      <rect x="-48" y="-72" width="96" height="6" rx="3" fill="#D3C7B3" />
      <rect x="-48" y="-54" width="72" height="6" rx="3" fill="#D3C7B3" />
      <rect x="-48" y="-36" width="84" height="6" rx="3" fill="#D3C7B3" />
      <!-- Bookmark ribbon -->
      <path d="M32,-108 L32,-40 L44,-56 L56,-40 L56,-108 Z" fill="#D4A03E" />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string
  rounded?: boolean
  bg?: string
  noBg?: boolean
}>(), {
  size: 24,
  rounded: true,
  bg: '#302318',
  noBg: false,
})
</script>

<style lang="scss" scoped>
.bookshelf-logo {
  display: block;
  flex-shrink: 0;
}
</style>
