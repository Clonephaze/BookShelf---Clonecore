import { getDevData, clearDevData } from '../../utils/dev-store'

export default defineEventHandler(() => {
  if (process.env.BOOKSHELF_DEV !== 'true') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const resetUrl = getDevData('lastResetUrl')
  if (resetUrl) {
    clearDevData('lastResetUrl')
  }

  return { resetUrl: resetUrl ?? null }
})
