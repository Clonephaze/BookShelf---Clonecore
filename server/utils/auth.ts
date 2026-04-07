import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDB } from '../database'
import { setDevData } from './dev-store'
import { sendPasswordResetEmail, sendWelcomeEmail } from './email'
import * as schema from '../database/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null

export function useAuth() {
  if (!_auth) {
    // BETTER_AUTH_URL takes priority. VERCEL_PROJECT_PRODUCTION_URL is Vercel's
    // stable production URL (unlike VERCEL_URL which changes per deployment).
    const baseURL = process.env.BETTER_AUTH_URL
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

    // Also trust the current deployment URL (Vercel preview/branch URLs)
    const trustedOrigins = [baseURL]
    if (process.env.VERCEL_URL) {
      trustedOrigins.push(`https://${process.env.VERCEL_URL}`)
    }

    _auth = betterAuth({
      baseURL,
      trustedOrigins,
      secret: process.env.BETTER_AUTH_SECRET,
      database: drizzleAdapter(useDB(), {
        provider: 'pg',
        schema,
      }),
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
          // Append email to callback URL so reset page can auto-sign-in after
          const resetUrl = new URL(url)
          const callbackURL = resetUrl.searchParams.get('callbackURL')
          if (callbackURL) {
            const cb = new URL(callbackURL)
            cb.searchParams.set('email', user.email)
            resetUrl.searchParams.set('callbackURL', cb.toString())
          }
          const enrichedUrl = resetUrl.toString()

          // Always store for dev tools
          setDevData('lastResetUrl', enrichedUrl)

          if (process.env.RESEND_API_KEY) {
            await sendPasswordResetEmail(user.email, enrichedUrl)
          }
          else {
            console.log(`[Auth] Password reset for ${user.email}: ${enrichedUrl}`)
          }
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh daily
      },
      user: {
        additionalFields: {
          username: {
            type: 'string' as const,
            required: false,
          },
          avatar: {
            type: 'string' as const,
            required: false,
          },
        },
        deleteUser: {
          enabled: true,
        },
      },
      hooks: {
        after: createAuthMiddleware(async (ctx) => {
          if (ctx.path.startsWith('/sign-up')) {
            const newSession = ctx.context.newSession
            if (newSession && process.env.RESEND_API_KEY) {
              try {
                await sendWelcomeEmail(newSession.user.email, newSession.user.name)
              }
              catch (e) {
                console.error('[Auth] Failed to send welcome email:', e)
              }
            }
          }
        }),
      },
    })
  }
  return _auth
}
