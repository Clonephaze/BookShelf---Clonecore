export default defineNuxtPlugin(() => {
  const { isAuthenticated, isLoading } = useAuth()
  const { isGuest } = useGuest()
  const router = useRouter()

  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password']

  watch(
    () => [isAuthenticated.value, isLoading.value] as const,
    ([authed, loading]) => {
      if (loading) return

      const current = router.currentRoute.value.path

      if (!authed && !isGuest.value && !publicRoutes.includes(current)) {
        navigateTo('/login', { replace: true })
      }
    },
  )
})
