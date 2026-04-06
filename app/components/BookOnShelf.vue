<script setup lang="ts">
const props = defineProps<{
  userBookId: string
  bookId: string
  title: string
  author: string
  coverUrl?: string | null
  coverUrlSmall?: string | null
  rating?: number | null
  pageCount?: number | null
  currentPage?: number | null
  progressPercent?: string | null
  totalMinutes?: number | null
  currentMinutes?: number | null
}>()

const emit = defineEmits<{
  open: [userBookId: string, el: HTMLElement]
}>()

const bookEl = ref<HTMLElement>()

const coverSrc = computed(() => props.coverUrl || props.coverUrlSmall || undefined)

const progressPct = computed(() => {
  if (props.progressPercent) return parseFloat(props.progressPercent)
  if (props.currentMinutes && props.totalMinutes) {
    return Math.round((props.currentMinutes / props.totalMinutes) * 100)
  }
  if (props.currentPage && props.pageCount) {
    return Math.round((props.currentPage / props.pageCount) * 100)
  }
  return 0
})

const spineColor = computed(() => {
  let hash = 0
  for (const char of props.title) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  const saturation = 20 + (Math.abs(hash >> 8) % 25)
  const lightness = 22 + (Math.abs(hash >> 16) % 18)
  return {
    '--spine-color': `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    '--spine-color-light': `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`,
    '--spine-color-dark': `hsl(${hue}, ${saturation}%, ${lightness - 6}%)`,
  }
})

function handleClick() {
  if (bookEl.value) {
    emit('open', props.userBookId, bookEl.value)
  }
}
</script>

<template>
  <button
    ref="bookEl"
    class="book-on-shelf"
    :class="{ 'book-on-shelf--simple': simpleShelfView }"
    type="button"
    :aria-label="`Open ${title} by ${author}`"
    :style="spineColor"
    @click="handleClick"
  >
    <!-- Single 3D box — rotates as a unit -->
    <div class="book-on-shelf__box">
      <!-- 3D box face: cover image -->
      <div class="book-on-shelf__cover">
        <BookCover
          :src="coverSrc"
          :title="title"
          :author="author"
          width="100%"
        />
        <!-- Progress indicator -->
        <div v-if="progressPct > 0 && progressPct < 100" class="book-on-shelf__progress">
          <div class="book-on-shelf__progress-fill" :style="{ width: `${progressPct}%` }" />
        </div>
      </div>
      <!-- 3D box face: spine -->
      <div class="book-on-shelf__spine">
        <span class="book-on-shelf__spine-title">{{ title }}</span>
        <span class="book-on-shelf__spine-author">{{ author }}</span>
      </div>
      <!-- Top face: page edges -->
      <div class="book-on-shelf__top" />
    </div>
  </button>
</template>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

$book-w-sm: 7rem;
$book-w-md: 8rem;
$book-w-lg: 9rem;
$spine-w: 2.25rem;

.book-on-shelf {
  // --turn set by ShelfRow (0 = cover faces viewer, 1 = spine faces viewer)
  --bw: #{$book-w-sm};
  --bh: calc(var(--bw) * 1.5);
  --sw: #{$spine-w};

  position: relative;
  flex-shrink: 0;
  // Shrinks from cover width → spine width as --turn goes 0→1
  width: calc(var(--bw) * (1 - var(--turn, 0)) + var(--sw) * var(--turn, 0));
  height: var(--bh);
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font: inherit;
  perspective: 900px;
  overflow: visible;

  // Focus ring — use a ::after pseudo-element on the outer (non-rotating)
  // element so it paints above the 3D-translated cover face.
  &:focus-visible {
    outline: none;
    z-index: 5;

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      border: 2px solid var(--highlight-color);
      border-radius: $radius-md;
      pointer-events: none;
      // Must sit in front of the cover's translateZ(--sw)
      z-index: 20;
      transform: translateZ(calc(var(--sw) + 1px));
    }
  }

  @include respond-to($breakpoint-md) {
    --bw: #{$book-w-md};
  }

  @include respond-to($breakpoint-xl) {
    --bw: #{$book-w-lg};
  }

  &:hover {
    z-index: 5;
  }

  // --- The 3D box — all faces are children, rotates as one unit ---
  &__box {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--bw);
    height: 100%;
    transform-style: preserve-3d;
    // Pivot on the left (spine) edge
    transform-origin: left center;
    // 0deg = cover facing us, 90deg = spine facing us
    transform: rotateY(calc(var(--turn, 0) * 90deg));
  }

  // --- Front face: book cover ---
  &__cover {
    position: absolute;
    inset: 0;
    // Push forward by spine depth so the front face sits in front of the spine
    transform: translateZ(var(--sw));
    border-radius: 0 $radius-sm $radius-sm 0;
    overflow: hidden;
    backface-visibility: hidden;

    :deep(.book-cover) {
      width: 100% !important;
      height: 100%;
      aspect-ratio: unset;
      box-shadow: none;
      border-radius: 0;
    }

    // Spine crease — dark shadow along the left edge of the cover
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 100%;
      background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.4) 0%,
        rgba(0, 0, 0, 0.12) 40%,
        rgba(0, 0, 0, 0) 100%
      );
      z-index: 2;
      pointer-events: none;
    }

    // Gentle light edge on far right (page edge hint)
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0.08) 100%
      );
      z-index: 2;
      pointer-events: none;
    }
  }

  // --- Progress bar on cover ---
  &__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(0, 0, 0, 0.2);
    z-index: 3;
  }

  &__progress-fill {
    height: 100%;
    background: var(--progress-color, #a0592a);
    transition: width 0.3s ease;
  }

  // --- Left face: spine ---
  &__spine {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--sw);
    height: 100%;
    // Fold perpendicular from the left edge
    transform-origin: left center;
    transform: rotateY(-90deg);
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: $spacing-sm 2px;
    background: linear-gradient(
      90deg,
      var(--spine-color-dark, #1a1a1a) 0%,
      var(--spine-color-light, #3a3a3a) 40%,
      var(--spine-color, #2a2a2a) 100%
    );
    border-radius: $radius-sm 0 0 $radius-sm;
    overflow: hidden;

    // Vertical line details on spine (embossed ridges)
    &::before {
      content: '';
      position: absolute;
      top: 6px;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
    }
  }

  &__spine-title {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-family: var(--font-heading);
    font-size: 0.55rem;
    font-weight: $font-weight-bold;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.02em;
    line-height: var(--sw);
    max-height: calc(var(--bh) - 2.5rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__spine-author {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-family: var(--font-body);
    font-size: 0.4rem;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 0.01em;
    line-height: var(--sw);
    max-height: 3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // --- Top face: page edges ---
  &__top {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--sw);
    transform-origin: top center;
    transform: rotateX(90deg) translateZ(0);
    background: linear-gradient(
      180deg,
      #e8e2d6 0%,
      #f5f0e8 50%,
      #ddd7cb 100%
    );
    backface-visibility: hidden;
  }

  // --- Simple mode (flat covers, no 3D) ---
  &--simple {
    perspective: none;
    width: var(--bw);

    .book-on-shelf__box {
      transform-style: flat;
      transform: none;
    }

    .book-on-shelf__cover {
      transform: none;
      border-radius: $radius-sm;
      box-shadow: var(--shadow-book);

      &::before { display: none; }
    }

    .book-on-shelf__spine,
    .book-on-shelf__top {
      display: none;
    }
  }
}
</style>
