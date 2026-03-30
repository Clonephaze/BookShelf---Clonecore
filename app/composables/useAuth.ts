import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: import.meta.env.BETTER_AUTH_URL || 'http://localhost:3000',
})

export const useAuth = () => {
  const session = authClient.useSession()

  return {
    session,
    user: computed(() => session.value?.data?.user ?? null),
    isAuthenticated: computed(() => !!session.value?.data?.user),
    isLoading: computed(() => session.value?.isPending ?? true),

    signUp: authClient.signUp.email,
    signIn: authClient.signIn.email,
    signOut: authClient.signOut,
  }
}
