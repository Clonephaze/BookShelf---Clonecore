// Mock for virtual:pwa-register/vue (used by @vite-pwa/nuxt)
import { ref } from 'vue'

export function useRegisterSW() {
  return {
    needRefresh: ref(false),
    offlineReady: ref(false),
    updateServiceWorker: () => Promise.resolve(),
  }
}
