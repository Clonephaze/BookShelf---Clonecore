export interface Friend {
  friendshipId: string
  id: string
  username: string | null
  name: string
  avatar: string | null
  friendsSince: string
}

export interface FriendRequest {
  id: string
  direction: 'sent' | 'received'
  user: {
    id: string
    username: string | null
    name: string
    avatar: string | null
  }
  createdAt: string
}

export interface UserSearchResult {
  id: string
  username: string | null
  name: string
  avatar: string | null
  status: 'none' | 'friends' | 'request_sent' | 'request_received'
  requestId?: string
}

export interface ActivityItem {
  id: string
  action: string
  metadata: Record<string, unknown> | null
  createdAt: string
  user: {
    id: string
    name: string
    username: string | null
    avatar: string | null
  }
  book: {
    title: string
    author: string
    coverUrlSmall: string | null
  } | null
}

export function useFriends() {
  const { isGuest } = useGuest()

  const friends = useState<Friend[]>('friends-list', () => [])
  const requests = useState<FriendRequest[]>('friend-requests', () => [])
  const activity = useState<ActivityItem[]>('friend-activity', () => [])
  const loading = useState<boolean>('friends-loading', () => false)
  const loaded = useState<boolean>('friends-loaded', () => false)

  async function fetchFriends(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const base = isGuest.value ? '/api/guest' : '/api'
      const [f, r, a] = await Promise.all([
        $fetch<Friend[]>(`${base}/friends`),
        $fetch<FriendRequest[]>(`${base}/friends/requests`),
        $fetch<ActivityItem[]>(`${base}/friends/activity`),
      ])
      friends.value = f
      requests.value = r
      activity.value = a
      loaded.value = true
    }
    catch {
      // Silent
    }
    finally {
      loading.value = false
    }
  }

  async function searchUsers(query: string) {
    if (!query || query.length < 2) return []
    try {
      return await $fetch<UserSearchResult[]>('/api/users/search', {
        params: { q: query },
      })
    }
    catch {
      return []
    }
  }

  async function sendRequest(username: string) {
    await $fetch('/api/friends/requests', {
      method: 'POST',
      body: { username },
    })
    await fetchFriends(true)
  }

  async function acceptRequest(requestId: string) {
    await $fetch(`/api/friends/requests/${requestId}/accept`, { method: 'POST' })
    await fetchFriends(true)
  }

  async function declineRequest(requestId: string) {
    await $fetch(`/api/friends/requests/${requestId}/decline`, { method: 'POST' })
    await fetchFriends(true)
  }

  async function removeFriend(friendId: string) {
    await $fetch(`/api/friends/${friendId}/remove`, { method: 'DELETE' })
    await fetchFriends(true)
  }

  const receivedRequests = computed(() => requests.value.filter(r => r.direction === 'received'))
  const sentRequests = computed(() => requests.value.filter(r => r.direction === 'sent'))

  return {
    friends,
    requests,
    receivedRequests,
    sentRequests,
    activity,
    loading,
    fetchFriends,
    searchUsers,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  }
}
