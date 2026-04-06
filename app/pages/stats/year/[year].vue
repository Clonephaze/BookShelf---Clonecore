<template>
  <div ref="containerRef" class="review">
    <!-- Loading -->
    <div v-if="loading" class="review__loading">
      <div class="review__loading-pulse" />
      <p>Loading your reading story...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!data || data.summary.totalBooks === 0" class="review__empty">
      <div class="review__empty-icon">📚</div>
      <h1 class="review__empty-title">No books yet in {{ year }}</h1>
      <p class="review__empty-text">Finish some books and come back — your year in review will be waiting.</p>
      <NuxtLink to="/search" class="review__empty-cta">Find your next book</NuxtLink>
    </div>

    <!-- Year-in-Review narrative -->
    <template v-else>
      <!-- Hero: Year title -->
      <section class="review__hero">
        <NuxtLink to="/stats" class="review__back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back to Stats
        </NuxtLink>
        <span class="review__hero-eyebrow">Your Year in Books</span>
        <div class="review__hero-nav">
          <NuxtLink
            v-if="year > 2020"
            :to="`/stats/year/${year - 1}`"
            class="review__hero-nav-btn"
            aria-label="Previous year"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </NuxtLink>
          <h1 class="review__hero-year">{{ year }}</h1>
          <NuxtLink
            v-if="year < currentYear"
            :to="`/stats/year/${year + 1}`"
            class="review__hero-nav-btn"
            aria-label="Next year"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </NuxtLink>
        </div>
        <p v-if="data.isCurrentYear" class="review__hero-subtitle">So far this year</p>
      </section>

      <!-- Big numbers -->
      <section class="review__numbers" data-reveal>
        <div class="review__number-card review__number-card--accent">
          <span class="review__number-value">{{ data.summary.totalBooks }}</span>
          <span class="review__number-label">{{ data.summary.totalBooks === 1 ? 'book read' : 'books read' }}</span>
        </div>
        <div class="review__number-card">
          <span class="review__number-value">{{ formatNumber(data.summary.totalPages) }}</span>
          <span class="review__number-label">pages turned</span>
        </div>
        <div class="review__number-card">
          <span class="review__number-value">{{ data.summary.uniqueAuthors }}</span>
          <span class="review__number-label">{{ data.summary.uniqueAuthors === 1 ? 'author explored' : 'authors explored' }}</span>
        </div>
        <div v-if="data.summary.avgRating" class="review__number-card">
          <span class="review__number-value">
            {{ data.summary.avgRating }}
            <svg class="review__star" viewBox="0 0 24 24" fill="var(--rating-color)" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </span>
          <span class="review__number-label">average rating</span>
        </div>
      </section>

      <!-- Monthly journey -->
      <section class="review__journey" data-reveal>
        <h2 class="review__section-title">Month by Month</h2>
        <div class="review__month-strip">
          <div
            v-for="m in data.months"
            :key="m.month"
            class="review__month-pip"
            :class="{
              'review__month-pip--active': m.count > 0,
              'review__month-pip--best': data.bestMonth && m.month === data.bestMonth.month,
            }"
          >
            <div class="review__month-pip-bar" :style="{ height: monthBarHeight(m.count) }" />
            <span v-if="m.count > 0" class="review__month-pip-count">{{ m.count }}</span>
            <span class="review__month-pip-name">{{ monthNames[m.month - 1] }}</span>
          </div>
        </div>
        <p v-if="data.bestMonth && data.bestMonth.count > 0" class="review__insight">
          Your biggest reading month was
          <strong>{{ fullMonthNames[data.bestMonth.month - 1] }}</strong>
          with {{ data.bestMonth.count }} {{ data.bestMonth.count === 1 ? 'book' : 'books' }}.
        </p>
      </section>

      <!-- First book of the year -->
      <section v-if="data.firstBook" class="review__moment" data-reveal>
        <span class="review__moment-label">You kicked off the year with</span>
        <div class="review__moment-book">
          <img
            v-if="data.firstBook.coverUrlSmall"
            :src="data.firstBook.coverUrlSmall"
            :alt="data.firstBook.title"
            class="review__moment-cover"
            loading="lazy"
          >
          <div class="review__moment-info">
            <span class="review__moment-title">{{ data.firstBook.title }}</span>
            <span class="review__moment-author">by {{ data.firstBook.author }}</span>
            <span class="review__moment-date">Finished {{ data.firstBook.dateFinished }}</span>
          </div>
        </div>
      </section>

      <!-- Top rated books -->
      <section v-if="data.topRated.length > 0" class="review__top" data-reveal>
        <h2 class="review__section-title">Your Highest Rated</h2>
        <div class="review__top-grid">
          <div
            v-for="(book, i) in data.topRated"
            :key="book.title"
            class="review__top-book"
            :style="{ '--reveal-delay': `${i * 80}ms` }"
          >
            <div class="review__top-rank">#{{ i + 1 }}</div>
            <img
              v-if="book.coverUrlSmall"
              :src="book.coverUrlSmall"
              :alt="book.title"
              class="review__top-cover"
              loading="lazy"
            >
            <div v-else class="review__top-cover review__top-cover--placeholder">
              {{ book.title.charAt(0) }}
            </div>
            <div class="review__top-info">
              <span class="review__top-title">{{ book.title }}</span>
              <span class="review__top-rating">
                <svg v-for="s in (book.rating ?? 0)" :key="s" class="review__top-star" viewBox="0 0 24 24" fill="var(--rating-color)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Genre cloud -->
      <section v-if="data.genres.length > 0" class="review__genres" data-reveal>
        <h2 class="review__section-title">What You Gravitated Toward</h2>
        <div class="review__genre-cloud">
          <span
            v-for="(g, i) in data.genres"
            :key="g.genre"
            class="review__genre-tag"
            :class="{ 'review__genre-tag--primary': i === 0 }"
          >
            {{ g.genre }}
            <span class="review__genre-tag-count">{{ g.count }}</span>
          </span>
        </div>
        <p class="review__insight">
          You read the most <strong>{{ data.genres[0]?.genre }}</strong>
          <template v-if="data.genres.length > 1">
            — but also explored {{ data.genres.slice(1, 3).map(g => g.genre).join(' and ') }}.
          </template>
        </p>
      </section>

      <!-- Superlatives -->
      <section
        v-if="data.fastestRead || data.shortestBook || data.longestBook"
        class="review__superlatives"
        data-reveal
      >
        <h2 class="review__section-title">Your Reading Superlatives</h2>
        <div class="review__super-grid">
          <div v-if="data.fastestRead" class="review__super-card">
            <span class="review__super-emoji" aria-hidden="true">⚡</span>
            <span class="review__super-label">Fastest Read</span>
            <span class="review__super-value">{{ data.fastestRead.title }}</span>
            <span class="review__super-detail">{{ data.fastestRead.days }} {{ data.fastestRead.days === 1 ? 'day' : 'days' }}</span>
          </div>
          <div v-if="data.longestBook" class="review__super-card">
            <span class="review__super-emoji" aria-hidden="true">📏</span>
            <span class="review__super-label">Longest Book</span>
            <span class="review__super-value">{{ data.longestBook.title }}</span>
            <span class="review__super-detail">{{ data.longestBook.pageCount }} pages</span>
          </div>
          <div v-if="data.shortestBook && data.shortestBook.title !== data.longestBook?.title" class="review__super-card">
            <span class="review__super-emoji" aria-hidden="true">📖</span>
            <span class="review__super-label">Shortest Read</span>
            <span class="review__super-value">{{ data.shortestBook.title }}</span>
            <span class="review__super-detail">{{ data.shortestBook.pageCount }} pages</span>
          </div>
        </div>
      </section>

      <!-- Last book / closing -->
      <section v-if="data.lastBook" class="review__moment review__moment--closing" data-reveal>
        <span class="review__moment-label">
          {{ data.isCurrentYear ? 'Your most recent finish' : 'You closed the year with' }}
        </span>
        <div class="review__moment-book">
          <img
            v-if="data.lastBook.coverUrlSmall"
            :src="data.lastBook.coverUrlSmall"
            :alt="data.lastBook.title"
            class="review__moment-cover"
            loading="lazy"
          >
          <div class="review__moment-info">
            <span class="review__moment-title">{{ data.lastBook.title }}</span>
            <span class="review__moment-author">by {{ data.lastBook.author }}</span>
            <span class="review__moment-date">Finished {{ data.lastBook.dateFinished }}</span>
          </div>
        </div>
      </section>

      <!-- Closing message -->
      <section class="review__closing" data-reveal>
        <p class="review__closing-text">
          <template v-if="data.isCurrentYear">
            Keep reading — your {{ year }} story is still being written.
          </template>
          <template v-else>
            {{ data.summary.totalBooks }} {{ data.summary.totalBooks === 1 ? 'book' : 'books' }}, {{ formatNumber(data.summary.totalPages) }} pages, one incredible year of reading.
          </template>
        </p>
        <NuxtLink to="/stats" class="review__closing-cta">Back to Statistics</NuxtLink>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const year = Number(route.params.year) || new Date().getFullYear()
