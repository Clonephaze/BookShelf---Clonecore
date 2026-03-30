import type { H3Event } from 'h3'
import { useAuth } from './auth'

export async function getServerSession(event: H3Event) {
  const auth = useAuth()
  const session = await auth!.api.getSession({
    headers: event.headers,
  })
  return session
}

export async function requireServerSession(event: H3Event) {
  const session = await getServerSession(event)
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
  return session
}
