<template>
  <NuxtLayout name="landing">
    <div ref="containerRef" class="landing">
      <!-- Floating theme switcher -->
      <div class="landing__theme">
        <ThemeSwitcher />
      </div>

      <!-- ===================== HERO ===================== -->
      <section class="hero">
        <!-- Book cover marquee (background) -->
        <div class="marquee" aria-hidden="true">
          <div class="marquee__row marquee__row--1">
            <div class="marquee__track">
              <img
                v-for="book in marqueeRow1"
                :key="book.title"
                :src="book.cover"
                :alt="book.title"
                class="marquee__cover"
                loading="eager"
                width="120"
                height="180"
              >
              <!-- Duplicate for seamless loop -->
              <img
                v-for="book in marqueeRow1"
                :key="book.title + '-dup'"
                :src="book.cover"
                :alt="book.title"
                class="marquee__cover"
                loading="eager"
                width="120"
                height="180"
              >
            </div>
          </div>
          <div class="marquee__row marquee__row--2">
            <div class="marquee__track marquee__track--reverse">
              <img
                v-for="book in marqueeRow2"
                :key="book.title"
                :src="book.cover"
                :alt="book.title"
                class="marquee__cover"
                loading="eager"
                width="120"
                height="180"
              >
              <img
                v-for="book in marqueeRow2"
                :key="book.title + '-dup'"
                :src="book.cover"
                :alt="book.title"
                class="marquee__cover"
                loading="eager"
                width="120"
                height="180"
              >
            </div>
          </div>
          <div class="marquee__row marquee__row--3">
            <div class="marquee__track">
              <img
                v-for="book in marqueeRow3"
                :key="book.title"
                :src="book.cover"
                :alt="book.title"
                class="marquee__cover"
                loading="eager"
                width="120"
                height="180"
              >
              <img
                v-for="book in marqueeRow3"
                :key="book.title + '-dup'"
                :src="book.cover"
                :alt="book.title"
                class="marquee__cover"
                loading="eager"
                width="120"
                height="180"
              >
            </div>
          </div>
          <div class="marquee__fade" />
        </div>

        <!-- Hero content (overlaying marquee) -->
        <div class="hero__content">
          <h1 class="hero__title">
            <span class="hero__title-line">Your reading life,</span>
            <span class="hero__title-line hero__title-line--2">beautifully organized.</span>
          </h1>
          <p class="hero__subtitle">
            Track books, curate shelves, set goals, and discover your reading story — all in one warm, focused space.
          </p>
          <div class="hero__actions">
            <NuxtLink to="/signup" class="landing-btn landing-btn--primary">
              Get Started
            </NuxtLink>
            <button class="landing-btn landing-btn--ghost" @click="enterGuestMode">
              Try the demo
            </button>
          </div>
          <p class="hero__hint">No credit card. No social feeds. Just your books.</p>
        </div>
      </section>

      <!-- ===================== HOW IT WORKS ===================== -->
      <section class="steps">
        <div class="steps__inner">
          <div class="steps__step" data-reveal>
            <div class="steps__number">1</div>
            <div class="steps__icon-wrap">
              <Search :size="28" />
            </div>
            <h3 class="steps__title">Search</h3>
            <p class="steps__text">Find any book instantly with dual-API search across millions of titles.</p>
          </div>
          <div class="steps__connector" data-reveal aria-hidden="true">
            <ChevronRight :size="20" />
          </div>
          <div class="steps__step" data-reveal>
            <div class="steps__number">2</div>
            <div class="steps__icon-wrap">
              <Library :size="28" />
            </div>
            <h3 class="steps__title">Organize</h3>
            <p class="steps__text">Add books to shelves, build custom collections, and curate your library.</p>
          </div>
          <div class="steps__connector" data-reveal aria-hidden="true">
            <ChevronRight :size="20" />
          </div>
          <div class="steps__step" data-reveal>
            <div class="steps__number">3</div>
            <div class="steps__icon-wrap">
              <TrendingUp :size="28" />
            </div>
            <h3 class="steps__title">Track</h3>
            <p class="steps__text">Log progress, set goals, and watch your reading story unfold.</p>
          </div>
        </div>
      </section>

      <!-- ===================== FEATURES ===================== -->
      <section class="features">
        <div class="features__inner">
          <div class="features__card" data-reveal :style="{ '--reveal-delay': '0ms' }">
            <div class="features__icon-wrap">
              <BookOpen :size="24" />
            </div>
            <h3 class="features__card-title">Track Your Progress</h3>
            <p class="features__card-text">
              Update your page count, hit milestones, and watch your progress bar grow. Every page counts.
            </p>
          </div>

          <div class="features__card" data-reveal :style="{ '--reveal-delay': '100ms' }">
            <div class="features__icon-wrap">
              <Target :size="24" />
            </div>
            <h3 class="features__card-title">Set Reading Goals</h3>
            <p class="features__card-text">
              Yearly targets with pace tracking — see if you're ahead, on track, or need to pick up a book.
            </p>
          </div>

          <div class="features__card" data-reveal :style="{ '--reveal-delay': '200ms' }">
            <div class="features__icon-wrap">
              <BarChart3 :size="24" />
            </div>
            <h3 class="features__card-title">Discover Patterns</h3>
            <p class="features__card-text">
              Pages per month, favorite authors, rating distribution — your reading life in beautiful detail.
            </p>
          </div>

          <div class="features__card" data-reveal :style="{ '--reveal-delay': '300ms' }">
            <div class="features__icon-wrap">
              <Palette :size="24" />
            </div>
            <h3 class="features__card-title">Three Warm Themes</h3>
            <p class="features__card-text">
              Sepia-warm light, espresso dark, and true-black OLED — read your way, day or night.
            </p>
          </div>
        </div>
      </section>

      <!-- ===================== STATS PREVIEW ===================== -->
      <section class="preview">
        <div class="preview__inner">
          <div class="preview__text" data-reveal>
            <h2 class="preview__title">Your reading year, at a glance</h2>
            <p class="preview__subtitle">
              Bookshelf turns your reading data into insights. See your pace, discover patterns, and share your year in review.
            </p>
            <button class="landing-btn landing-btn--ghost" @click="enterGuestMode">
              Explore the demo &rarr;
            </button>
          </div>
          <div ref="statsRef" class="preview__stats" data-reveal aria-hidden="true">
            <div class="preview__stat-card">
              <span class="preview__stat-value">{{ animatedStats.books }}</span>
              <span class="preview__stat-label">Books this year</span>
              <div class="preview__mini-chart">
                <div
                  v-for="h in miniChartData"
                  :key="h.m"
                  class="preview__mini-bar"
                  :style="{ '--bar-height': h.h }"
                  :class="{ 'preview__mini-bar--animate': statsVisible }"
                />
              </div>
            </div>
            <div class="preview__stat-card">
              <span class="preview__stat-value">{{ animatedStats.pages.toLocaleString() }}</span>
              <span class="preview__stat-label">Pages turned</span>
            </div>
            <div class="preview__stat-card">
              <span class="preview__stat-value">
                {{ animatedStats.rating }}
                <svg class="preview__star" viewBox="0 0 24 24" fill="var(--rating-color)" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              </span>
              <span class="preview__stat-label">Average rating</span>
            </div>
            <div class="preview__stat-card">
              <span class="preview__stat-value">{{ animatedStats.days }}</span>
              <span class="preview__stat-label">Days to finish a book</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================== FINAL CTA ===================== -->
      <section class="cta">
        <div class="cta__inner" data-reveal>
          <div class="cta__covers" aria-hidden="true">
            <img
              v-for="(book, i) in ctaBooks"
              :key="book.title"
              :src="book.cover"
              :alt="book.title"
              class="cta__cover"
              :class="`cta__cover--${i + 1}`"
              loading="lazy"
              width="100"
              height="150"
            >
          </div>
          <h2 class="cta__title">Start your reading journey</h2>
          <p class="cta__subtitle">
            Join readers who track their books with intention, not algorithms.
          </p>
          <div class="cta__actions">
            <NuxtLink to="/signup" class="landing-btn landing-btn--primary">
              Create your bookshelf
            </NuxtLink>
            <NuxtLink to="/login" class="cta__login-link">
              Already have an account? Sign in
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- ===================== FOOTER ===================== -->
      <footer class="landing__footer">
        <span class="landing__footer-brand">
          <BookshelfLogo :size="18" bg="transparent" :rounded="false" />
          Bookshelf
        </span>
        <NuxtLink to="/privacy" class="landing__footer-link">Privacy Policy</NuxtLink>
      </footer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Library, BookOpen, Target, BarChart3, Search, ChevronRight, TrendingUp, Palette } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