const currentYear = new Date().getFullYear()

useHead({ title: `${year} Year in Review — Bookshelf` })

const { containerRef, refresh } = useScrollReveal()

interface YearData {
  year: number
  isCurrentYear: boolean
  summary: {
    totalBooks: number
    totalPages: number
    avgRating: number | null
    avgPages: number | null
    uniqueAuthors: number
  }
  months: { month: number; count: number }[]
  bestMonth: { month: number; count: number } | null
  topRated: { title: string; author: string; rating: number | null; coverUrlSmall: string | null }[]
  genres: { genre: string; count: number }[]
  fastestRead: { title: string; author: string; days: number; coverUrlSmall: string | null } | null
  firstBook: { title: string; author: string; coverUrlSmall: string | null; dateFinished: string } | null
  lastBook: { title: string; author: string; coverUrlSmall: string | null; dateFinished: string } | null
  shortestBook: { title: string; pageCount: number; coverUrlSmall: string | null } | null
  longestBook: { title: string; pageCount: number; coverUrlSmall: string | null } | null
}

const loading = ref(true)
const data = ref<YearData | null>(null)

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

async function fetchData() {
  loading.value = true
  try {
    const { isGuest } = useGuest()
    const base = isGuest.value ? '/api/guest/stats' : '/api/stats'
    data.value = await $fetch<YearData>(`${base}/year/${year}`)
  }
  catch {
    // Falls through to empty state
  }
  finally {
    loading.value = false
    refresh()
  }
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

const monthMax = computed(() => {
  if (!data.value) return 1
  return Math.max(...data.value.months.map(m => m.count), 1)
})

function monthBarHeight(count: number): string {
  if (count === 0) return '0'
  return `${Math.max(12, (count / monthMax.value) * 100)}%`
}

fetchData()
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.review {
  @include container;
  padding-top: $spacing-xl;
  padding-bottom: $spacing-4xl;
  max-width: 48rem;

  // --- Loading ---
  &__loading {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    min-height: 60vh;
    color: var(--text-color-muted);
    font-family: $font-family-body;
  }

  &__loading-pulse {
    width: 3rem;
    height: 3rem;
    border-radius: $radius-full;
    background: var(--progress-color);
    animation: review-pulse 1.5s ease-in-out infinite;
  }

  @keyframes review-pulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.2); opacity: 1; }
  }

  // --- Empty ---
  &__empty {
    @include flex-column;
    align-items: center;
    text-align: center;
    gap: $spacing-md;
    padding: $spacing-4xl $spacing-xl;
    min-height: 50vh;
    justify-content: center;
  }

  &__empty-icon {
    font-size: 3rem;
  }

  &__empty-title {
    @include heading($font-size-xl);
  }

  &__empty-text {
    @include body-text;
    max-width: 24rem;
  }

  &__empty-cta {
    @include button-primary;
    text-decoration: none;
    margin-top: $spacing-sm;
  }

  // --- Hero ---
  &__hero {
    text-align: center;
    padding: $spacing-3xl 0 $spacing-2xl;
    position: relative;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    text-decoration: none;
    margin-bottom: $spacing-xl;
    transition: color 0.15s ease;

    svg {
      width: 1rem;
      height: 1rem;
    }

    &:hover {
      color: var(--text-color);
    }
  }

  &__hero-eyebrow {
    display: block;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--progress-color);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: $spacing-sm;
  }

  &__hero-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
  }

  &__hero-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: $radius-full;
    background: var(--sub-bg-color);
    color: var(--text-color-muted);
    text-decoration: none;
    transition: all 0.15s ease;

    svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    &:hover {
      background: var(--progress-color);
      color: var(--surface-color);
    }
  }

  &__hero-year {
    font-family: $font-family-heading;
    font-size: clamp(4rem, 12vw, 8rem);
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1;
    letter-spacing: -0.02em;
  }

  &__hero-subtitle {
    font-family: $font-family-body;
    font-size: $font-size-base;
    color: var(--text-color-muted);
    margin-top: $spacing-sm;
    font-style: italic;
  }

  // --- Big numbers ---
  &__numbers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-3xl;

    @include respond-to($breakpoint-sm) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__number-card {
    @include card-base;
    @include flex-column;
    align-items: center;
    text-align: center;
    padding: $spacing-lg $spacing-md;
    gap: $spacing-xs;

    &--accent {
      border-color: var(--progress-color);
      background: color-mix(in srgb, var(--progress-color) 8%, var(--surface-color));
    }
  }

  &__number-value {
    font-family: $font-family-heading;
    font-size: clamp(1.75rem, 5vw, 2.5rem);
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1.1;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__number-label {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__star {
    width: 1.25rem;
    height: 1.25rem;
  }

  // --- Section title ---
  &__section-title {
    font-family: $font-family-heading;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    margin-bottom: $spacing-lg;
    text-align: center;
  }

  // --- Monthly journey ---
  &__journey {
    margin-bottom: $spacing-3xl;
    text-align: center;
  }

  &__month-strip {
    display: flex;
    gap: 4px;
    align-items: flex-end;
    justify-content: center;
    height: 8rem;
    margin-bottom: $spacing-md;
  }

  &__month-pip {
    flex: 1;
    max-width: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
    gap: 4px;
  }

  &__month-pip-bar {
    width: 100%;
    border-radius: $radius-sm $radius-sm 0 0;
    background: var(--sub-bg-color);
    transition: height 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    min-height: 0;

    .review__month-pip--active & {
      background: var(--progress-color);
    }

    .review__month-pip--best & {
      background: var(--rating-color);
    }
  }

  &__month-pip-count {
    font-family: $font-family-heading;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: var(--text-color);
  }

  &__month-pip-name {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
  }

  // --- Insight text ---
  &__insight {
    font-family: $font-family-body;
    font-size: $font-size-base;
    color: var(--text-color-secondary);
    line-height: 1.6;
    text-align: center;
    margin-top: $spacing-md;

    strong {
      color: var(--text-color);
      font-weight: $font-weight-semibold;
    }
  }

  // --- Book moment ---
  &__moment {
    @include card-base;
    padding: $spacing-xl;
    margin-bottom: $spacing-3xl;
    text-align: center;

    &--closing {
      border-color: var(--progress-color);
      background: color-mix(in srgb, var(--progress-color) 5%, var(--surface-color));
    }
  }

  &__moment-label {
    display: block;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
    margin-bottom: $spacing-md;
    font-style: italic;
  }

  &__moment-book {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    justify-content: center;
    text-align: left;
  }

  &__moment-cover {
    width: 3.5rem;
    height: 5.25rem;
    object-fit: cover;
    border-radius: $radius-sm;
    box-shadow: var(--shadow-md);
    flex-shrink: 0;
  }

  &__moment-info {
    @include flex-column;
    gap: 2px;
  }

  &__moment-title {
    font-family: $font-family-heading;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
  }

  &__moment-author {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__moment-date {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    margin-top: $spacing-xs;
  }

  // --- Top rated ---
  &__top {
    margin-bottom: $spacing-3xl;
  }

  &__top-grid {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__top-book {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    @include card-base;
    padding: $spacing-sm $spacing-md;
    transition: transform 0.15s ease;

    &:hover {
      transform: translateX(4px);
    }
  }

  &__top-rank {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-color-muted);
    min-width: 2rem;
    text-align: center;
  }

  &__top-cover {
    width: 2.5rem;
    height: 3.75rem;
    object-fit: cover;
    border-radius: $radius-sm;
    flex-shrink: 0;
    background: var(--sub-bg-color);

    &--placeholder {
      @include flex-center;
      font-family: $font-family-heading;
      font-size: $font-size-lg;
      color: var(--text-color-muted);
    }
  }

  &__top-info {
    @include flex-column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__top-title {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__top-rating {
    display: flex;
    gap: 1px;
  }

  &__top-star {
    width: 0.75rem;
    height: 0.75rem;
  }

  // --- Genre cloud ---
  &__genres {
    margin-bottom: $spacing-3xl;
    text-align: center;
  }

  &__genre-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    justify-content: center;
    margin-bottom: $spacing-sm;
  }

  &__genre-tag {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-md;
    @include card-base;
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);

    &--primary {
      background: color-mix(in srgb, var(--progress-color) 12%, var(--surface-color));
      border-color: var(--progress-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__genre-tag-count {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    font-weight: $font-weight-medium;
  }

  // --- Superlatives ---
  &__superlatives {
    margin-bottom: $spacing-3xl;
  }

  &__super-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: $spacing-md;
  }

  &__super-card {
    @include card-base;
    @include flex-column;
    align-items: center;
    text-align: center;
    padding: $spacing-lg $spacing-md;
    gap: $spacing-xs;
  }

  &__super-emoji {
    font-size: 1.5rem;
    margin-bottom: $spacing-xs;
  }

  &__super-label {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__super-value {
    font-family: $font-family-heading;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
  }

  &__super-detail {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--progress-color);
    font-weight: $font-weight-semibold;
  }

  // --- Closing ---
  &__closing {
    text-align: center;
    padding: $spacing-2xl 0;
  }

  &__closing-text {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--text-color);
    line-height: 1.5;
    margin-bottom: $spacing-lg;
    max-width: 28rem;
    margin-inline: auto;
  }

  &__closing-cta {
    @include button-secondary;
    text-decoration: none;
  }

  // --- Scroll reveal transitions ---
  [data-reveal] {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    transition-delay: var(--reveal-delay, 0ms);

    &.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-reveal] {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
}
</style>
