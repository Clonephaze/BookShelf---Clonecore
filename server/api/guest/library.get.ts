import { getGuestData, isGuestRequest } from '../../utils/guest'

export default defineEventHandler(async (event) => {
  if (!isGuestRequest(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Not a guest session' })
  }

  const data = await getGuestData()
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: 'Guest data not available' })
  }

  setResponseHeader(event, 'Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
  return data.library
})