useSeoMeta({
  title: 'Bookshelf — Your reading life, beautifully organized.',
  ogTitle: 'Bookshelf — Your reading life, beautifully organized.',
  ogDescription: 'Track books, set goals, time reading sessions, and discover your next great read.',
  ogUrl: 'https://bookshelf-clonecore.vercel.app',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Bookshelf — Your reading life, beautifully organized.',
  twitterDescription: 'Track books, set goals, time reading sessions, and discover your next great read.',
})

const { isAuthenticated, isLoading } = useAuth()
const { enterGuestMode } = useGuest()
const { containerRef } = useScrollReveal()

// Auth redirect
watch([isAuthenticated, isLoading], ([authed, loading]) => {
  if (!loading && authed) {
    navigateTo('/library', { replace: true })
  }
}, { immediate: true })

// ---- Static book data (SSR-friendly, no API calls) ----
const isbn = (id: string) => `https://covers.openlibrary.org/b/isbn/${id}-M.jpg`
const olid = (id: string) => `https://covers.openlibrary.org/b/olid/${id}-M.jpg`

const marqueeRow1 = [
  { cover: olid('OL32614650M'), title: 'He Who Fights with Monsters' },
  { cover: isbn('9780593441220'), title: 'Funny Story' },
  { cover: isbn('9780316556347'), title: 'Circe' },
  { cover: isbn('9781399622066'), title: 'The Way of Kings' },
  { cover: isbn('9780385551151'), title: 'Lessons in Chemistry' },
  { cover: isbn('9780593321201'), title: 'The Midnight Library' },
  { cover: isbn('9781635577020'), title: 'A Court of Thorns and Roses' },
  { cover: isbn('9780593135204'), title: 'Project Hail Mary' },
  { cover: isbn('9780316769488'), title: 'The Catcher in the Rye' },
  { cover: isbn('9780060935467'), title: 'To Kill a Mockingbird' },
  { cover: isbn('9780451524935'), title: '1984' },
  { cover: isbn('9780547928227'), title: 'The Hobbit' },
  { cover: isbn('9780743273565'), title: 'The Great Gatsby' },
  { cover: isbn('9780061120084'), title: 'To Kill a Mockingbird (Harper)' },
  { cover: isbn('9780593099322'), title: 'Recursion' },
  { cover: isbn('9780593395943'), title: 'The Atlas Six' },
]

