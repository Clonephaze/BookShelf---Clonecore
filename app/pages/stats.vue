<template>
  <div class="stats">
    <header class="stats__header">
      <h1 class="stats__title">Statistics</h1>
      <p class="stats__subtitle">Your reading journey at a glance</p>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="stats__loading">
      <div class="stats__hero-grid">
        <div v-for="n in 4" :key="n" class="stats__hero-card stats__hero-card--skeleton">
          <div class="stats__skel stats__skel--big" />
          <div class="stats__skel stats__skel--label" />
        </div>
      </div>
      <div class="stats__skel stats__skel--chart" />
    </div>

    <!-- Empty state (0 finished books) -->
    <div v-else-if="overview && overview.totalBooks === 0" class="stats__empty">
      <div class="stats__empty-icon" aria-hidden="true">📊</div>
      <h2 class="stats__empty-title">Your reading story starts here</h2>
      <p class="stats__empty-text">
        Finish a book to unlock reading insights — track your pace, discover patterns, and celebrate your progress.
      </p>
      <NuxtLink to="/search" class="stats__empty-cta">Find your next book</NuxtLink>
    </div>

    <template v-else-if="overview">
      <!-- Hero summary cards -->
      <div class="stats__hero-grid">
        <div class="stats__hero-card">
          <span class="stats__hero-value">{{ overview.booksThisYear }}</span>
          <span class="stats__hero-label">Books in {{ overview.currentYear }}</span>
          <div v-if="overview.sparkline.length > 1" class="stats__sparkline" aria-hidden="true">
            <svg :viewBox="`0 0 ${sparklineWidth} ${sparklineHeight}`" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--progress-color)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--progress-color)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path :d="sparklineArea" fill="url(#sparkFill)" />
              <polyline
                :points="sparklinePoints"
                fill="none"
                stroke="var(--progress-color)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-if="overview.sparkline.length"
                :cx="sparklineLastX"
                :cy="sparklineLastY"
                r="3"
                fill="var(--progress-color)"
              />
            </svg>
          </div>
        </div>
        <div class="stats__hero-card">
          <span class="stats__hero-value">{{ formatNumber(overview.totalPages) }}</span>
          <span class="stats__hero-label">Pages turned</span>
          <span v-if="overview.avgPages" class="stats__hero-detail">~{{ overview.avgPages }} avg per book</span>
        </div>
        <div class="stats__hero-card">
          <span class="stats__hero-value stats__hero-value--rating">
            <template v-if="overview.avgRating">
              {{ overview.avgRating }}
              <svg class="stats__star-icon" viewBox="0 0 24 24" fill="var(--rating-color)" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </template>
            <template v-else>—</template>
          </span>
          <span class="stats__hero-label">Avg. rating</span>
          <span class="stats__hero-detail">{{ overview.totalBooks }} books finished</span>
        </div>
        <div class="stats__hero-card">
          <span class="stats__hero-value">
            {{ overview.avgDaysToFinish != null ? overview.avgDaysToFinish : '—' }}
          </span>
          <span class="stats__hero-label">{{ overview.avgDaysToFinish != null ? 'Avg. days to finish' : 'Days to finish' }}</span>
          <span v-if="overview.avgDaysToFinish == null" class="stats__hero-detail">Add start &amp; finish dates to track</span>
        </div>
      </div>

      <!-- Charts grid -->
      <div class="stats__charts">
        <!-- Books per month bar chart -->
        <section class="stats__chart-card">
          <h2 class="stats__chart-title">Books per Month</h2>
          <div v-if="timeline" class="stats__bar-chart">
            <div
              v-for="bar in timeline.timeline"
              :key="`${bar.year}-${bar.month}`"
              class="stats__bar-col"
              @mouseenter="hoveredBar = bar"
              @mouseleave="hoveredBar = null"
            >
              <span
                class="stats__bar-tooltip"
                :class="{ 'stats__bar-tooltip--visible': hoveredBar === bar && bar.count > 0 }"
              >{{ bar.count }}</span>
              <div
                class="stats__bar"
                :class="{ 'stats__bar--empty': bar.count === 0 }"
                :style="{ height: barHeight(bar.count) }"
              >
                <span v-if="bar.count === 0" class="stats__bar-dot" />
              </div>
              <span class="stats__bar-label">{{ bar.label }}</span>
            </div>
          </div>
        </section>

        <!-- Page count distribution -->
        <section class="stats__chart-card">
          <h2 class="stats__chart-title">Book Lengths</h2>
          <div v-if="pages && (pages.shortest || pages.longest)" class="stats__pages">
            <div class="stats__pages-bars">
              <div v-for="b in pages.distribution" :key="b.bucket" class="stats__pages-row">
                <span class="stats__pages-bucket">{{ b.bucket }}</span>
                <div class="stats__pages-bar-track">
                  <div class="stats__pages-bar-fill" :style="{ width: pageBucketWidth(b.count) }" />
                </div>
                <span class="stats__pages-count">{{ b.count }}</span>
              </div>
            </div>
            <div class="stats__pages-extremes">
              <div v-if="pages.shortest" class="stats__pages-extreme">
                <img
                  v-if="pages.shortest.coverUrlSmall"
                  :src="pages.shortest.coverUrlSmall"
                  :alt="pages.shortest.title"
                  class="stats__pages-cover"
                  loading="lazy"
                >
                <div class="stats__pages-extreme-info">
                  <span class="stats__pages-extreme-label">Shortest</span>
                  <span class="stats__pages-extreme-title">{{ pages.shortest.title }}</span>
                  <span class="stats__pages-extreme-pages">{{ pages.shortest.pageCount }} pages</span>
                </div>
              </div>
              <div v-if="pages.longest" class="stats__pages-extreme">
                <img
                  v-if="pages.longest.coverUrlSmall"
                  :src="pages.longest.coverUrlSmall"
                  :alt="pages.longest.title"
                  class="stats__pages-cover"
                  loading="lazy"
                >
                <div class="stats__pages-extreme-info">
                  <span class="stats__pages-extreme-label">Longest</span>
                  <span class="stats__pages-extreme-title">{{ pages.longest.title }}</span>
                  <span class="stats__pages-extreme-pages">{{ pages.longest.pageCount }} pages</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="stats__chart-empty">
            <p>Finish books to see length insights</p>
          </div>
        </section>

        <!-- Monthly reading activity -->
        <section class="stats__chart-card stats__chart-card--wide">
          <h2 class="stats__chart-title">
            Reading Activity
            <span class="stats__chart-year">{{ heatmap?.year ?? new Date().getFullYear() }}</span>
          </h2>
          <div v-if="heatmap" class="stats__month-grid">
            <div
              v-for="(m, i) in monthlyActivity"
              :key="i"
              class="stats__month-cell"
              :class="monthCellClass(m.count)"
            >
              <span class="stats__month-name">{{ m.name }}</span>
              <span class="stats__month-count">{{ m.count }}</span>
              <span class="stats__month-label">{{ m.count === 1 ? 'book' : 'books' }}</span>
            </div>
          </div>
        </section>

        <!-- Rating distribution -->
        <section class="stats__chart-card">
          <h2 class="stats__chart-title">Rating Distribution</h2>
          <div v-if="ratings && ratings.totalRated > 0" class="stats__rating-chart">
            <div class="stats__rating-summary">
              <span v-if="ratings.avgRating" class="stats__rating-summary-avg">
                {{ ratings.avgRating }}
                <svg class="stats__star-icon" viewBox="0 0 24 24" fill="var(--rating-color)" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                average
              </span>
              <span class="stats__rating-summary-count">{{ ratings.totalRated }} of {{ ratings.totalBooks }} rated</span>
            </div>
            <div v-for="row in ratingsReversed" :key="row.rating" class="stats__rating-row">
              <span class="stats__rating-stars">
                <svg v-for="s in row.rating" :key="s" class="stats__rating-star" viewBox="0 0 24 24" fill="var(--rating-color)" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <div class="stats__rating-bar-track">
                <div
                  class="stats__rating-bar-fill"
                  :class="{ 'stats__rating-bar-fill--zero': row.count === 0 }"
                  :style="{ width: ratingBarWidth(row.count) }"
                />
              </div>
              <span class="stats__rating-count">{{ row.count }}</span>
            </div>
            <div v-if="ratings.highestRatedAuthor" class="stats__rating-insight">
              <svg class="stats__rating-insight-icon" viewBox="0 0 24 24" fill="none" stroke="var(--rating-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>
                <strong>{{ ratings.highestRatedAuthor.author }}</strong>
                is your highest rated author
                <span class="stats__rating-insight-detail">{{ ratings.highestRatedAuthor.avgRating }}★ across {{ ratings.highestRatedAuthor.bookCount }} {{ ratings.highestRatedAuthor.bookCount === 1 ? 'book' : 'books' }}</span>
              </span>
            </div>
            <div v-if="mostGivenRating" class="stats__rating-insight">
              <svg class="stats__rating-insight-icon" viewBox="0 0 24 24" fill="none" stroke="var(--progress-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <span>
                You most often give
                <strong>{{ mostGivenRating.rating }}★</strong>
                <span class="stats__rating-insight-detail">{{ mostGivenRating.count }} {{ mostGivenRating.count === 1 ? 'time' : 'times' }}</span>
              </span>
            </div>
          </div>
          <div v-else class="stats__chart-empty">
            <p>Rate some books to see your distribution</p>
          </div>
        </section>

        <!-- Top authors -->
        <section class="stats__chart-card">
          <h2 class="stats__chart-title">Top Authors</h2>
          <div v-if="authors && authors.topAuthors.length > 0" class="stats__authors">
            <div class="stats__authors-summary">
              <span class="stats__authors-stat"><strong>{{ authors.uniqueAuthors }}</strong> unique authors</span>
              <span v-if="authors.repeatAuthors > 0" class="stats__authors-stat"><strong>{{ authors.repeatAuthors }}</strong> repeat favorites</span>
            </div>
            <ol class="stats__authors-list">
              <li v-for="(a, i) in authors.topAuthors.slice(0, 5)" :key="a.author" class="stats__author-item">
                <span class="stats__author-rank">{{ i + 1 }}</span>
                <img
                  v-if="a.coverUrlSmall"
                  :src="a.coverUrlSmall"
                  :alt="a.author"
                  class="stats__author-cover"
                  loading="lazy"
                >
                <div v-else class="stats__author-cover stats__author-cover--placeholder">
                  {{ a.author.charAt(0) }}
                </div>
                <div class="stats__author-info">
                  <span class="stats__author-name">{{ a.author }}</span>
                  <span class="stats__author-count">{{ a.bookCount }} {{ a.bookCount === 1 ? 'book' : 'books' }}</span>
                </div>
              </li>
            </ol>
          </div>
          <div v-else class="stats__chart-empty">
            <p>Finish books to see your most-read authors</p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Statistics — Bookshelf' })

