<script setup lang="ts">
import { useImportStore } from '~/stores/import'

const paletteOpen = ref(false)
const importStore = useImportStore()

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
  }
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (importStore.isImporting) {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CommandPalette
      :visible="paletteOpen"
      @close="paletteOpen = false"
    />
  </div>
</template>
