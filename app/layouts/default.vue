<template>
    <div class="layout-default">
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <aside class="sidebar">
            <nav aria-label="Main navigation">
                <div class="sidebar__brand">
                    <h1 class="sidebar__logo">Bookshelf</h1>
                </div>
                <p class="sidebar__placeholder">Sidebar — Phase 1</p>
            </nav>
        </aside>

        <main id="main-content" class="main-content">
            <slot />
        </main>
    </div>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.layout-default {
    display: flex;
    min-height: 100dvh;
}

.sidebar {
    position: sticky;
    top: 0;
    width: $sidebar-width;
    height: 100dvh;
    padding: $spacing-lg $spacing-md;
    background-color: var(--sub-bg-color);
    border-right: 1px solid var(--border-color-subtle);
    overflow-y: auto;

    @include respond-below($breakpoint-lg) {
        display: none; // Mobile nav in Phase 1
    }

    &__brand {
        margin-bottom: $spacing-xl;
    }

    &__logo {
        @include heading($font-size-xl);
        font-weight: $font-weight-bold;
    }

    &__placeholder {
        @include meta-text;
    }
}

.main-content {
    flex: 1;
    min-width: 0;
    padding: $spacing-lg $spacing-xl;

    @include respond-below($breakpoint-md) {
        padding: $spacing-md;
    }
}
</style>