// --- Types ---
interface Overview {
  totalBooks: number
  totalPages: number
  avgRating: number | null
  avgPages: number | null
  avgDaysToFinish: number | null
  booksThisYear: number
  currentYear: number
  sparkline: number[]
}

interface TimelineEntry { year: number; month: number; count: number; label: string }
interface Timeline { timeline: TimelineEntry[]; months: number }

interface RatingRow { rating: number; count: number }
interface Ratings { distribution: RatingRow[]; avgRating: number | null; totalRated: number; totalBooks: number; highestRatedAuthor: { author: string; avgRating: number; bookCount: number } | null }

interface AuthorRow { author: string; bookCount: number; coverUrlSmall: string | null }
interface Authors { uniqueAuthors: number; totalBooks: number; repeatAuthors: number; topAuthors: AuthorRow[] }

interface BookRef { title: string; author: string; pageCount: number | null; coverUrlSmall: string | null }
interface PageBucket { bucket: string; count: number }
interface Pages { distribution: PageBucket[]; shortest: BookRef | null; longest: BookRef | null }

interface HeatmapData { year: number; days: Record<string, number> }

// --- Data fetching ---
const loading = ref(true)
const overview = ref<Overview | null>(null)
const timeline = ref<Timeline | null>(null)
const ratings = ref<Ratings | null>(null)
const authors = ref<Authors | null>(null)
const pages = ref<Pages | null>(null)
const heatmap = ref<HeatmapData | null>(null)

