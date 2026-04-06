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
const SITE_URL = 'https://bookshelf-clonecore.vercel.app'

// ── Shared email layout ──────────────────────────────────────────────

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4ebdb;font-family:'Segoe UI',Inter,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4ebdb;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e1d8c8;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#302318;padding:24px 32px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8844a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#f4ebdb;letter-spacing:0.5px;">Bookshelf</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e1d8c8;padding:20px 32px;text-align:center;">
            <a href="${SITE_URL}" style="color:#a0592a;font-size:13px;text-decoration:none;">bookshelf-clonecore.vercel.app</a>
            <p style="color:#8a7a66;font-size:12px;margin:8px 0 0;">Every book tells a story. Yours starts here.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#a0592a;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a>`
}

// ── Welcome email ────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const resend = getResend()
  const firstName = name.split(' ')[0] || name

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Welcome to Bookshelf!',
    html: emailLayout(`
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#302318;margin:0 0 8px;">Welcome, ${firstName}!</h1>
      <p style="color:#5c4a38;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Your Bookshelf is ready. Here's how to get started:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0ebe3;">
            <strong style="color:#302318;">1. Build your library</strong>
            <p style="color:#5c4a38;font-size:14px;margin:4px 0 0;">Search millions of books by title, author, or ISBN and add them to your shelves.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0ebe3;">
            <strong style="color:#302318;">2. Track your reading</strong>
            <p style="color:#5c4a38;font-size:14px;margin:4px 0 0;">Log progress page by page, time your reading sessions, and set yearly goals.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0ebe3;">
            <strong style="color:#302318;">3. Discover insights</strong>
            <p style="color:#5c4a38;font-size:14px;margin:4px 0 0;">Watch your stats grow — genre breakdowns, pace trends, and a year-in-review you can share.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <strong style="color:#302318;">4. Connect with readers</strong>
            <p style="color:#5c4a38;font-size:14px;margin:4px 0 0;">Add friends by username and see what they're reading.</p>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin-bottom:8px;">
        ${emailButton(SITE_URL + '/library', 'Go to your library')}
      </div>
      <p style="color:#8a7a66;font-size:13px;text-align:center;margin-top:20px;">Happy reading!</p>
    `),
  })
}

// ── Password reset email ─────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resend = getResend()

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your Bookshelf password',
    html: emailLayout(`
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#302318;margin:0 0 8px;">Reset your password</h1>
      <p style="color:#5c4a38;font-size:15px;line-height:1.6;margin:0 0 24px;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        ${emailButton(resetUrl, 'Reset password')}
      </div>
      <p style="color:#8a7a66;font-size:13px;margin:0 0 4px;">This link expires in 1 hour.</p>
      <p style="color:#8a7a66;font-size:13px;margin:0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `),
  })
}

// ── Friend request email ─────────────────────────────────────────────

export async function sendFriendRequestEmail(to: string, fromName: string, fromUsername: string): Promise<void> {
  const resend = getResend()

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${fromName} wants to be your friend on Bookshelf`,
    html: emailLayout(`
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#302318;margin:0 0 8px;">New friend request</h1>
      <div style="background:#faf5eb;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="color:#302318;font-size:16px;font-weight:600;margin:0 0 4px;">${fromName}</p>
        <p style="color:#8a7a66;font-size:14px;margin:0;">@${fromUsername}</p>
      </div>
      <p style="color:#5c4a38;font-size:15px;line-height:1.6;margin:0 0 24px;">
        ${fromName} would like to connect with you on Bookshelf. Accept their request to share your reading activity.
      </p>
      <div style="text-align:center;margin-bottom:8px;">
        ${emailButton(SITE_URL + '/friends', 'View request')}
      </div>
    `),
  })
}
