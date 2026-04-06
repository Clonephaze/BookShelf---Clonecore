import { defineStore } from 'pinia'

export interface ActiveSession {
  id: string
  userBookId: string
  startedAt: string
  durationSeconds: number
  timerMode: 'countdown' | 'open'
  timerDurationSeconds: number | null
  startPage: number | null
  endPage: number | null
  status: 'active' | 'paused'
  notes: string | null
  // Book info
  bookTitle: string
  bookAuthor: string
  bookCoverSmall: string | null
  bookCover: string | null
  bookPageCount: number | null
  currentPage: number | null
}

export interface SessionHistoryItem {
  id: string
  userBookId: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number
  timerMode: string
  startPage: number | null
  endPage: number | null
  pagesRead: number | null
  status: string
  notes: string | null
  bookTitle: string
  bookAuthor: string
  bookCoverSmall: string | null
}

export interface SessionStats {
  totalSessions: number
  totalDurationSeconds: number
  totalPagesRead: number
  avgDurationSeconds: number | null
  avgPagesPerSession: number | null
  pagesPerHour: number | null
  sessionsPerWeek: number
  currentStreak: number
  longestStreak: number
}

export const useSessionStore = defineStore('session', () => {
  const active = ref<ActiveSession | null>(null)
  const loading = ref(false)
  const elapsed = ref(0) // client-side ticking seconds
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

  // Computed: total seconds including server-stored duration + client elapsed
  const totalSeconds = computed(() => {
    if (!active.value) return 0
    return active.value.durationSeconds + elapsed.value
  })

  // For countdown mode: remaining seconds
  const remainingSeconds = computed(() => {
    if (!active.value || active.value.timerMode !== 'countdown') return null
    const target = active.value.timerDurationSeconds ?? 0
    return Math.max(0, target - totalSeconds.value)
  })

  const isCountdownFinished = computed(() => {
    return remainingSeconds.value !== null && remainingSeconds.value <= 0
  })

  // Format time display
  const displayTime = computed(() => {
    const secs = active.value?.timerMode === 'countdown'
      ? (remainingSeconds.value ?? 0)
      : totalSeconds.value
    return formatDuration(secs)
  })

  function formatDuration(totalSec: number): string {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function startTicking() {
    stopTicking()
    elapsed.value = 0
    timerInterval.value = setInterval(() => {
      if (active.value?.status === 'active') {
        elapsed.value++
      }
    }, 1000)
  }

  function stopTicking() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  // Sync duration to server periodically (every 30s)
  let syncInterval: ReturnType<typeof setInterval> | null = null

  function startSync() {
    stopSync()
    syncInterval = setInterval(() => {
      if (active.value?.status === 'active' && elapsed.value > 0) {
        syncToServer()
      }
    }, 30000)
  }

  function stopSync() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  async function syncToServer() {
    if (!active.value) return
    try {
      await $fetch(`/api/sessions/${active.value.id}`, {
        method: 'PATCH',
        body: { durationSeconds: totalSeconds.value },
      })
      // Update stored duration and reset elapsed
      active.value.durationSeconds = totalSeconds.value
      elapsed.value = 0
    }
    catch {
      // Silent fail — will retry on next sync
    }
  }

  async function fetchActive() {
    loading.value = true
    try {
      const data = await $fetch<ActiveSession | null>('/api/sessions/active')
      active.value = data
      if (data && data.status === 'active') {
        startTicking()
        startSync()
      }
    }
    catch {
      active.value = null
    }
    finally {
      loading.value = false
    }
  }

  async function startSession(opts: {
    userBookId: string
    timerMode?: 'countdown' | 'open'
    timerDurationSeconds?: number
    startPage?: number
  }) {
    const created = await $fetch('/api/sessions', {
      method: 'POST',
      body: opts,
    })
    // Re-fetch active to get full book info
    await fetchActive()
    return created
  }

  async function pause() {
    if (!active.value) return
    await syncToServer()
    const updated = await $fetch(`/api/sessions/${active.value.id}`, {
      method: 'PATCH',
      body: { action: 'pause', durationSeconds: totalSeconds.value },
    })
    stopTicking()
    stopSync()
    if (active.value) {
      active.value.status = 'paused'
      active.value.durationSeconds = totalSeconds.value
      elapsed.value = 0
    }
    return updated
  }

  async function resume() {
    if (!active.value) return
    const updated = await $fetch(`/api/sessions/${active.value.id}`, {
      method: 'PATCH',
      body: { action: 'resume' },
    })
    if (active.value) {
      active.value.status = 'active'
    }
    startTicking()
    startSync()
    return updated
  }

  async function complete(endPage?: number) {
    if (!active.value) return
    const updated = await $fetch(`/api/sessions/${active.value.id}`, {
      method: 'PATCH',
      body: {
        action: 'complete',
        durationSeconds: totalSeconds.value,
        endPage,
      },
    })
    stopTicking()
    stopSync()
    active.value = null
    elapsed.value = 0
    return updated
  }

  async function abandon() {
    if (!active.value) return
    await $fetch(`/api/sessions/${active.value.id}`, {
      method: 'PATCH',
      body: { action: 'abandon', durationSeconds: totalSeconds.value },
    })
    stopTicking()
    stopSync()
    active.value = null
    elapsed.value = 0
  }

  // Page Visibility API — auto-pause when tab hidden
  if (import.meta.client) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && active.value?.status === 'active') {
        syncToServer()
      }
    })
  }

  function cleanup() {
    stopTicking()
    stopSync()
  }

  return {
    active,
    loading,
    elapsed,
    totalSeconds,
    remainingSeconds,
    isCountdownFinished,
    displayTime,
    formatDuration,
    fetchActive,
    startSession,
    pause,
    resume,
    complete,
    abandon,
    syncToServer,
    cleanup,
  }
})
