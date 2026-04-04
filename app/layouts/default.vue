<template>
  <div class="layout-default">
    <a href="#main-content" class="skip-to-content">Skip to main content</a>

    <HeaderNav :user="user" />

    <!-- Mobile topbar (phone only) -->
    <header class="topbar">
      <NuxtLink to="/library" class="topbar__brand">
        <span class="topbar__logo">Bookshelf</span>
      </NuxtLink>
      <ThemeSwitcher />
    </header>

    <main id="main-content" class="main-content">
      <div class="main-content__inner">
        <slot />
      </div>
    </main>

    <MobileNav :more-open="moreSheetOpen" @toggle-more="moreSheetOpen = !moreSheetOpen" />
    <MobileMoreSheet :open="moreSheetOpen" @close="moreSheetOpen = false" />
  </div>
</template>

<script setup lang="ts">
const { user, signOut, isAuthenticated } = useAuth()
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const shelvesStore = useShelvesStore()

const moreSheetOpen = ref(false)

// Close sheet on route change
const route = useRoute()
watch(() => route.path, () => {
  moreSheetOpen.value = false
})

watch(isAuthenticated, (val) => {
  if (val) shelvesStore.fetch()
}, { immediate: true })

async function handleSignOut() {
  await signOut()
  await navigateTo('/login')
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.layout-default {
  @include flex-column;
  min-height: 100dvh;
}

// --- Mobile topbar (phone only) ---

.topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  background-color: var(--sub-bg-color);
  border-bottom: 1px solid var(--border-color-subtle);

  @include respond-below($breakpoint-md) {
    display: flex;
  }

  &__brand {
    text-decoration: none;
  }

  &__logo {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }
}

// --- Main content ---

.main-content {
  flex: 1;
  @include flex-column;

  &__inner {
    flex: 1;
    max-width: $page-max-width;
    width: 100%;
    margin: 0 auto;
    padding: $spacing-lg $spacing-xl;

    @include respond-below($breakpoint-md) {
      padding: $spacing-md;
      padding-bottom: calc($spacing-md + 5rem); // Space for mobile nav + center FAB
    }
  }
}
</style>
