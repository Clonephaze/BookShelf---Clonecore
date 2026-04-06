<template>
  <div class="layout-default">
    <a href="#main-content" class="skip-to-content">Skip to main content</a>

    <HeaderNav :user="user" @sign-out="handleSignOut" />

    <!-- Mobile topbar (phone only) -->
    <header class="topbar">
      <NuxtLink to="/library" class="topbar__brand">
        <BookshelfLogo :size="64" no-bg />
        <span class="topbar__logo">Bookshelf</span>
      </NuxtLink>
      <div class="topbar__actions">
        <ThemeSwitcher />
        <template v-if="isGuest">
          <NuxtLink to="/signup" class="topbar__guest-cta">Sign Up</NuxtLink>
        </template>
        <div v-else-if="user" class="topbar__user-wrapper">
          <button
            class="topbar__user-btn"
            aria-label="User menu"
            @click="userMenuOpen = !userMenuOpen"
          >
            <ClientOnly>
              <UserAvatar :avatar-id="(user as any)?.avatar" :name="user?.name" size="sm" />
              <template #fallback>
                <UserAvatar :name="user?.name" size="sm" />
              </template>
            </ClientOnly>
          </button>
          <Transition name="dropdown">
            <div
              v-if="userMenuOpen"
              class="topbar__dropdown"
            >
              <NuxtLink to="/settings#account" class="topbar__dropdown-item" @click="userMenuOpen = false">
                Profile Settings
              </NuxtLink>
              <button class="topbar__dropdown-item topbar__dropdown-item--danger" @click="handleSignOut">
                Log out
              </button>
            </div>
          </Transition>
          <div v-if="userMenuOpen" class="topbar__backdrop" @click="userMenuOpen = false" />
        </div>
      </div>
    </header>

    <main id="main-content" class="main-content">
      <div class="main-content__inner">
        <slot />
      </div>
    </main>

    <MobileNav :more-open="moreSheetOpen" @toggle-more="moreSheetOpen = !moreSheetOpen" />
    <MobileMoreSheet :open="moreSheetOpen" @close="moreSheetOpen = false" />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
const { user, signOut, isAuthenticated } = useAuth()
const { isGuest } = useGuest()
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const shelvesStore = useShelvesStore()

const moreSheetOpen = ref(false)
const userMenuOpen = ref(false)

// Close sheet and menu on route change
const route = useRoute()
watch(() => route.path, () => {
  moreSheetOpen.value = false
  userMenuOpen.value = false
})

watch([isAuthenticated, isGuest], ([authed, guest]) => {
  if (authed || guest) shelvesStore.fetch()
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
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    text-decoration: none;
  }

  &__logo {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__user-wrapper {
    position: relative;
  }

  &__guest-cta {
    display: inline-flex;
    align-items: center;
    padding: $spacing-xs $spacing-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    font-family: $font-family-body;
    color: #fff;
    background-color: var(--highlight-color);
    border-radius: $radius-md;
    text-decoration: none;
    transition: background-color $transition-fast;

    &:hover {
      background-color: var(--highlight-color-hover);
    }
  }

  &__user-btn {
    @include flex-center;
    width: 2rem;
    height: 2rem;
    border-radius: $radius-full;
    background-color: var(--highlight-color);
    color: #fff;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border: none;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover {
      background-color: var(--highlight-color-hover);
    }
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + $spacing-xs);
    right: 0;
    min-width: 10rem;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    z-index: 200;
  }

  &__dropdown-item {
    display: block;
    width: 100%;
    padding: $spacing-sm $spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: none;
    border: none;
    text-decoration: none;
    text-align: left;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover {
      background-color: var(--sub-bg-color);
    }

    &--danger {
      color: var(--error-color);

      &:hover {
        background-color: var(--sub-bg-color);
      }
    }
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 199;
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

// --- Dropdown transition ---
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