const hoveredBar = ref<TimelineEntry | null>(null)

async function fetchStats() {
  loading.value = true
  try {
    const [o, t, r, a, p, h] = await Promise.all([
      $fetch<Overview>('/api/stats/overview'),
      $fetch<Timeline>('/api/stats/timeline'),
      $fetch<Ratings>('/api/stats/ratings'),
      $fetch<Authors>('/api/stats/authors'),
      $fetch<Pages>('/api/stats/pages'),
      $fetch<HeatmapData>('/api/stats/heatmap'),
    ])
    overview.value = o
    timeline.value = t
    ratings.value = r
    authors.value = a
    pages.value = p
    heatmap.value = h
  }
  catch {
    // Graceful fallback — show empty state
  }
  finally {
    loading.value = false
  }
}

// --- Computed helpers ---
const sparklineWidth = 120
const sparklineHeight = 32
const sparklinePad = 4

const sparklineCoords = computed(() => {
  if (!overview.value) return []
  const data = overview.value.sparkline
  const max = Math.max(...data, 1)
  const step = (sparklineWidth - sparklinePad * 2) / Math.max(data.length - 1, 1)
  return data.map((v, i) => ({
    x: sparklinePad + i * step,
    y: sparklineHeight - sparklinePad - (v / max) * (sparklineHeight - sparklinePad * 2),
  }))
})