const marqueeRow2 = [
  { cover: isbn('9780062024039'), title: 'Divergent' },
  { cover: isbn('9780593438589'), title: 'Legends & Lattes' },
  { cover: isbn('9780062060624'), title: 'Where the Crawdads Sing' },
  { cover: isbn('9780735211292'), title: 'Atomic Habits' },
  { cover: isbn('9781408884447'), title: 'House of Flame and Shadow' },
  { cover: isbn('9780593230572'), title: 'Babel' },
  { cover: isbn('9781250178633'), title: 'The Women' },
  { cover: isbn('9780525559474'), title: 'The Vanishing Half' },
  { cover: isbn('9780374529260'), title: 'Brave New World' },
  { cover: isbn('9780062316110'), title: 'Sapiens' },
  { cover: isbn('9780553380163'), title: 'A Game of Thrones' },
  { cover: isbn('9780062457714'), title: 'The Song of Achilles' },
  { cover: isbn('9780593334836'), title: 'The Love Hypothesis' },
  { cover: isbn('9780062561022'), title: 'The Seven Husbands of Evelyn Hugo' },
  { cover: isbn('9780593139134'), title: 'The Invisible Life of Addie LaRue' },
  { cover: isbn('9780593187685'), title: 'Mexican Gothic' },
]

const marqueeRow3 = [
  { cover: isbn('9780593820247'), title: 'Dungeon Crawler Carl' },
  { cover: isbn('9780441013593'), title: 'Dune' },
  { cover: isbn('9781761641176'), title: 'Sunrise on the Reaping' },
  { cover: isbn('9780593441275'), title: 'Happy Place' },
  { cover: isbn('9780756404741'), title: 'The Name of the Wind' },
  { cover: isbn('9780062315007'), title: 'The Alchemist' },
  { cover: isbn('9780143110439'), title: 'A Gentleman in Moscow' },
  { cover: isbn('9781984822185'), title: 'Normal People' },
  { cover: isbn('9780385333481'), title: 'The Handmaid\'s Tale' },
  { cover: isbn('9780062498533'), title: 'The Girl on the Train' },
  { cover: isbn('9780062963673'), title: 'The House in the Cerulean Sea' },
  { cover: isbn('9780593355305'), title: 'Piranesi' },
  { cover: isbn('9780062873712'), title: 'Educated' },
  { cover: isbn('9780593337585'), title: 'Anxious People' },
  { cover: isbn('9780062390851'), title: 'Dark Matter' },
  { cover: isbn('9780593321485'), title: 'The Thursday Murder Club' },
]

