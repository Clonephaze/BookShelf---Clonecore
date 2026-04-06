<template>
  <div class="friends">
    <header class="friends__header">
      <div>
        <h1 class="friends__title">Friends</h1>
        <p class="friends__subtitle">Connect with readers and see what they're reading</p>
      </div>
      <button
        class="friends__btn friends__btn--ghost friends__refresh-btn"
        :disabled="refreshCooldown"
        @click="handleRefresh"
      >
        {{ refreshCooldown ? 'Refreshed' : 'Refresh' }}
      </button>
    </header>

    <!-- Search -->
    <div v-if="!isGuest" class="friends__search" @focusout="onSearchBlur">
      <label for="friend-search" class="sr-only">Search by username</label>
      <div class="friends__search-box">
        <Search :size="18" class="friends__search-icon" />
        <input
          id="friend-search"
          v-model="searchQuery"
          type="text"
          placeholder="Enter exact username…"
          class="friends__search-input"
          autocomplete="off"
          @input="onSearch"
          @focus="showDropdown = true"
        >
      </div>
      <div v-if="showDropdown && searchResults.length > 0" class="friends__search-results">
        <div v-for="u in searchResults" :key="u.id" class="friends__search-item">
          <div class="friends__avatar" :data-initial="(u.name || u.username || '?').charAt(0)">
            <img v-if="u.avatar" :src="`/avatars/${u.avatar}.svg`" :alt="u.name" class="friends__avatar-img">
          </div>
          <div class="friends__search-info">
            <span class="friends__search-name">{{ u.name }}</span>
            <span v-if="u.username" class="friends__search-username">@{{ u.username }}</span>
          </div>
          <span v-if="u.status === 'friends'" class="friends__search-status">Friends</span>
          <span v-else-if="u.status === 'request_sent'" class="friends__search-status">Pending</span>
          <button
            v-else-if="u.status === 'request_received'"
            class="friends__btn friends__btn--primary"
            @click="handleAcceptFromSearch(u)"
          >
            Accept
          </button>
          <button
            v-else
            class="friends__btn friends__btn--primary"
            :disabled="sendingRequest"
            @click="handleSendRequest(u)"
          >
            Add friend
          </button>
        </div>
      </div>
    </div>

    <!-- Pending requests -->
    <section v-if="receivedRequests.length > 0" class="friends__section">
      <h2 class="friends__section-title">
        Friend Requests
        <span class="friends__badge">{{ receivedRequests.length }}</span>
      </h2>
      <div class="friends__request-list">
        <div v-for="req in receivedRequests" :key="req.id" class="friends__request-card">
          <div class="friends__avatar" :data-initial="(req.user.name || '?').charAt(0)">
            <img v-if="req.user.avatar" :src="`/avatars/${req.user.avatar}.svg`" :alt="req.user.name" class="friends__avatar-img">
          </div>
          <div class="friends__request-info">
            <span class="friends__request-name">{{ req.user.name }}</span>
            <span v-if="req.user.username" class="friends__request-username">@{{ req.user.username }}</span>
          </div>
          <div class="friends__request-actions">
            <button class="friends__btn friends__btn--primary" @click="handleAccept(req.id)">Accept</button>
            <button class="friends__btn friends__btn--ghost" @click="handleDecline(req.id)">Decline</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Friends list -->
    <section class="friends__section">
      <h2 class="friends__section-title">
        {{ friendsList.length > 0 ? `Friends (${friendsList.length})` : 'Friends' }}
      </h2>

      <div v-if="loading" class="friends__loading">
        <div v-for="n in 3" :key="n" class="friends__skel" />
      </div>

      <div v-else-if="friendsList.length === 0" class="friends__empty">
        <div class="friends__empty-icon" aria-hidden="true">👋</div>
        <h3 class="friends__empty-title">No friends yet</h3>
        <p class="friends__empty-text">
          Search for readers by their username to connect and see what they're reading.
        </p>
      </div>

      <div v-else class="friends__grid">
        <NuxtLink
          v-for="friend in friendsList"
          :key="friend.id"
          :to="`/users/${friend.username}`"
          class="friends__card"
        >
          <div class="friends__avatar friends__avatar--lg" :data-initial="(friend.name || '?').charAt(0)">
            <img v-if="friend.avatar" :src="`/avatars/${friend.avatar}.svg`" :alt="friend.name" class="friends__avatar-img">
          </div>
          <div class="friends__card-info">
            <span class="friends__card-name">{{ friend.name }}</span>
            <span v-if="friend.username" class="friends__card-username">@{{ friend.username }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Activity feed -->
    <section v-if="activityFeed.length > 0" class="friends__section">
      <h2 class="friends__section-title">Activity</h2>
      <div class="friends__activity">
        <div v-for="item in activityFeed" :key="item.id" class="friends__activity-item">
          <div class="friends__avatar friends__avatar--sm" :data-initial="(item.user.name || '?').charAt(0)">
            <img v-if="item.user.avatar" :src="`/avatars/${item.user.avatar}.svg`" :alt="item.user.name" class="friends__avatar-img">
          </div>
          <div class="friends__activity-content">
            <p class="friends__activity-text">
              <NuxtLink v-if="item.user.username" :to="`/users/${item.user.username}`" class="friends__activity-user">
                {{ item.user.name }}
              </NuxtLink>
              <strong v-else>{{ item.user.name }}</strong>
              {{ actionLabel(item.action) }}
              <strong v-if="item.book">{{ item.book.title }}</strong>
              <template v-if="item.action === 'rated_book' && item.metadata?.rating">
                — {{ item.metadata.rating }}★
              </template>
            </p>
            <time class="friends__activity-time">{{ formatTimeAgo(item.createdAt) }}</time>
          </div>
          <img
            v-if="item.book?.coverUrlSmall"
            :src="item.book.coverUrlSmall"
            :alt="item.book.title"
            class="friends__activity-cover"
            loading="lazy"
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { UserSearchResult } from '~/composables/useFriends'

definePageMeta({ layout: 'default' })
useHead({ title: 'Friends — Bookshelf' })

const { isGuest } = useGuest()
const {
  friends: friendsList,
  receivedRequests,
  activity: activityFeed,
  loading,
  fetchFriends,
  searchUsers,
  sendRequest,
  acceptRequest,
  declineRequest,
} = useFriends()

// Search
const searchQuery = ref('')
const searchResults = ref<UserSearchResult[]>([])
const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null)
const sendingRequest = ref(false)
const showDropdown = ref(false)