const sparklinePoints = computed(() =>
  sparklineCoords.value.map(p => `${p.x},${p.y}`).join(' '),
)

const sparklineArea = computed(() => {
  const pts = sparklineCoords.value
  if (pts.length < 2) return ''
  const linePart = pts.map(p => `L${p.x},${p.y}`).join(' ')
  return `M${pts[0]!.x},${sparklineHeight} ${linePart} L${pts[pts.length - 1]!.x},${sparklineHeight} Z`
})

const sparklineLastX = computed(() => {
  const pts = sparklineCoords.value
  return pts.length ? pts[pts.length - 1]!.x : 0
})

const sparklineLastY = computed(() => {
  const pts = sparklineCoords.value
  return pts.length ? pts[pts.length - 1]!.y : 0
})

const timelineMax = computed(() => {
  if (!timeline.value) return 1
  return Math.max(...timeline.value.timeline.map(t => t.count), 1)
})

function barHeight(count: number): string {
  if (count === 0) return '4px'
  return `${Math.max(8, (count / timelineMax.value) * 100)}%`
}

const ratingMax = computed(() => {
  if (!ratings.value) return 1
  return Math.max(...ratings.value.distribution.map(d => d.count), 1)
})

function ratingBarWidth(count: number): string {
  if (count === 0) return '0%'
  return `${(count / ratingMax.value) * 100}%`
}

const pageBucketMax = computed(() => {
  if (!pages.value) return 1
  return Math.max(...pages.value.distribution.map(d => d.count), 1)
})

