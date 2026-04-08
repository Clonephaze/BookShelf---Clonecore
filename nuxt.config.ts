// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  css: [
    '~/assets/scss/main.scss',
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        } as Record<string, unknown>,
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Bookshelf',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Your reading life, beautifully organized.' },
        { name: 'theme-color', content: '#302318' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap' },
      ],
    },
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    hardcoverApiToken: process.env.HARDCOVER_API_TOKEN,
    public: {
      // Used as SSR fallback only — browser uses window.location.origin automatically.
      // Set BETTER_AUTH_URL in Vercel env vars for correct reset-password email links.
      betterAuthUrl: process.env.BETTER_AUTH_URL || '',
      devMode: process.env.BOOKSHELF_DEV === 'true',
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Bookshelf',
      short_name: 'Bookshelf',
      description: 'Every book tells a story. Yours starts here.',
      theme_color: '#302318',
      background_color: '#302318',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/pwa-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'book-covers',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 7,
            },
            cacheableResponse: { statuses: [0, 200] },
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: /^https:\/\/books\.google\.com\/books\/content.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'google-covers',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 7,
            },
            cacheableResponse: { statuses: [0, 200] },
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: /^https:\/\/production-img\.hardcover\.app\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'hardcover-covers',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 7,
            },
            cacheableResponse: { statuses: [0, 200] },
            networkTimeoutSeconds: 5,
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-stylesheets',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
    },
  },

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '0',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "worker-src 'self' blob:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://covers.openlibrary.org https://archive.org https://*.archive.org https://*.google.com https://*.googleusercontent.com https://production-img.hardcover.app https://assets.hardcover.app",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "media-src 'self' data: blob:",
          ].join('; '),
        },
      },
    },
  },
})
