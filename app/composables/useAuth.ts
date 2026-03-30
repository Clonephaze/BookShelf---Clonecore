import { createAuthClient } from 'better-auth/vue'

let _client: ReturnType<typeof createAuthClient> | null = null

function getAuthClient() {
  if (!_client) {
    const config = useRuntimeConfig()
    // Use current origin in the browser so this works on any deployment URL.
    // Fall back to configured URL for SSR (used during server-side rendering).
    const baseURL = typeof window !== 'undefined'
      ? window.location.origin
      : (config.public.betterAuthUrl as string)
    _client = createAuthClient({ baseURL })
  }
  return _client
}

export const useAuth = () => {
  const client = getAuthClient()
  const session = client.useSession()

  return {
    session,
    user: computed(() => session.value?.data?.user ?? null),
    isAuthenticated: computed(() => !!session.value?.data?.user),
    isLoading: computed(() => session.value?.isPending ?? true),

    signUp: client.signUp.email,
    signIn: client.signIn.email,
    signOut: client.signOut,
    requestPasswordReset: client.requestPasswordReset,
    resetPassword: client.resetPassword,
  }
}