function pageBucketWidth(count: number): string {
  if (count === 0) return '0%'
  return `${(count / pageBucketMax.value) * 100}%`
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

// --- Monthly activity grid ---
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const monthlyActivity = computed(() => {
  if (!heatmap.value) return []
  const year = heatmap.value.year
  const counts = new Array(12).fill(0)

  for (const [dateStr, count] of Object.entries(heatmap.value.days)) {
    const month = parseInt(dateStr.slice(5, 7), 10) - 1
    if (month >= 0 && month < 12) counts[month] += count
  }

  return monthNames.map((name, i) => ({
    name,
    count: counts[i],
    // Don't show future months as active-zero
    isFuture: year === new Date().getFullYear() && i > new Date().getMonth(),
  }))
})

function monthCellClass(count: number): string {
  if (count === 0) return 'stats__month-cell--empty'
  if (count === 1) return 'stats__month-cell--l1'
  if (count <= 3) return 'stats__month-cell--l2'
  return 'stats__month-cell--l3'
}

// --- Reversed rating distribution (5★ at top) ---
const ratingsReversed = computed(() => {
  if (!ratings.value) return []
  return [...ratings.value.distribution].reverse()
})

const mostGivenRating = computed(() => {
  if (!ratings.value) return null
  const sorted = [...ratings.value.distribution].filter(r => r.count > 0).sort((a, b) => b.count - a.count)
  if (sorted.length < 2) return null // only show if there's a meaningful "most"
  return sorted[0] ?? null
})

// Non-blocking fetch
fetchStats()
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.stats {
  @include container;
  padding-top: $spacing-2xl;
  padding-bottom: $spacing-3xl;

  // --- Header ---
  &__header {
    margin-bottom: $spacing-2xl;
  }

  &__title {
    @include heading($font-size-2xl);
  }

  &__subtitle {
    @include meta-text;
    margin-top: $spacing-xs;
  }

  // --- Loading ---
  &__loading {
    @include flex-column;
    gap: $spacing-xl;
  }

  &__skel {
    background: var(--sub-bg-color);
    border-radius: $radius-md;
    animation: skel-pulse 1.5s ease-in-out infinite;

    &--big {
      width: 4rem;
      height: 2rem;
    }

    &--label {
      width: 6rem;
      height: 0.75rem;
      margin-top: $spacing-sm;
    }

    &--chart {
      width: 100%;
      height: 12rem;
      border-radius: $radius-lg;
    }
  }

  @keyframes skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  // --- Empty state ---
  &__empty {
    @include flex-column;
    align-items: center;
    text-align: center;
    gap: $spacing-md;
    padding: $spacing-3xl $spacing-xl;
    @include card-base;
  }

  &__empty-icon {
    font-size: 3rem;
  }

  &__empty-title {
    @include heading($font-size-xl);
  }

  &__empty-text {
    @include body-text;
    max-width: 28rem;
  }

  &__empty-cta {
    @include button-primary;
    margin-top: $spacing-sm;
    text-decoration: none;
  }

  // --- Hero summary cards ---
  &__hero-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;

    @include respond-to($breakpoint-md) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__hero-card {
    @include card-base;
    @include flex-column;
    align-items: center;
    text-align: center;
    padding: $spacing-lg $spacing-md;
    gap: $spacing-xs;
    position: relative;
    overflow: hidden;

    &--skeleton {
      min-height: 6rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__hero-value {
    font-family: $font-family-heading;
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.1;

    &--rating {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
    }
  }

  &__star-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  &__hero-label {
    @include meta-text;
    font-size: $font-size-xs;
  }

  &__hero-detail {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    opacity: 0.7;
  }

  &__sparkline {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  // --- Charts grid ---
  &__charts {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-lg;

    @include respond-to($breakpoint-md) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__chart-card {
    @include card-base;
    padding: $spacing-lg;

    &--wide {
      @include respond-to($breakpoint-md) {
        grid-column: 1 / -1;
      }
    }
  }

  &__chart-title {
    font-family: $font-family-heading;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    margin-bottom: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__chart-year {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    font-weight: $font-weight-medium;
  }

  &__chart-empty {
    @include flex-center;
    padding: $spacing-xl;
    color: var(--text-color-muted);
    font-family: $font-family-body;
    font-size: $font-size-sm;
  }

  // --- Bar chart (books per month) ---
  &__bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 10rem;
    padding-top: $spacing-sm;
  }

  &__bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
    position: relative;
    cursor: default;
  }

  &__bar-tooltip {
    position: absolute;
    top: -$spacing-md;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;

    &--visible {
      opacity: 1;
    }
  }

  &__bar {
    width: 100%;
    max-width: 2rem;
    border-radius: $radius-sm $radius-sm 0 0;
    background: var(--progress-color);
    transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    min-height: 2px;
    position: relative;

    &--empty {
      background: transparent;
      min-height: 0;
      height: 0 !important;
    }
  }

  &__bar-dot {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--border-color);
  }

  &__bar-label {
    margin-top: $spacing-xs;
    font-family: $font-family-body;
    font-size: 0.5rem;
    color: var(--text-color-muted);
    white-space: nowrap;

    @include respond-to($breakpoint-md) {
      font-size: $font-size-xs;
    }
  }

  // --- Monthly activity grid ---
  &__month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-sm;

    @include respond-to($breakpoint-sm) {
      grid-template-columns: repeat(4, 1fr);
    }

    @include respond-to($breakpoint-md) {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  &__month-cell {
    @include flex-column;
    align-items: center;
    justify-content: center;
    padding: $spacing-md $spacing-sm;
    border-radius: $radius-md;
    text-align: center;
    gap: 2px;
    transition: background 0.2s ease, transform 0.15s ease;

    &:hover {
      transform: translateY(-1px);
    }

    &--empty {
      background: var(--sub-bg-color);
    }

    &--l1 {
      background: color-mix(in srgb, var(--progress-color) 18%, var(--sub-bg-color));
    }

    &--l2 {
      background: color-mix(in srgb, var(--progress-color) 35%, var(--sub-bg-color));
    }

    &--l3 {
      background: color-mix(in srgb, var(--progress-color) 55%, var(--sub-bg-color));
    }
  }

  &__month-name {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    font-weight: $font-weight-medium;
  }

  &__month-count {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.1;
  }

  &__month-label {
    font-family: $font-family-body;
    font-size: 0.625rem;
    color: var(--text-color-muted);
  }

  // --- Rating distribution ---
  &__rating-chart {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__rating-summary {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-xs;
    flex-wrap: wrap;
  }

  &__rating-summary-avg {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__rating-summary-count {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__rating-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__rating-stars {
    display: flex;
    min-width: 5.5rem;
    justify-content: flex-end;
  }

  &__rating-star {
    width: 0.875rem;
    height: 0.875rem;
  }

  &__rating-bar-track {
    flex: 1;
    height: 0.75rem;
    background: var(--sub-bg-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__rating-bar-fill {
    height: 100%;
    background: var(--rating-color);
    border-radius: $radius-full;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    min-width: 0;

    &--zero {
      width: 0 !important;
    }
  }

  &__rating-count {
    min-width: 1.5rem;
    text-align: right;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--text-color-muted);
  }

  &__rating-insight {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: var(--sub-bg-color);
    border-radius: $radius-md;
    margin-top: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
    line-height: 1.4;

    strong {
      color: var(--text-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__rating-insight-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__rating-insight-detail {
    color: var(--text-color-muted);
    font-size: $font-size-xs;
    margin-left: $spacing-xs;
  }

  // --- Authors ---
  &__authors {
    @include flex-column;
    gap: $spacing-md;
  }

  &__authors-summary {
    display: flex;
    gap: $spacing-lg;
    flex-wrap: wrap;
  }

  &__authors-stat {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);

    strong {
      color: var(--text-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__authors-list {
    list-style: none;
    padding: 0;
    margin: 0;
    @include flex-column;
    gap: $spacing-sm;
  }

  &__author-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__author-rank {
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: var(--text-color-muted);
    min-width: 1.25rem;
    text-align: center;
  }

  &__author-cover {
    width: 2rem;
    height: 3rem;
    object-fit: cover;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    flex-shrink: 0;

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: $font-family-heading;
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      color: var(--text-color-muted);
    }
  }

  &__author-info {
    @include flex-column;
    gap: 1px;
    min-width: 0;
  }

  &__author-name {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__author-count {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  // --- Page count distribution ---
  &__pages {
    @include flex-column;
    gap: $spacing-lg;
  }

  &__pages-bars {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__pages-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__pages-bucket {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    min-width: 4.5rem;
    text-align: right;
  }

  &__pages-bar-track {
    flex: 1;
    height: 0.5rem;
    background: var(--sub-bg-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__pages-bar-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: $radius-full;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__pages-count {
    min-width: 1.5rem;
    text-align: right;
    font-family: $font-family-body;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--text-color-muted);
  }

  &__pages-extremes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-md;
  }

  &__pages-extreme {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }

  &__pages-cover {
    width: 2.5rem;
    height: 3.75rem;
    object-fit: cover;
    border-radius: $radius-sm;
    background: var(--sub-bg-color);
    flex-shrink: 0;
  }

  &__pages-extreme-info {
    @include flex-column;
    gap: 1px;
    min-width: 0;
  }

  &__pages-extreme-label {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__pages-extreme-title {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__pages-extreme-pages {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }
}
</style>
