<script setup lang="ts">
export interface ContentCardImage {
  src: string
  alt: string
  width?: number
  height?: number
  caption?: string
}

export interface ContentCardNote {
  type: 'note' | 'tip' | 'warning' | 'info'
  icon?: string
  title?: string
  content: string
}

export interface ContentCardItem {
  id: string
  title: string
  icon?: string
  content: string | string[]
  images?: ContentCardImage[]
  notes?: ContentCardNote[]
  subsections?: {
    title: string
    items: string[]
  }[]
}

interface Props {
  item: ContentCardItem
  variant?: 'workflow' | 'feature'
  stepNumber?: number
}

withDefaults(defineProps<Props>(), {
  variant: 'workflow',
  stepNumber: undefined
})

function getContentParagraphs(content: string | string[]): string[] {
  return Array.isArray(content) ? content : [content]
}

function getNoteIcon(note: ContentCardNote): string {
  if (note.icon) return note.icon
  const icons: Record<string, string> = {
    note: 'tabler:info-circle',
    tip: 'tabler:bulb',
    warning: 'tabler:alert-triangle',
    info: 'tabler:info-circle'
  }
  return icons[note.type] || 'tabler:info-circle'
}
</script>

<template>
  <article :id="item.id" class="content-card" :class="[`content-card--${variant}`]">
    <div class="card-header">
      <span v-if="stepNumber" class="step-number">{{ stepNumber }}</span>
      <Icon v-if="item.icon && !stepNumber" :name="item.icon" class="card-icon" />
      <h3>{{ item.title }}</h3>
    </div>

    <!-- Images (after title, before content) -->
    <figure v-for="(image, idx) in item.images" :key="`img-${idx}`" class="card-figure">
      <div class="card-figure__frame">
        <NuxtImg 
          :src="image.src" 
          :alt="image.alt" 
          :width="image.width" 
          :height="image.height" 
          loading="lazy" 
          format="webp" 
          sizes="card-sm:250px card-md:500px sm:400px md:500px"
        />
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <figcaption v-if="image.caption" v-html="image.caption" />
    </figure>

    <div class="card-body">
      <!-- Content paragraphs -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-for="(paragraph, idx) in getContentParagraphs(item.content)" :key="idx" v-html="paragraph" />

      <!-- Subsections (like param groups) -->
      <div v-if="item.subsections" class="subsections">
        <div v-for="(section, idx) in item.subsections" :key="idx" class="subsection">
          <h4>{{ section.title }}</h4>
          <ul>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <li v-for="(listItem, listIdx) in section.items" :key="listIdx" v-html="listItem" />
          </ul>
        </div>
      </div>

      <!-- Notes/Tips/Warnings -->
      <aside v-for="(note, idx) in item.notes" :key="`note-${idx}`" class="callout" :class="`callout--${note.type}`">
        <Icon :name="getNoteIcon(note)" class="callout-icon" />
        <div class="callout-content">
          <strong v-if="note.title">{{ note.title }}</strong>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="note.content" />
        </div>
      </aside>

      <!-- Slot for additional custom content -->
      <slot />
    </div>
  </article>
</template>

<style lang="scss" scoped>
@use "~/assets/styles/mixins" as *;

.content-card {
  @include card-base;
  background: var(--sub-bg-color);
  padding: $spacing-lg;
  transition: box-shadow 0.2s ease;

  // Variant styles available for customization
  // &--workflow { }
  // &--feature { }
}

.card-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;

  h3 {
    margin: 0;
    font-size: clamp(1.1rem, 2.5vw, 1.4rem);
    font-weight: 700;
    color: var(--text-color);
  }
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  background: var(--highlight-color);
  color: var(--bg-color);
  font-weight: 700;
  font-size: 1rem;
  border-radius: $radius-sm;
}

.card-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: var(--highlight-color);
}

.card-body {
  font-size: $font-size-body-sm;
  color: var(--text-color);
  line-height: 1.7;

  >p {
    margin: 0 0 $spacing-sm;

    &:last-of-type:not(:last-child) {
      margin-bottom: $spacing-md;
    }

    :deep(a) {
      color: var(--highlight-color);
      text-decoration: underline;

      &:hover {
        text-decoration: none;
      }
    }
  }

  :deep(code) {
    background: rgba(var(--highlight-color-rgb, 128, 128, 128), 0.15);
    padding: 0.15em 0.4em;
    border-radius: $radius-sm;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
  }

  :deep(strong) {
    font-weight: 700;
  }
}

.subsections {
  margin-top: $spacing-md;
}

.subsection {
  margin-bottom: $spacing-md;

  h4 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 $spacing-xs;
    color: var(--highlight-color);
  }

  ul {
    margin: 0;
    padding-left: $spacing-lg;
    list-style: disc;

    li {
      margin-bottom: $spacing-xs;
      line-height: 1.6;
    }
  }
}

.callout {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin: $spacing-md 0;
  border-radius: $radius-sm;
  border-left: 4px solid;

  &--note,
  &--info {
    background: rgba(var(--highlight-color-rgb, 128, 128, 128), 0.1);
    border-color: var(--highlight-color);

    .callout-icon {
      color: var(--highlight-color);
    }
  }

  &--tip {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;

    .callout-icon {
      color: #22c55e;
    }
  }

  &--warning {
    background: rgba(234, 179, 8, 0.1);
    border-color: #eab308;

    .callout-icon {
      color: #eab308;
    }
  }
}

.callout-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
}

.callout-content {
  flex: 1;

  strong {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 700;
  }

  p {
    margin: 0;
    font-size: $font-size-body-sm;
    line-height: 1.6;
  }
}

.card-figure {
  margin: 0 0 $spacing-md;
  border-radius: $radius-md;
  border: 2px solid var(--border-color);
  background: var(--bg-color);
  padding: $spacing-sm;
  display: grid;
  align-items: center;
  flex-direction: column;
  gap: $spacing-xs;
  min-height: 200px;
  justify-content: center;
  align-content: center;
  grid-template-rows: 1fr auto;

  &__frame {
    @include card-base;
    border-radius: $radius-md;
    overflow: hidden;
    width: fit-content;
    max-width: 500px;
    background: var(--sub-bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
    
    // aspect-ratio is set inline via :style binding when dimensions are available

    img {
      display: block;
      max-width: 100%;
    }
  }

  figcaption {
    font-size: $font-size-body-sm;
    color: var(--text-color);
    opacity: 0.85;
    text-align: center;

    :deep(strong) {
      font-weight: 700;
    }
  }
}

@media print {
  .content-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }
}
</style>
