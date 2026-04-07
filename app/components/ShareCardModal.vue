<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="share-card-overlay" @click.self="emit('close')">
        <div class="share-card" role="dialog" aria-modal="true" aria-label="Share card">
          <header class="share-card__header">
            <h2 class="share-card__title">Share Card</h2>
            <button class="share-card__close" aria-label="Close" @click="emit('close')">
              <X :size="20" />
            </button>
          </header>

          <div class="share-card__controls">
            <div class="share-card__templates">
              <button
                v-for="t in availableTemplates"
                :key="t.value"
                class="share-card__template-btn"
                :class="{ 'share-card__template-btn--active': template === t.value }"
                @click="template = t.value"
              >
                {{ t.label }}
              </button>
            </div>

            <div class="share-card__dimensions">
              <button
                v-for="d in dimensionOptions"
                :key="d.value"
                class="share-card__dim-btn"
                :class="{ 'share-card__dim-btn--active': dimension === d.value }"
                @click="dimension = d.value"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <div class="share-card__preview">
            <canvas ref="previewCanvas" class="share-card__canvas" />
          </div>

          <div class="share-card__actions">
            <button class="share-card__btn share-card__btn--primary" @click="handleDownload">
              <Download :size="16" />
              Download PNG
            </button>
            <button v-if="canShare" class="share-card__btn share-card__btn--secondary" @click="handleShare">
              <Share2 :size="16" />
              Share
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Download, Share2 } from 'lucide-vue-next'
import {
  type CardTemplate, type CardDimension, type YearReviewData,
  type MonthlyRecapData, type BookReviewData,
  CARD_DIMENSIONS,
  generateYearReviewCard, generateMonthlyRecapCard, generateBookReviewCard,
  canvasToBlob, downloadCanvas,
} from '~/composables/useShareCard'

const props = defineProps<{
  open: boolean
  yearReviewData?: YearReviewData
  monthlyRecapData?: MonthlyRecapData
  bookReviewData?: BookReviewData
}>()

const emit = defineEmits<{
  close: []
}>()

const previewCanvas = useTemplateRef<HTMLCanvasElement>('previewCanvas')

const template = ref<CardTemplate>('year-review')
const dimension = ref<CardDimension>('square')

const availableTemplates = computed(() => {
  const templates: { value: CardTemplate; label: string }[] = []
  if (props.yearReviewData) templates.push({ value: 'year-review', label: 'Year in Review' })
  if (props.monthlyRecapData) templates.push({ value: 'monthly-recap', label: 'Monthly Recap' })
  if (props.bookReviewData) templates.push({ value: 'book-review', label: 'Book Review' })
  return templates
})

const dimensionOptions: { value: CardDimension; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'story', label: 'Story' },
  { value: 'landscape', label: 'Landscape' },
]

const canShare = computed(() =>
  typeof navigator !== 'undefined' && !!navigator.share,
)

function generateCard(): HTMLCanvasElement | null {
  if (template.value === 'year-review' && props.yearReviewData) {
    return generateYearReviewCard(props.yearReviewData, dimension.value)
  }
  if (template.value === 'monthly-recap' && props.monthlyRecapData) {
    return generateMonthlyRecapCard(props.monthlyRecapData, dimension.value)
  }
  if (template.value === 'book-review' && props.bookReviewData) {
    return generateBookReviewCard(props.bookReviewData, dimension.value)
  }
  return null
}

function renderPreview() {
  const sourceCanvas = generateCard()
  if (!sourceCanvas || !previewCanvas.value) return

  const target = previewCanvas.value
  const dims = CARD_DIMENSIONS[dimension.value]
  target.width = dims.width
  target.height = dims.height

  const targetCtx = target.getContext('2d')!
  targetCtx.drawImage(sourceCanvas, 0, 0)
}

watch([template, dimension, () => props.open], () => {
  if (props.open) {
    nextTick(renderPreview)
  }
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Auto-select the first available template
    const first = availableTemplates.value[0]
    if (first) {
      template.value = first.value
    }
    nextTick(renderPreview)
  }
})

function handleDownload() {
  const canvas = generateCard()
  if (!canvas) return
  const filename = `bookshelf-${template.value}-${dimension.value}.png`
  downloadCanvas(canvas, filename)
}

async function handleShare() {
  const canvas = generateCard()
  if (!canvas) return

  try {
    const blob = await canvasToBlob(canvas)
    const file = new File([blob], `bookshelf-${template.value}.png`, { type: 'image/png' })
    await navigator.share({
      title: 'My Bookshelf Stats',
      files: [file],
    })
  }
  catch {
    // User cancelled or share not supported — silently fail
  }
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.share-card-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: $spacing-md;
}

.share-card {
  background: var(--surface-color);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-lg;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    @include heading($font-size-lg);
  }

  &__close {
    @include flex-center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--text-color-muted);
    border-radius: $radius-md;
    cursor: pointer;

    &:hover {
      background: var(--sub-bg-color);
      color: var(--text-color);
    }
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__templates,
  &__dimensions {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__template-btn,
  &__dim-btn {
    @include body-text;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    background: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;

    &:hover {
      background: var(--sub-bg-color);
      color: var(--text-color);
    }

    &--active {
      background: var(--highlight-color-subtle);
      border-color: var(--highlight-color);
      color: var(--highlight-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__preview {
    background: var(--sub-bg-color);
    border-radius: $radius-md;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__canvas {
    max-width: 100%;
    max-height: 400px;
    border-radius: $radius-sm;
    box-shadow: var(--shadow-sm);
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    border: none;
    cursor: pointer;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: background-color 0.15s, color 0.15s;

    &--primary {
      background: var(--highlight-color);
      color: white;

      &:hover {
        background: var(--highlight-color-hover);
      }
    }

    &--secondary {
      background: var(--sub-bg-color);
      color: var(--text-color);

      &:hover {
        background: var(--border-color);
      }
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
