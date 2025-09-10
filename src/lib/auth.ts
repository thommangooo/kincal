import { supabase, MagicLinkToken } from './supabase'
import crypto from 'crypto'

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Create a magic link token
export async function createMagicLinkToken(email: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

  const { error } = await supabase
    .from('magic_link_tokens')
    .insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
      used: false
    })

  if (error) throw error
  return token
}

// Verify and consume a magic link token
export async function verifyMagicLinkToken(token: string): Promise<{ email: string; valid: boolean }> {
  const { data, error } = await supabase
    .from('magic_link_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single()

  if (error || !data) {
    return { email: '', valid: false }
  }

  // Check if token is expired
  const now = new Date()
  const expiresAt = new Date(data.expires_at)
  
  if (now > expiresAt) {
    return { email: '', valid: false }
  }

  // Mark token as used
  await supabase
    .from('magic_link_tokens')
    .update({ used: true })
    .eq('id', data.id)

  return { email: data.email, valid: true }
}

// Clean up expired tokens (call this periodically)
export async function cleanupExpiredTokens() {
  const { error } = await supabase
    .from('magic_link_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) throw error
}

// Generate magic link URL
export function generateMagicLinkUrl(token: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'): string {
  return `${baseUrl}/auth/verify?token=${token}`
}

// Send magic link email (you'll need to implement this with your email service)
export async function sendMagicLinkEmail(email: string, magicLinkUrl: string) {
  // This is a placeholder - you'll need to implement actual email sending
  // For now, we'll just log it to the console
  console.log(`Magic link for ${email}: ${magicLinkUrl}`)
  
  // In production, you would use a service like:
  // - Resend
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  
  // Example with Resend:
  // const { data, error } = await resend.emails.send({
  //   from: 'noreply@kincal.ca',
  //   to: email,
  //   subject: 'Your Kin Calendar Magic Link',
  //   html: `
  //     <h1>Welcome to Kin Calendar</h1>
  //     <p>Click the link below to access your account:</p>
  //     <a href="${magicLinkUrl}">Access Kin Calendar</a>
  //     <p>This link will expire in 15 minutes.</p>
  //   `
  // })
}

