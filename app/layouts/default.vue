<template>
  <div class="layout-default">
    <a href="#main-content" class="skip-to-content">Skip to main content</a>

    <aside class="sidebar">
      <div class="sidebar__header">
        <NuxtLink to="/library" class="sidebar__brand">
          <h1 class="sidebar__logo">Bookshelf</h1>
        </NuxtLink>
        <ThemeSwitcher />
      </div>

      <SidebarNav :shelves="shelvesStore.shelves" />

      <div class="sidebar__footer">
        <div v-if="user" class="sidebar__user">
          <span class="sidebar__user-name">{{ user.name }}</span>
          <button class="sidebar__sign-out" @click="handleSignOut">
            Sign out
          </button>
        </div>
      </div>
    </aside>

    <main id="main-content" class="main-content">
      <header class="topbar">
        <NuxtLink to="/library" class="topbar__brand">
          <span class="topbar__logo">Bookshelf</span>
        </NuxtLink>
        <ThemeSwitcher />
      </header>

      <div class="main-content__inner">
        <slot />
      </div>
    </main>

    <MobileNav />
  </div>
</template>

<script setup lang="ts">
const { user, signOut, isAuthenticated } = useAuth()
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const shelvesStore = useShelvesStore()

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
  display: flex;
  min-height: 100dvh;
}

// --- Sidebar (desktop) ---

.sidebar {
  @include flex-column;
  position: sticky;
  top: 0;
  width: $sidebar-width;
  height: 100dvh;
  padding: $spacing-lg $spacing-sm;
  background-color: var(--sub-bg-color);
  border-right: 1px solid var(--border-color-subtle);
  overflow-y: auto;

  @include respond-below($breakpoint-lg) {
    display: none;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $spacing-sm;
    margin-bottom: $spacing-xl;
  }

  &__brand {
    text-decoration: none;
  }

  &__logo {
    font-family: $font-family-heading;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__footer {
    margin-top: auto;
    padding-top: $spacing-lg;
    border-top: 1px solid var(--border-color-subtle);
  }

  &__user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm;
    gap: $spacing-sm;
  }

  &__user-name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color);
    @include truncate;
  }

  &__sign-out {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    white-space: nowrap;
    transition: color $transition-fast;
    @include focus-visible-highlight;

    &:hover {
      color: var(--error-color);
    }
  }
}

// --- Topbar (mobile) ---

.topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid var(--border-color-subtle);

  @include respond-below($breakpoint-lg) {
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
  min-width: 0;
  @include flex-column;

  &__inner {
    flex: 1;
    padding: $spacing-lg $spacing-xl;

    @include respond-below($breakpoint-md) {
      padding: $spacing-md;
      padding-bottom: calc($spacing-md + 4rem); // Space for mobile nav
    }
  }
}
</style>
