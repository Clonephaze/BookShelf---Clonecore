import { defineVitestConfig } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    dir: 'tests',
  },
  resolve: {
    alias: {
      'virtual:pwa-register/vue': fileURLToPath(new URL('./tests/__mocks__/pwa-register.ts', import.meta.url)),
    },
  },
})