// Refresh
const refreshCooldown = ref(false)

async function handleRefresh() {
  refreshCooldown.value = true
  await fetchFriends(true)
  setTimeout(() => { refreshCooldown.value = false }, 5000)
}

function onSearch() {
  if (searchDebounce.value) clearTimeout(searchDebounce.value)
  searchDebounce.value = setTimeout(async () => {
    if (searchQuery.value.length < 2) {
      searchResults.value = []
      return
    }
    searchResults.value = await searchUsers(searchQuery.value)
    showDropdown.value = true
  }, 300)
}

function onSearchBlur(e: FocusEvent) {
  const related = e.relatedTarget as HTMLElement | null
  // Keep open if focus moved to another element inside the search container
  if (related && (e.currentTarget as HTMLElement)?.contains(related)) return
  setTimeout(() => { showDropdown.value = false }, 150)
}

async function handleSendRequest(u: UserSearchResult) {
  if (!u.username) return
  sendingRequest.value = true
  try {
    await sendRequest(u.username)
    searchResults.value = await searchUsers(searchQuery.value)
  }
  catch { /* silent */ }
  finally {
    sendingRequest.value = false
  }
}

async function handleAcceptFromSearch(u: UserSearchResult) {
  if (!u.requestId) return
  await acceptRequest(u.requestId)
  searchResults.value = await searchUsers(searchQuery.value)
}

async function handleAccept(requestId: string) {
  await acceptRequest(requestId)
}

async function handleDecline(requestId: string) {
  await declineRequest(requestId)
}

