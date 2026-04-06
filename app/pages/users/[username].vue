<template>
  <div class="profile">
    <div v-if="error" class="profile__error">
      <h2 class="profile__error-title">{{ error.statusCode === 403 ? 'Not friends' : 'User not found' }}</h2>
      <p class="profile__error-text">
        {{ error.statusCode === 403 ? 'You must be friends to view this profile.' : 'This user doesn\'t exist.' }}
      </p>
      <NuxtLink to="/friends" class="profile__back-link">← Back to Friends</NuxtLink>
    </div>

    <template v-else-if="profile">
      <!-- Header -->
      <header class="profile__header">
        <div class="profile__avatar" :data-initial="(profile.name || '?').charAt(0)">
          <img v-if="profile.avatar" :src="`/avatars/${profile.avatar}.svg`" :alt="profile.name" class="profile__avatar-img">
        </div>
        <div class="profile__header-info">
          <h1 class="profile__name">{{ profile.name }}</h1>
          <span v-if="profile.username" class="profile__username">@{{ profile.username }}</span>
          <span class="profile__member-since">Member since {{ formatDate(profile.memberSince) }}</span>
        </div>
        <button class="profile__remove-btn" @click="confirmRemove">Remove friend</button>
      </header>

      <!-- Currently reading -->
      <section v-if="profile.currentlyReading && profile.currentlyReading.length > 0" class="profile__section">
        <h2 class="profile__section-title">Currently Reading</h2>
        <div class="profile__books">
          <div v-for="(book, i) in profile.currentlyReading" :key="i" class="profile__book">
            <img
              v-if="book.coverUrlSmall"
              :src="book.coverUrlSmall"
              :alt="book.title"
              class="profile__book-cover"
              loading="lazy"
            >
            <div class="profile__book-info">
              <span class="profile__book-title">{{ book.title }}</span>
              <span class="profile__book-author">{{ book.author }}</span>
              <div v-if="book.progressPercent" class="profile__book-progress">
                <div class="profile__book-bar">
                  <div class="profile__book-bar-fill" :style="{ width: `${parseFloat(book.progressPercent)}%` }" />
                </div>
                <span class="profile__book-pct">{{ Math.round(parseFloat(book.progressPercent)) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Shelves -->
      <section v-if="profile.shelves && profile.shelves.length > 0" class="profile__section">
        <h2 class="profile__section-title">Shelves</h2>
        <div class="profile__shelves">
          <div v-for="shelf in profile.shelves" :key="shelf.id" class="profile__shelf">
            <span class="profile__shelf-name">{{ shelf.name }}</span>
            <span class="profile__shelf-count">{{ shelf.bookCount }} {{ shelf.bookCount === 1 ? 'book' : 'books' }}</span>
          </div>
        </div>
      </section>

      <!-- Goal -->
      <section v-if="profile.goal" class="profile__section">
        <h2 class="profile__section-title">{{ profile.goal.year }} Reading Goal</h2>
        <div class="profile__goal">
          <div class="profile__goal-bar">
            <div class="profile__goal-fill" :style="{ width: `${Math.min(100, (profile.goal.completed / profile.goal.target) * 100)}%` }" />
          </div>
          <span class="profile__goal-text">{{ profile.goal.completed }} / {{ profile.goal.target }} books</span>
        </div>
      </section>

      <!-- Ratings -->
      <section v-if="profile.ratings" class="profile__section">
        <h2 class="profile__section-title">Ratings</h2>
        <div class="profile__ratings">
          <span v-if="profile.ratings.avgRating" class="profile__ratings-avg">
            {{ profile.ratings.avgRating }}★ average
          </span>
          <span class="profile__ratings-count">{{ profile.ratings.totalRated }} of {{ profile.ratings.totalBooks }} rated</span>
        </div>
      </section>

      <!-- Recent activity -->
      <section v-if="profile.recentActivity && profile.recentActivity.length > 0" class="profile__section">
        <h2 class="profile__section-title">Recent Activity</h2>
        <div class="profile__activity">
          <div v-for="item in profile.recentActivity" :key="item.id" class="profile__activity-item">
            <span class="profile__activity-text">
              {{ actionLabel(item.action) }}
              <strong v-if="item.book">{{ item.book.title }}</strong>
              <template v-if="item.action === 'rated_book' && item.metadata?.rating">
                — {{ item.metadata.rating }}★
              </template>
            </span>
            <time class="profile__activity-time">{{ formatTimeAgo(item.createdAt) }}</time>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="profile__loading">
      <div class="profile__skel profile__skel--header" />
      <div class="profile__skel profile__skel--section" />
      <div class="profile__skel profile__skel--section" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface ProfileBook {
  title: string
  author: string
  coverUrlSmall: string | null
  progressPercent?: string
}

interface ProfileShelf {
  id: string
  name: string
  bookCount: number
}

interface ProfileGoal {
  year: number
  target: number
  completed: number
}

interface ProfileRatings {
  avgRating: number | null
  totalRated: number
  totalBooks: number
}

interface ProfileActivity {
  id: string
  action: string
  metadata: { rating?: number } | null
  createdAt: string
  book: { title: string; author: string } | null
}

interface UserProfile {
  id: string
  name: string
  username: string | null
  avatar: string | null
  memberSince: string
  currentlyReading: ProfileBook[]
  shelves: ProfileShelf[]
  goal: ProfileGoal | null
  ratings: ProfileRatings | null
  recentActivity: ProfileActivity[]
}

definePageMeta({ layout: 'default' })

const route = useRoute()
const username = computed(() => route.params.username as string)

const { removeFriend } = useFriends()

const profile = ref<UserProfile | null>(null)
const error = ref<{ statusCode: number } | null>(null)

useHead({ title: computed(() => profile.value ? `${profile.value.name} — Bookshelf` : 'Profile — Bookshelf') })

async function loadProfile() {
  try {
    const data = await $fetch<Partial<UserProfile>>(`/api/users/${username.value}/profile`)
    profile.value = {
      ...data,
      id: data.id ?? '',
      name: data.name ?? '',
      username: data.username ?? null,
      avatar: data.avatar ?? null,
      memberSince: data.memberSince ?? '',
      currentlyReading: data.currentlyReading ?? [],
      shelves: data.shelves ?? [],
      goal: data.goal ?? null,
      ratings: data.ratings ?? null,
      recentActivity: data.recentActivity ?? [],
    }
  }
  catch (e: unknown) {
    const err = e as { statusCode?: number }
    error.value = { statusCode: err?.statusCode || 404 }
  }
}

async function confirmRemove() {
  if (!profile.value) return
  if (!confirm(`Remove ${profile.value.name} from your friends?`)) return
  await removeFriend(profile.value.id)
  navigateTo('/friends')
}

function actionLabel(action: string) {
  switch (action) {
    case 'added_book': return 'Added'
    case 'started_reading': return 'Started reading'
    case 'finished_reading': return 'Finished'
    case 'rated_book': return 'Rated'
    case 'hit_goal': return 'Hit their reading goal!'
    default: return action
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

watch(username, () => {
  profile.value = null
  error.value = null
  loadProfile()
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.profile {
  @include container;

  &__error {
    text-align: center;
    padding: $spacing-3xl $spacing-md;
  }

  &__error-title {
    @include heading($font-size-xl);
    margin-bottom: $spacing-sm;
  }

  &__error-text {
    @include body-text;
    color: var(--text-color-secondary);
    margin-bottom: $spacing-md;
  }

  &__back-link {
    color: var(--highlight-color);
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  // Header
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
    flex-wrap: wrap;
  }

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--sub-bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: var(--text-color-muted);

    &::before {
      content: attr(data-initial);
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__header-info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    @include heading($font-size-xl);
    margin-bottom: 0;
  }

  &__username {
    display: block;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__member-since {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    margin-top: $spacing-xs;
  }

  &__remove-btn {
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-md;
    background: none;
    color: var(--text-color-secondary);
    cursor: pointer;

    &:hover {
      color: var(--error-color);
      border-color: var(--error-color);
    }
  }

  // Sections
  &__section {
    margin-bottom: $spacing-xl;
  }

  &__section-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-md;
  }

  // Currently reading
  &__books {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__book {
    display: flex;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
  }

  &__book-cover {
    width: 40px;
    height: 60px;
    object-fit: cover;
    border-radius: $radius-sm;
    flex-shrink: 0;
  }

  &__book-info {
    flex: 1;
    min-width: 0;
  }

  &__book-title {
    display: block;
    font-weight: $font-weight-medium;
    font-size: $font-size-sm;
  }

  &__book-author {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__book-progress {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-top: $spacing-xs;
  }

  &__book-bar {
    flex: 1;
    height: 4px;
    background: var(--sub-bg-color);
    border-radius: 2px;
    overflow: hidden;
  }

  &__book-bar-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: 2px;
  }

  &__book-pct {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    flex-shrink: 0;
  }

  // Shelves
  &__shelves {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__shelf {
    display: flex;
    flex-direction: column;
    padding: $spacing-sm $spacing-md;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
  }

  &__shelf-name {
    font-weight: $font-weight-medium;
    font-size: $font-size-sm;
  }

  &__shelf-count {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  // Goal
  &__goal {
    padding: $spacing-md;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
  }

  &__goal-bar {
    height: 8px;
    background: var(--sub-bg-color);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: $spacing-xs;
  }

  &__goal-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  &__goal-text {
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
  }

  // Ratings
  &__ratings {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-sm;
  }

  &__ratings-avg {
    font-weight: $font-weight-medium;
  }

  &__ratings-count {
    color: var(--text-color-muted);
  }

  // Activity
  &__activity {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__activity-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: $spacing-sm;
    padding: $spacing-xs 0;
    border-bottom: 1px solid var(--border-color-subtle);

    &:last-child {
      border-bottom: none;
    }
  }

  &__activity-text {
    font-size: $font-size-sm;

    strong {
      font-weight: $font-weight-medium;
    }
  }

  &__activity-time {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    flex-shrink: 0;
  }

  // Loading
  &__loading {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__skel {
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    animation: skel-pulse 1.5s ease-in-out infinite;

    &--header { height: 80px; }
    &--section { height: 120px; }
  }
}

@keyframes skel-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
