import { fetchAudioDuration } from '~~/server/services/book-api/hardcover'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const hardcoverId = Number(query.hardcoverId)

  if (!hardcoverId || !Number.isFinite(hardcoverId)) {
    throw createError({ statusCode: 400, message: 'hardcoverId is required' })
  }

  const audioSeconds = await fetchAudioDuration(hardcoverId)

  return { audioSeconds }
})
