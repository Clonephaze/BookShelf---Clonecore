import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}))
mockNuxtImport('useAuth', () => useAuthMock)

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}))
mockNuxtImport('navigateTo', () => navigateToMock)

// eslint-disable-next-line import/first
import middleware from '../../app/middleware/auth.global'

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function runMiddleware(path: string) {
    return middleware({ path } as RouteLocationNormalized, { path: '/' } as RouteLocationNormalized)
  }

  it('redirects unauthenticated users to /login on protected routes', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(false),
    })

    runMiddleware('/library')
    expect(navigateToMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('allows unauthenticated users on /', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(false),
    })

    runMiddleware('/')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('allows unauthenticated users on /login', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(false),
    })

    runMiddleware('/login')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('allows unauthenticated users on /signup', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(false),
    })

    runMiddleware('/signup')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('allows unauthenticated users on /forgot-password', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(false),
    })

    runMiddleware('/forgot-password')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('allows unauthenticated users on /reset-password', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(false),
    })

    runMiddleware('/reset-password')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects authenticated users from /login to /library', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(true),
      isLoading: ref(false),
    })

    runMiddleware('/login')
    expect(navigateToMock).toHaveBeenCalledWith('/library', { replace: true })
  })

  it('redirects authenticated users from /signup to /library', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(true),
      isLoading: ref(false),
    })

    runMiddleware('/signup')
    expect(navigateToMock).toHaveBeenCalledWith('/library', { replace: true })
  })

  it('redirects authenticated users from /forgot-password to /library', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(true),
      isLoading: ref(false),
    })

    runMiddleware('/forgot-password')
    expect(navigateToMock).toHaveBeenCalledWith('/library', { replace: true })
  })

  it('redirects authenticated users from /reset-password to /library', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(true),
      isLoading: ref(false),
    })

    runMiddleware('/reset-password')
    expect(navigateToMock).toHaveBeenCalledWith('/library', { replace: true })
  })

  it('allows authenticated users on protected routes', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(true),
      isLoading: ref(false),
    })

    runMiddleware('/library')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('does not redirect while auth is still loading', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: ref(false),
      isLoading: ref(true),
    })

    runMiddleware('/library')
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
