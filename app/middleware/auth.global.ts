export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isLoading } = useAuth()
  const { isGuest, exitGuestMode } = useGuest()

  // Don't redirect while auth is still loading
  if (isLoading.value) return

  // If a real session exists, ensure the guest flag is cleared
  if (isAuthenticated.value && isGuest.value) {
    exitGuestMode()
  }

  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password']
  const isPublic = publicRoutes.includes(to.path)

  // Guests and authenticated users can both access protected routes
  if (!isPublic && !isAuthenticated.value && !isGuest.value) {
    return navigateTo('/login', { replace: true })
  }

  // Redirect logged-in users away from auth pages (guests stay — they may want to sign up)
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password']
  if (authPages.includes(to.path) && isAuthenticated.value) {
    return navigateTo('/library', { replace: true })
  }
})