const ctaBooks = [
  { cover: isbn('9780593820247'), title: 'Dungeon Crawler Carl' },
  { cover: isbn('9780593321201'), title: 'The Midnight Library' },
  { cover: isbn('9780593441220'), title: 'Funny Story' },
]

const miniChartData = [
  { m: 1, h: '30%' },
  { m: 2, h: '50%' },
  { m: 3, h: '40%' },
  { m: 4, h: '70%' },
  { m: 5, h: '60%' },
  { m: 6, h: '90%' },
  { m: 7, h: '45%' },
  { m: 8, h: '80%' },
  { m: 9, h: '65%' },
  { m: 10, h: '100%' },
  { m: 11, h: '55%' },
  { m: 12, h: '35%' },
]

// ---- Stat count-up animation ----

const statsRef = ref<HTMLElement | null>(null)
const statsVisible = ref(false)
const animatedStats = reactive({
  books: 0,
  pages: 0,
  rating: '0.0',
  days: 0,
})

const targetStats = { books: 24, pages: 7842, rating: 4.2, days: 12 }

function animateValue(from: number, to: number, duration: number, onUpdate: (v: number) => void) {
  const start = performance.now()
  function tick(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    onUpdate(from + (to - from) * eased)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  if (!statsRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animatedStats.books = targetStats.books
    animatedStats.pages = targetStats.pages
    animatedStats.rating = targetStats.rating.toFixed(1)
    animatedStats.days = targetStats.days
    statsVisible.value = true
    return
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        statsVisible.value = true
        animateValue(0, targetStats.books, 1500, (v) => { animatedStats.books = Math.round(v) })
        animateValue(0, targetStats.pages, 1800, (v) => { animatedStats.pages = Math.round(v) })
        animateValue(0, targetStats.rating, 1200, (v) => { animatedStats.rating = v.toFixed(1) })
        animateValue(0, targetStats.days, 1200, (v) => { animatedStats.days = Math.round(v) })
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(statsRef.value)
})
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

// ===========================
// Page wrapper
// ===========================

.landing {
  position: relative;
  overflow: hidden;

  &__theme {
    position: fixed;
    top: $spacing-md;
    right: $spacing-md;
    z-index: 50;
  }
}

// ===========================
// Shared button styles
// ===========================

.landing-btn {
  @include button-base;

  &--primary {
    padding: $spacing-sm $spacing-xl;
    background: var(--highlight-color);
    color: #fff;
    border: 2px solid var(--highlight-color);
    font-size: $font-size-base;

    &:hover {
      background: var(--highlight-color-hover);
      border-color: var(--highlight-color-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      color: #fff;
    }
  }

  &--ghost {
    padding: $spacing-sm $spacing-md;
    background: transparent;
    border: none;
    color: var(--text-color-secondary);
    font-weight: $font-weight-medium;
    font-size: $font-size-base;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--border-color);

    &:hover {
      color: var(--highlight-color);
      text-decoration-color: var(--highlight-color);
    }
  }
}

// ===========================
// Intro animations
// ===========================

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero__title-line {
  display: block;
  opacity: 0;
  animation: hero-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  &--2 {
    animation-delay: 0.15s;
  }
}

.hero__subtitle {
  opacity: 0;
  animation: hero-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
}

.hero__actions {
  opacity: 0;
  animation: hero-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
}

.hero__hint {
  opacity: 0;
  animation: hero-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
}

// ===========================
// Scroll reveal
// ===========================

[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

// ===========================
// Book Marquee (hero background)
// ===========================

$marquee-cover-width: 7rem;
$marquee-gap: $spacing-md;
$marquee-duration: 60s;

@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes marquee-scroll-reverse {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

.marquee {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: $spacing-md;
  pointer-events: none;
  z-index: 0;

  &__row {
    display: flex;
    overflow: hidden;

    &--1 { transform: rotate(-3deg) translateX(-2rem); }
    &--2 { transform: rotate(-3deg) translateX(1rem); }
    &--3 { transform: rotate(-3deg) translateX(-4rem); }
  }

  &__track {
    display: flex;
    gap: $marquee-gap;
    animation: marquee-scroll $marquee-duration linear infinite;
    will-change: transform;

    &--reverse {
      animation-name: marquee-scroll-reverse;
      animation-duration: #{$marquee-duration * 1.15};
    }
  }

  &__cover {
    width: $marquee-cover-width;
    aspect-ratio: 2 / 3;
    border-radius: $radius-sm;
    box-shadow: var(--shadow-book);
    object-fit: cover;
    flex-shrink: 0;
    opacity: 0.35;
    background-color: var(--surface-color);

    @include respond-to($breakpoint-md) {
      width: 8rem;
    }

    @include respond-to($breakpoint-lg) {
      width: 9rem;
      opacity: 0.3;
    }
  }

  // Gradient overlay for text readability
  &__fade {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(
      ellipse 80% 70% at 50% 50%,
      var(--bg-color) 20%,
      transparent 70%
    );

    // Extra edge fade
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to right, var(--bg-color) 0%, transparent 15%, transparent 85%, var(--bg-color) 100%),
        linear-gradient(to bottom, var(--bg-color) 0%, transparent 12%, transparent 88%, var(--bg-color) 100%);
    }
  }
}

// ===========================
// Hero
// ===========================

.hero {
  position: relative;
  min-height: min(90dvh, 56rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-4xl $spacing-md $spacing-3xl;

  @include respond-to($breakpoint-md) {
    padding: $spacing-4xl $spacing-xl;
  }

  &__content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 40rem;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: clamp(2.4rem, 6vw, 3.6rem);
    font-weight: $font-weight-bold;
    line-height: 1.12;
    color: var(--text-color);
    margin-bottom: $spacing-lg;
  }

  &__subtitle {
    @include body-text;
    font-size: $font-size-lg;
    max-width: 42ch;
    margin-inline: auto;
    margin-bottom: $spacing-2xl;
    color: var(--text-color-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-lg;
    flex-wrap: wrap;
    margin-bottom: $spacing-md;
  }

  &__hint {
    @include meta-text;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }
}

// ===========================
// How it works (steps)
// ===========================

.steps {
  padding: $spacing-3xl $spacing-md;
  background-color: var(--sub-bg-color);

  @include respond-to($breakpoint-md) {
    padding: $spacing-4xl $spacing-xl;
  }

  &__inner {
    max-width: $page-max-width;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xl;

    @include respond-to($breakpoint-md) {
      flex-direction: row;
      justify-content: center;
      gap: $spacing-lg;
    }
  }

  &__step {
    position: relative;
    text-align: center;
    max-width: 16rem;
  }

  &__number {
    position: absolute;
    top: -$spacing-sm;
    left: -$spacing-sm;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--highlight-color);
    color: #fff;
    font-family: $font-family-heading;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    @include flex-center;
    line-height: 1;
  }

  &__icon-wrap {
    @include flex-center;
    width: 4rem;
    height: 4rem;
    border-radius: $radius-xl;
    background: var(--highlight-color-subtle);
    color: var(--highlight-color);
    margin: 0 auto $spacing-md;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    margin-bottom: $spacing-xs;
  }

  &__text {
    @include meta-text;
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
    line-height: 1.6;
  }

  &__connector {
    color: var(--text-color-muted);
    flex-shrink: 0;

    // Rotate arrow down on mobile
    @include respond-below($breakpoint-md) {
      transform: rotate(90deg);
    }
  }
}

// ===========================
// Features
// ===========================

.features {
  padding: $spacing-4xl $spacing-md;

  @include respond-to($breakpoint-md) {
    padding: $spacing-4xl $spacing-xl;
  }

  &__inner {
    max-width: $page-max-width;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-xl;

    @include respond-to($breakpoint-sm) {
      grid-template-columns: repeat(2, 1fr);
    }

    @include respond-to($breakpoint-lg) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__card {
    padding: $spacing-xl $spacing-lg;
    border-radius: $radius-xl;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    transition: transform $transition-base, box-shadow $transition-base;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
  }

  &__icon-wrap {
    @include flex-center;
    width: 3rem;
    height: 3rem;
    border-radius: $radius-lg;
    background: var(--highlight-color-subtle);
    color: var(--highlight-color);
    margin-bottom: $spacing-md;
  }

  &__card-title {
    font-family: $font-family-heading;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
    margin-bottom: $spacing-sm;
  }

  &__card-text {
    @include meta-text;
    font-size: $font-size-sm;
    line-height: 1.6;
    color: var(--text-color-secondary);
  }
}

// ===========================
// Stats preview
// ===========================

.preview {
  padding: $spacing-4xl $spacing-md;
  background-color: var(--sub-bg-color);

  @include respond-to($breakpoint-md) {
    padding: $spacing-4xl $spacing-xl;
  }

  &__inner {
    max-width: $page-max-width;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-3xl;
    align-items: center;

    @include respond-to($breakpoint-lg) {
      grid-template-columns: 1fr 1.2fr;
    }
  }

  &__text {
    text-align: center;

    @include respond-to($breakpoint-lg) {
      text-align: left;
    }
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    margin-bottom: $spacing-md;
  }

  &__subtitle {
    @include body-text;
    max-width: 38ch;
    margin-bottom: $spacing-xl;

    @include respond-below($breakpoint-lg) {
      margin-inline: auto;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }

  &__stat-card {
    padding: $spacing-lg;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-xl;
    overflow: hidden;
  }

  &__stat-value {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    line-height: 1;
    margin-bottom: $spacing-xs;
  }

  &__stat-label {
    @include meta-text;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__star {
    width: 1.2rem;
    height: 1.2rem;
    flex-shrink: 0;
  }

  // Mini bar chart — grows upward on reveal
  &__mini-chart {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 2.5rem;
    margin-top: $spacing-md;
  }

  &__mini-bar {
    flex: 1;
    background: var(--progress-color);
    border-radius: 2px 2px 0 0;
    opacity: 0.7;
    min-height: 3px;
    height: 3px;
    transition: height 1s cubic-bezier(0.16, 1, 0.3, 1);

    &--animate {
      height: var(--bar-height);
    }

    &:last-child { opacity: 0.35; }
    &:nth-last-child(2) { opacity: 0.5; }
  }
}

// ===========================
// Final CTA
// ===========================

.cta {
  padding: $spacing-4xl $spacing-md;
  text-align: center;

  @include respond-to($breakpoint-md) {
    padding: $spacing-4xl $spacing-xl;
  }

  &__inner {
    position: relative;
    max-width: 36rem;
    margin: 0 auto;
  }

  // Floating decorative covers behind CTA
  &__covers {
    position: absolute;
    inset: 0;
    pointer-events: none;

    @include respond-below($breakpoint-sm) {
      display: none;
    }
  }

  &__cover {
    position: absolute;
    width: 5.5rem;
    aspect-ratio: 2 / 3;
    border-radius: $radius-sm;
    box-shadow: var(--shadow-book);
    object-fit: cover;
    opacity: 0.18;

    &--1 {
      top: -1rem;
      left: -4rem;
      transform: rotate(-10deg);
    }
    &--2 {
      bottom: -0.5rem;
      left: -2rem;
      transform: rotate(6deg);
    }
    &--3 {
      top: 0;
      right: -4rem;
      transform: rotate(8deg);
    }
  }

  &__title {
    position: relative;
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--text-color);
    margin-bottom: $spacing-md;
  }

  &__subtitle {
    position: relative;
    @include body-text;
    margin-bottom: $spacing-2xl;
  }

  &__actions {
    position: relative;
    @include flex-column;
    align-items: center;
    gap: $spacing-lg;
  }

  &__login-link {
    @include meta-text;
    color: var(--text-color-muted);

    &:hover {
      color: var(--highlight-color);
    }
  }
}

// ===========================
// Footer
// ===========================

.landing__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
  padding: $spacing-xl $spacing-md $spacing-2xl;
  border-top: 1px solid var(--border-color-subtle);

  &-brand {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-family: $font-family-heading;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color-muted);
  }

  &-link {
    @include meta-text;
    color: var(--text-color-muted);

    &:hover {
      color: var(--highlight-color);
    }
  }
}

// ===========================
// Reduced motion
// ===========================

@media (prefers-reduced-motion: reduce) {
  .hero__title-line,
  .hero__subtitle,
  .hero__actions,
  .hero__hint {
    opacity: 1 !important;
    animation: none !important;
    transform: none !important;
  }

  .marquee__track {
    animation-play-state: paused !important;
  }

  [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  .features__card:hover {
    transform: none;
  }

  .preview__mini-bar {
    height: var(--bar-height) !important;
    transition: none !important;
  }
}
</style>
