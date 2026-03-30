export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Don't redirect while auth is still loading
  if (isLoading.value) return

  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password']
  const isPublic = publicRoutes.includes(to.path)

  if (!isPublic && !isAuthenticated.value) {
    return navigateTo('/login', { replace: true })
  }

  // Redirect logged-in users away from auth pages
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password']
  if (authPages.includes(to.path) && isAuthenticated.value) {
    return navigateTo('/library', { replace: true })
  }
})
