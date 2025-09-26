
// Facebook Graph API configuration
const getFacebookConfig = () => {
  console.log('Getting Facebook config:', {
    FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? 'SET' : 'NOT SET',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'SET' : 'NOT SET',
    FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET'
  })
  
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`
  
  if (!appId || !appSecret) {
    console.warn('Facebook credentials not configured. Social media features will be disabled.')
    return null
  }
  
  return { appId, appSecret, redirectUri }
}

// Facebook API endpoints
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0'
const FACEBOOK_OAUTH_BASE = 'https://www.facebook.com/v18.0/dialog/oauth'

// Types for Facebook API responses
export interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
  tasks: string[]
}

export interface FacebookPostResponse {
  id: string
  success: boolean
}

export interface FacebookError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
  }
}

// Generate Facebook OAuth URL
export function generateFacebookAuthUrl(state: string): string {
  console.log('generateFacebookAuthUrl called with state:', state)
  console.log('Environment variables:', {
    FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? 'SET' : 'NOT SET',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'SET' : 'NOT SET',
    FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET'
  })
  
  const config = getFacebookConfig()
  if (!config) {
    throw new Error('Facebook credentials not configured')
  }
  
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list',
    response_type: 'code',
    state: state
  })
  
  return `${FACEBOOK_OAUTH_BASE}?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const config = getFacebookConfig()
  if (!config) {
    throw new Error('Facebook credentials not configured')
  }
  
  const response = await fetch(`${FACEBOOK_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      redirect_uri: config.redirectUri,
      code: code
    })
  })

  if (!response.ok) {
    const error: FacebookError = await response.json()
    throw new Error(`Facebook OAuth error: ${error.error.message}`)
  }

  return await response.json()
}

// Get user's Facebook pages
export async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(`${FACEBOOK_API_BASE}/me/accounts?access_token=${accessToken}`)
  
  if (!response.ok) {
    const error: FacebookError = await response.json()
    throw new Error(`Failed to get Facebook pages: ${error.error.message}`)
  }

  const data = await response.json()
  return data.data || []
}

// Get long-lived access token
export async function getLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const config = getFacebookConfig()
  if (!config) {
    throw new Error('Facebook credentials not configured')
  }
  
  const response = await fetch(`${FACEBOOK_API_BASE}/oauth/access_token`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  const url = new URL(response.url)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', config.appId)
  url.searchParams.set('client_secret', config.appSecret)
  url.searchParams.set('fb_exchange_token', shortLivedToken)

  const longLivedResponse = await fetch(url.toString())
  
  if (!longLivedResponse.ok) {
    const error: FacebookError = await longLivedResponse.json()
    throw new Error(`Failed to get long-lived token: ${error.error.message}`)
  }

  return await longLivedResponse.json()
}

// Post to Facebook page
export async function postToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
  link?: string,
  imageUrl?: string
): Promise<FacebookPostResponse> {
  const postData: {
    message: string
    access_token: string
    link?: string
    picture?: string
    attached_media?: string
  } = {
    message: message,
    access_token: pageAccessToken
  }

  // Add link if provided
  if (link) {
    postData.link = link
  }

  // Add image if provided
  if (imageUrl) {
    postData.attached_media = JSON.stringify([{
      media_fbid: await uploadImageToFacebook(pageId, pageAccessToken, imageUrl)
    }])
  }

  const response = await fetch(`${FACEBOOK_API_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(postData)
  })

  if (!response.ok) {
    const error: FacebookError = await response.json()
    throw new Error(`Failed to post to Facebook: ${error.error.message}`)
  }

  const result = await response.json()
  return {
    id: result.id,
    success: true
  }
}

// Upload image to Facebook
async function uploadImageToFacebook(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string
): Promise<string> {
  const response = await fetch(`${FACEBOOK_API_BASE}/${pageId}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      url: imageUrl,
      published: 'false', // Don't publish immediately, just upload
      access_token: pageAccessToken
    })
  })

  if (!response.ok) {
    const error: FacebookError = await response.json()
    throw new Error(`Failed to upload image to Facebook: ${error.error.message}`)
  }

  const result = await response.json()
  return result.id
}

// Check if access token is valid
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${FACEBOOK_API_BASE}/me?access_token=${accessToken}`)
    return response.ok
  } catch {
    return false
  }
}

// Refresh access token if needed
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  // Facebook doesn't have traditional refresh tokens
  // Instead, we need to use the long-lived token exchange
  return await getLongLivedToken(refreshToken)
}

// Utility function to format event data for Facebook posting
export function formatEventForFacebook(event: {
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  event_url?: string
  image_url?: string
}): string {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  let message = `🎉 ${event.title}\n\n`
  
  if (event.description) {
    message += `${event.description}\n\n`
  }
  
  message += `📅 Date: ${startDate.toLocaleDateString()}`
  
  if (startDate.toDateString() !== endDate.toDateString()) {
    message += ` - ${endDate.toLocaleDateString()}`
  }
  
  if (event.location) {
    message += `\n📍 Location: ${event.location}`
  }
  
  if (event.event_url) {
    message += `\n🔗 More info: ${event.event_url}`
  }
  
  return message
}

// Utility function to format announcement data for Facebook posting
export function formatAnnouncementForFacebook(announcement: {
  title: string
  content: string
  image_url?: string
}): string {
  // Strip HTML tags from content for Facebook
  const plainTextContent = announcement.content.replace(/<[^>]*>/g, '')
  
  let message = `📢 ${announcement.title}\n\n`
  message += plainTextContent
  
  return message
}
