import { getGuestData, isGuestRequest } from '../../../utils/guest'

export default defineEventHandler(async (event) => {
  if (!isGuestRequest(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Not a guest session' })
  }

  const data = await getGuestData()
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: 'Guest data not available' })
  }

  const friends = data.friends as { activity: unknown[] }
  return friends?.activity ?? []
})