function actionLabel(action: string) {
  switch (action) {
    case 'added_book': return 'added'
    case 'started_reading': return 'started reading'
    case 'finished_reading': return 'finished'
    case 'rated_book': return 'rated'
    case 'hit_goal': return 'hit their reading goal!'
    default: return action
  }
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

// Always refetch on navigation — useState persists `loaded` across pages
onMounted(() => fetchFriends(true))
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.friends {
  @include container;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }

  &__refresh-btn {
    flex-shrink: 0;
    margin-top: $spacing-xs;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-xs;
  }

  &__subtitle {
    @include body-text;
    color: var(--text-color-secondary);
  }

  // Search
  &__search {
    margin-bottom: $spacing-xl;
    position: relative;
  }

  &__search-box {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
    padding: $spacing-sm $spacing-md;

    &:focus-within {
      border-color: var(--highlight-color);
    }
  }

  &__search-icon {
    color: var(--text-color-muted);
    flex-shrink: 0;
  }

  &__search-input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-color);
    font-size: $font-size-base;
    outline: none;

    &::placeholder {
      color: var(--text-color-muted);
    }
  }

  &__search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: $spacing-xs;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
    box-shadow: var(--shadow-lg);
    z-index: 10;
    overflow: hidden;
  }

  &__search-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    transition: background 0.15s;

    &:hover {
      background: var(--sub-bg-color);
    }
  }

  &__search-info {
    flex: 1;
    min-width: 0;
  }

  &__search-name {
    display: block;
    font-weight: $font-weight-medium;
    font-size: $font-size-sm;
  }

  &__search-username {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__search-status {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
    font-weight: $font-weight-medium;
  }

  // Section
  &__section {
    margin-bottom: $spacing-xl;
  }

  &__section-title {
    @include heading($font-size-lg);
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__badge {
    background: var(--highlight-color);
    color: var(--bg-color);
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    padding: 0.15em 0.55em;
    border-radius: $radius-xl;
    line-height: 1;
  }

  // Buttons
  &__btn {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-md;
    border: none;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;

    &--primary {
      background: var(--highlight-color);
      color: var(--bg-color);

      &:hover {
        filter: brightness(1.1);
      }
    }

    &--ghost {
      background: none;
      color: var(--text-color-secondary);
      border: 1px solid var(--border-color-subtle);

      &:hover {
        background: var(--sub-bg-color);
      }
    }
  }

  // Requests
  &__request-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__request-card {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
  }

  &__request-info {
    flex: 1;
    min-width: 0;
  }

  &__request-name {
    display: block;
    font-weight: $font-weight-medium;
  }

  &__request-username {
    display: block;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  &__request-actions {
    display: flex;
    gap: $spacing-xs;
  }

  // Avatar
  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--sub-bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color-muted);

    &::before {
      content: attr(data-initial);
    }

    &--lg {
      width: 48px;
      height: 48px;
      font-size: $font-size-base;
    }

    &--sm {
      width: 28px;
      height: 28px;
      font-size: $font-size-xs;
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // Friends grid
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $spacing-md;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:hover {
      border-color: var(--border-color);
      box-shadow: var(--shadow-sm);
    }
  }

  &__card-info {
    min-width: 0;
  }

  &__card-name {
    display: block;
    font-weight: $font-weight-medium;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-username {
    display: block;
    font-size: $font-size-sm;
    color: var(--text-color-muted);
  }

  // Loading
  &__loading {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__skel {
    height: 64px;
    background: var(--sub-bg-color);
    border-radius: $radius-lg;
    animation: skel-pulse 1.5s ease-in-out infinite;
  }

  // Empty
  &__empty {
    text-align: center;
    padding: $spacing-3xl $spacing-md;
  }

  &__empty-icon {
    font-size: 3rem;
    margin-bottom: $spacing-md;
  }

  &__empty-title {
    @include heading($font-size-lg);
    margin-bottom: $spacing-xs;
  }

  &__empty-text {
    @include body-text;
    color: var(--text-color-secondary);
    max-width: 400px;
    margin: 0 auto;
  }

  // Activity feed
  &__activity {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__activity-item {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
  }

  &__activity-content {
    flex: 1;
    min-width: 0;
  }

  &__activity-text {
    font-size: $font-size-sm;
    line-height: 1.5;
    margin: 0;

    strong {
      font-weight: $font-weight-medium;
    }
  }

  &__activity-user {
    font-weight: $font-weight-medium;
    color: var(--highlight-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__activity-time {
    font-size: $font-size-xs;
    color: var(--text-color-muted);
  }

  &__activity-cover {
    width: 32px;
    height: 48px;
    object-fit: cover;
    border-radius: $radius-sm;
    flex-shrink: 0;
  }
}

@keyframes skel-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
