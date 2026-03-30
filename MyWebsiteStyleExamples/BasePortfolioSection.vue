<script setup lang="ts">
import type { PortfolioItem } from '~/types/portfolio'

interface BasePortfolioSectionProps {
    id: string
    title: string
    items: PortfolioItem[]
    useAltBackground?: boolean
}

defineProps<BasePortfolioSectionProps>()

const LazyModalWrapper = defineAsyncComponent(() => import('~/components/modal/ModalWrapper.vue'))

const selectedItem = ref<PortfolioItem | null>(null)
const showModal = ref(false)
const { gridRef, scrollPosition, scrollGrid, isScrollable } = useScrollPosition()

const openModal = (item: PortfolioItem) => {
    selectedItem.value = item
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    setTimeout(() => {
        selectedItem.value = null
    }, 300)
}
</script>

<template>
    <section :id="id" class="portfolio-section" :class="{ 'alt-bg': useAltBackground }">
        <div class="section-container">
            <h2 class="section-title">{{ title }}</h2>
            <p class="section-description">
                <slot name="description" />
            </p>
            <div class="grid-wrapper">
                <button 
                    v-if="isScrollable"
                    class="scroll-arrow scroll-arrow-left" 
                    :class="{ 'is-hidden': scrollPosition === 'start' }"
                    aria-label="Scroll left"
                    @click="scrollGrid('left')"
                >
                    <Icon name="tabler:chevron-left" />
                </button>
                <div ref="gridRef" class="portfolio-grid" role="region" :aria-label="`${title} portfolio items`" :class="[`scroll-${scrollPosition}`, { 'is-centered': !isScrollable }]">
                    <PortfolioCard 
                        v-for="item in items" 
                        :key="item.id" 
                        :item="item" 
                        @open-modal="openModal" 
                    />
                </div>
                <button 
                    v-if="isScrollable"
                    class="scroll-arrow scroll-arrow-right" 
                    :class="{ 'is-hidden': scrollPosition === 'end' }"
                    aria-label="Scroll right"
                    @click="scrollGrid('right')"
                >
                    <Icon name="tabler:chevron-right" />
                </button>
            </div>
        </div>

        <LazyModalWrapper 
            v-if="showModal || selectedItem" 
            :show="showModal" 
            :title="selectedItem?.title" 
            :images="selectedItem?.images" 
            :description="selectedItem?.description" 
            :long-description="selectedItem?.longDescription"
            :external-link="selectedItem?.externalLink" 
            :tags="selectedItem?.tags"
            :badge="selectedItem?.badge"
            :links="selectedItem?.links"
            :item-id="selectedItem?.id"
            :modal-layout="selectedItem?.modalLayout"
            :children="selectedItem?.children"
            @close="closeModal" 
        />
    </section>
</template>

<style lang="scss" scoped>
@use "~/assets/styles/mixins" as *;

.portfolio-section {
    @include section-padding;

    &.alt-bg {
        @include section-padding(var(--sub-bg-color));
    }
}

.section-container {
    @include section-container;
}

.section-title {
    @include section-title;
}

.section-description {
    @include section-description;
}

// Scroll-driven reveal — cards animate in as section enters viewport
@supports (animation-timeline: view()) {
    .section-title,
    .section-description {
        animation: scroll-reveal linear both;
        animation-timeline: view();
        animation-range: entry 0% entry 70%;
    }

    .portfolio-grid {
        animation: scroll-reveal-scale linear both;
        animation-timeline: view();
        animation-range: entry 0% entry 60%;
    }
}

.portfolio-grid {
    @include portfolio-grid;
    flex-grow: 0;

    &.is-centered {
        justify-content: center;
    }
}

.grid-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;

    @include respond-below($breakpoint-sm) {
        .scroll-arrow {
            display: none;
        }
    }
}

.scroll-arrow {
    --scroll-arrow-bg: var(--sub-bg-color);

    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--scroll-arrow-bg);
    border: 2px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    transition: all $transition-base;
    flex-shrink: 0;

    .alt-bg & {
        --scroll-arrow-bg: var(--bg-color);
    }

    &:hover:not(.is-hidden) {
        border-color: var(--highlight-color);
        color: var(--highlight-color);
    }

    &.is-hidden {
        opacity: 0.3;
        cursor: default;
        pointer-events: none;
    }

    .iconify {
        font-size: 1.5rem;
    }
}

</style>
