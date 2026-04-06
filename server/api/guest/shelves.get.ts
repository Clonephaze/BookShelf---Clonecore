export default defineEventHandler(async (event) => {
  if (!isGuestRequest(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Not a guest session' })
  }

  const data = await getGuestData()
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: 'Guest data unavailable' })
  }

  const library = data.library as Array<{
    id: string
    name: string
    slug: string
    icon: string | null
    isDefault: boolean
    position: number
  }>

  return library.map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    icon: s.icon,
    isDefault: s.isDefault,
    position: s.position,
  }))
})
