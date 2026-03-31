import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(apiKey)
  }
  return _resend
}

const FROM_ADDRESS = 'Bookshelf <noreply@clonecore.net>'

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Welcome to Bookshelf!',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-family: Lora, Georgia, serif; font-size: 24px; margin-bottom: 8px;">Welcome, ${name}!</h1>
        <p style="color: #666; margin-bottom: 24px;">Your Bookshelf account is ready. Start building your library, tracking your reading, and discovering new books.</p>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">Happy reading,<br>Bookshelf</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your Bookshelf password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-family: Lora, Georgia, serif; font-size: 24px; margin-bottom: 8px;">Reset your password</h1>
        <p style="color: #666; margin-bottom: 24px;">Click the link below to choose a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #c8973a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reset Password</a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
