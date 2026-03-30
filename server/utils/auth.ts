import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDB } from '../database'
import { setDevData } from './dev-store'
import * as schema from '../database/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null

export function useAuth() {
  if (!_auth) {
    _auth = betterAuth({
      baseURL: process.env.BETTER_AUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      secret: process.env.BETTER_AUTH_SECRET,
      database: drizzleAdapter(useDB(), {
        provider: 'pg',
        schema,
      }),
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
          // Store for dev tools when in dev mode
          setDevData('lastResetUrl', url)
          console.log(`[Auth] Password reset for ${user.email}: ${url}`)
          // TODO: Replace with real email service (Resend, SendGrid, etc.)
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh daily
      },
    })
  }
  return _auth
}
