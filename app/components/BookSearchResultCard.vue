<script setup lang="ts">
import { Headphones } from 'lucide-vue-next'
import type { BookSearchResult } from '~~/server/services/book-api/types'

const props = defineProps<{
  book: BookSearchResult
  shelves: { id: string, name: string }[]
  inLibrary?: boolean
  adding?: boolean
}>()

const emit = defineEmits<{
  'add': [book: BookSearchResult, shelfId: string]
  'view': [book: BookSearchResult]
}>()

const showShelfPicker = ref(false)

function onAdd(shelfId: string) {
  showShelfPicker.value = false
  emit('add', props.book, shelfId)
}
</script>

<template>
  <article class="result-card animate-fade-in-up stagger-item">
    <button
      class="result-card__clickable"
      type="button"
      :aria-label="`View details for ${book.title}`"
      @click="$emit('view', book)"
    >
      <div class="result-card__cover-wrapper">
        <BookCover
          :src="book.coverUrl"
          :title="book.title"
          :author="book.author"
          width="6rem"
        />
        <span v-if="book.hasAudiobook" class="result-card__audio-badge" title="Audiobook available">
          <Headphones :size="12" />
        </span>
      </div>

      <div class="result-card__info">
        <h3 class="result-card__title">
          {{ book.title }}
        </h3>
        <p class="result-card__author">
          {{ book.author }}
          <template v-if="book.additionalAuthors?.length">
            <span class="result-card__additional-authors">
              +{{ book.additionalAuthors.length }} more
            </span>
          </template>
        </p>
        <span v-if="book.seriesName" class="result-card__series">
          {{ book.seriesPosition ? `Book ${book.seriesPosition} of ` : '' }}{{ book.seriesName }}
        </span>
        <div class="result-card__meta">
          <span v-if="book.publishedDate">{{ book.publishedDate }}</span>
          <span v-if="book.pageCount">{{ book.pageCount }} pages</span>
          <span v-if="book.publisher">{{ book.publisher }}</span>
        </div>
        <p
          v-if="book.description"
          class="result-card__description"
        >
          {{ book.description }}
        </p>
        <div v-if="book.moods?.length" class="result-card__moods">
          <span v-for="mood in book.moods.slice(0, 3)" :key="mood" class="result-card__mood-tag">{{ mood }}</span>
        </div>
      </div>
    </button>

    <div class="result-card__actions">
      <span
        v-if="inLibrary"
        class="result-card__badge"
      >
        In library
      </span>
      <template v-else>
        <button
          v-if="!showShelfPicker"
          class="result-card__add-btn"
          :disabled="adding"
          @click="showShelfPicker = true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add
        </button>
        <div
          v-else
          class="result-card__shelf-picker"
        >
          <button
            v-for="shelf in shelves"
            :key="shelf.id"
            class="result-card__shelf-option"
            :disabled="adding"
            @click="onAdd(shelf.id)"
          >
            {{ shelf.name }}
          </button>
          <button
            class="result-card__shelf-cancel"
            @click="showShelfPicker = false"
          >
            Cancel
          </button>
        </div>
      </template>
    </div>
  </article>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.result-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--border-color-subtle);
    box-shadow: var(--shadow-sm);
  }

  &__clickable {
    display: flex;
    gap: $spacing-md;
    flex: 1;
    min-width: 0;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    @include truncate(2);
  }

  &__author {
    font-size: $font-size-base;
    color: var(--text-color-secondary);
  }

  &__additional-authors {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    @include meta-text;

    span + span::before {
      content: "·";
      margin-right: $spacing-sm;
    }
  }

  &__cover-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  &__audio-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px $spacing-xs;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    color: var(--text-muted);
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-color);
  }

  &__series {
    font-size: $font-size-xs;
    color: var(--highlight-color);
    margin-top: 2px;
  }

  &__description {
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
    line-height: 1.5;
    @include truncate(2);
    margin-top: $spacing-xs;
  }

  &__moods {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: $spacing-xs;
  }

  &__mood-tag {
    font-size: 10px;
    color: var(--highlight-color);
    background-color: color-mix(in srgb, var(--highlight-color) 10%, transparent);
    padding: 1px $spacing-xs;
    border-radius: $radius-full;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    gap: $spacing-xs;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--success-color);
    background: var(--highlight-color-subtle);
    border-radius: $radius-full;
    white-space: nowrap;
  }

  &__add-btn {
    @include button-secondary;
    padding: $spacing-xs $spacing-md;
    font-size: $font-size-sm;
    gap: $spacing-xs;
  }

  &__shelf-picker {
    display: flex;
    flex-direction: column;
    gap: 2px;
    animation: fade-in-scale 150ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  &__shelf-option {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
    background: var(--sub-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--highlight-color-subtle);
      border-color: var(--highlight-color);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__shelf-cancel {
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    background: none;
    border: none;
    cursor: pointer;
    text-align: center;

    &:hover {
      color: var(--text-color);
    }
  }
}

// Responsive — stack on small screens
@include respond-below($breakpoint-sm) {
  .result-card {
    flex-wrap: wrap;

    &__actions {
      width: 100%;
      flex-direction: row;
      align-items: center;
    }

    &__shelf-picker {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
}
</style>
