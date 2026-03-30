// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createError } from 'h3'
import type { H3Event } from 'h3'

// Provide createError as a global fallback for Nitro auto-imports
vi.stubGlobal('createError', createError)

const mockGetSession = vi.fn()

vi.mock('../../server/utils/auth', () => ({
  useAuth: () => ({
    api: {
      getSession: mockGetSession,
    },
  }),
}))

// eslint-disable-next-line import/first
import { getServerSession, requireServerSession } from '../../server/utils/session'

describe('getServerSession', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
  })

  it('passes event headers to auth', async () => {
    const mockHeaders = new Headers({ cookie: 'session=abc123' })
    const event = { headers: mockHeaders } as Partial<H3Event> as H3Event
    mockGetSession.mockResolvedValue({ user: { id: '1' } })

    await getServerSession(event)
    expect(mockGetSession).toHaveBeenCalledWith({ headers: mockHeaders })
  })

  it('returns the session when it exists', async () => {
    const sessionData = { user: { id: '1', name: 'Test', email: 'test@example.com' } }
    const event = { headers: new Headers() } as Partial<H3Event> as H3Event
    mockGetSession.mockResolvedValue(sessionData)

    const session = await getServerSession(event)
    expect(session).toEqual(sessionData)
  })

  it('returns null when no session exists', async () => {
    const event = { headers: new Headers() } as Partial<H3Event> as H3Event
    mockGetSession.mockResolvedValue(null)

    const session = await getServerSession(event)
    expect(session).toBeNull()
  })
})

describe('requireServerSession', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
  })

  it('returns the session when authenticated', async () => {
    const sessionData = { user: { id: '1', name: 'Test' } }
    const event = { headers: new Headers() } as Partial<H3Event> as H3Event
    mockGetSession.mockResolvedValue(sessionData)

    const session = await requireServerSession(event)
    expect(session).toEqual(sessionData)
  })

  it('throws 401 when no session exists', async () => {
    const event = { headers: new Headers() } as Partial<H3Event> as H3Event
    mockGetSession.mockResolvedValue(null)

    try {
      await requireServerSession(event)
      expect.fail('Should have thrown')
    } catch (error: unknown) {
      const err = error as { statusCode: number; statusMessage: string }
      expect(err.statusCode).toBe(401)
      expect(err.statusMessage).toBe('Unauthorized')
    }
  })
})
