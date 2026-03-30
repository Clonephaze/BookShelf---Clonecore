/**
 * Guest session management.
 * Uses a cookie so the middleware can read it during SSR.
 * Guest data is not persisted to the database.
 */
export const useGuest = () => {
  const isGuest = useCookie<boolean>('bookshelf-guest', {
    default: () => false,
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  })

  const enterGuestMode = () => {
    isGuest.value = true
    return navigateTo('/library')
  }

  const exitGuestMode = () => {
    isGuest.value = false
  }

  return {
    isGuest: readonly(isGuest),
    enterGuestMode,
    exitGuestMode,
  }
}
