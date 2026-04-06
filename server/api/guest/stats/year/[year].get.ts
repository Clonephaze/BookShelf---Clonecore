import { getGuestData, isGuestRequest } from '../../../../utils/guest'

export default defineEventHandler(async (event) => {
  if (!isGuestRequest(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Not a guest session' })
  }

  const data = await getGuestData()
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: 'Guest data not available' })
  }

  const yearParam = getRouterParam(event, 'year')
  const year = Number(yearParam) || new Date().getFullYear()

  const yearReviews = data.yearReviews as Record<string, unknown> | undefined
  const review = yearReviews?.[String(year)]

  if (!review) {
    throw createError({ statusCode: 404, statusMessage: `No year review data for ${year}` })
  }

  return review
})
