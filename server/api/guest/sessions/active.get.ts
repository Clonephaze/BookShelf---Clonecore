import { isGuestRequest } from '../../../utils/guest'

export default defineEventHandler(async (event) => {
  if (!isGuestRequest(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Not a guest session' })
  }

  // Guests don't have active sessions
  return null
})
