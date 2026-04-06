import { getGuestData, isGuestRequest } from '../../../utils/guest'

export default defineEventHandler((event) => {
  if (!isGuestRequest(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Not a guest session' })
  }

  const data = getGuestData()
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: 'Guest data not available' })
  }

  const stats = data.stats as Record<string, unknown>
  const key = getRouterParam(event, 'key')

  if (!key || !stats[key]) {
    throw createError({ statusCode: 404, statusMessage: `Unknown stat: ${key}` })
  }

  return stats[key]
})
