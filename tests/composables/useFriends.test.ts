import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ref } from 'vue'
import { useFriends } from '../../app/composables/useFriends'
import type { Friend, FriendRequest, ActivityItem, UserSearchResult } from '../../app/composables/useFriends'

declare const useState: <T>(key: string, init?: () => T) => Ref<T>

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    friendshipId: 'fs-001',
    id: 'user-1',
    username: 'janedoe',
    name: 'Jane Doe',
    avatar: null,
    friendsSince: '2025-11-15T00:00:00Z',
    ...overrides,
  }
}

function makeRequest(overrides: Partial<FriendRequest> = {}): FriendRequest {
  return {
    id: 'req-001',
    direction: 'received',
    user: {
      id: 'user-2',
      username: 'sender',
      name: 'Sender Name',
      avatar: null,
    },
    createdAt: '2026-04-05T14:30:00Z',
    ...overrides,
  }
}

function makeActivity(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: 'act-001',
    action: 'finished_reading',
    metadata: null,
    createdAt: '2026-04-05T18:00:00Z',
    user: { id: 'user-1', name: 'Jane', username: 'janedoe', avatar: null },
    book: { title: 'Test Book', author: 'Author', coverUrlSmall: null },
    ...overrides,
  }
}

describe('useFriends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useState<Friend[]>('friends-list').value = []
    useState<FriendRequest[]>('friend-requests').value = []
    useState<ActivityItem[]>('friend-activity').value = []
    useState<boolean>('friends-loading').value = false
    useState<boolean>('friends-loaded').value = false
  })

  describe('fetchFriends', () => {
    it('fetches friends, requests, and activity from API', async () => {
      const friendData = [makeFriend()]
      const requestData = [makeRequest()]
      const activityData = [makeActivity()]
      mockFetch
        .mockResolvedValueOnce(friendData)
        .mockResolvedValueOnce(requestData)
        .mockResolvedValueOnce(activityData)

      const { friends, requests, activity, fetchFriends } = useFriends()
      await fetchFriends()

      expect(mockFetch).toHaveBeenCalledWith('/api/friends')
      expect(mockFetch).toHaveBeenCalledWith('/api/friends/requests')
      expect(mockFetch).toHaveBeenCalledWith('/api/friends/activity')
      expect(friends.value).toHaveLength(1)
      expect(requests.value).toHaveLength(1)
      expect(activity.value).toHaveLength(1)
    })

    it('does not re-fetch without force', async () => {
      mockFetch.mockResolvedValue([])
      const { fetchFriends } = useFriends()
      await fetchFriends()
      await fetchFriends()
      // 3 calls per fetch (friends, requests, activity) × 1 actual fetch
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('re-fetches with force=true', async () => {
      mockFetch.mockResolvedValue([])
      const { fetchFriends } = useFriends()
      await fetchFriends()
      await fetchFriends(true)
      expect(mockFetch).toHaveBeenCalledTimes(6)
    })

    it('handles fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const { friends, fetchFriends } = useFriends()
      await fetchFriends()
      expect(friends.value).toHaveLength(0)
    })
  })

  describe('computed filters', () => {
    it('receivedRequests filters by direction', async () => {
      const data = [
        makeRequest({ id: 'r1', direction: 'received' }),
        makeRequest({ id: 'r2', direction: 'sent' }),
        makeRequest({ id: 'r3', direction: 'received' }),
      ]
      mockFetch
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(data)
        .mockResolvedValueOnce([])

      const { receivedRequests, fetchFriends } = useFriends()
      await fetchFriends()
      expect(receivedRequests.value).toHaveLength(2)
      expect(receivedRequests.value.map((r: FriendRequest) => r.id)).toEqual(['r1', 'r3'])
    })

    it('sentRequests filters by direction', async () => {
      const data = [
        makeRequest({ id: 'r1', direction: 'sent' }),
        makeRequest({ id: 'r2', direction: 'received' }),
      ]
      mockFetch
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(data)
        .mockResolvedValueOnce([])

      const { sentRequests, fetchFriends } = useFriends()
      await fetchFriends()
      expect(sentRequests.value).toHaveLength(1)
      expect(sentRequests.value[0].id).toBe('r1')
    })
  })

  describe('searchUsers', () => {
    it('returns empty for short queries', async () => {
      const { searchUsers } = useFriends()
      const result = await searchUsers('a')
      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns empty for empty query', async () => {
      const { searchUsers } = useFriends()
      const result = await searchUsers('')
      expect(result).toEqual([])
    })

    it('calls API for valid queries', async () => {
      const searchResult: UserSearchResult[] = [
        { id: 'u1', username: 'alice', name: 'Alice', avatar: null, status: 'none' },
      ]
      mockFetch.mockResolvedValueOnce(searchResult)
      const { searchUsers } = useFriends()
      const result = await searchUsers('ali')
      expect(mockFetch).toHaveBeenCalledWith('/api/users/search', { params: { q: 'ali' } })
      expect(result).toHaveLength(1)
    })

    it('returns empty on search error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fail'))
      const { searchUsers } = useFriends()
      const result = await searchUsers('test')
      expect(result).toEqual([])
    })
  })

  describe('sendRequest', () => {
    it('sends request and refetches', async () => {
      // sendRequest call + 3 refetch calls
      mockFetch.mockResolvedValue([])
      const { sendRequest } = useFriends()
      await sendRequest('newuser')
      expect(mockFetch).toHaveBeenCalledWith('/api/friends/requests', {
        method: 'POST',
        body: { username: 'newuser' },
      })
    })
  })

  describe('acceptRequest', () => {
    it('accepts and refetches', async () => {
      mockFetch.mockResolvedValue([])
      const { acceptRequest } = useFriends()
      await acceptRequest('req-123')
      expect(mockFetch).toHaveBeenCalledWith('/api/friends/requests/req-123/accept', { method: 'POST' })
    })
  })

  describe('declineRequest', () => {
    it('declines and refetches', async () => {
      mockFetch.mockResolvedValue([])
      const { declineRequest } = useFriends()
      await declineRequest('req-456')
      expect(mockFetch).toHaveBeenCalledWith('/api/friends/requests/req-456/decline', { method: 'POST' })
    })
  })

  describe('removeFriend', () => {
    it('removes and refetches', async () => {
      mockFetch.mockResolvedValue([])
      const { removeFriend } = useFriends()
      await removeFriend('friend-789')
      expect(mockFetch).toHaveBeenCalledWith('/api/friends/friend-789/remove', { method: 'DELETE' })
    })
  })
})
