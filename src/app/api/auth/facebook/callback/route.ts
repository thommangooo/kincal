import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getLongLivedToken, getUserPages } from '@/lib/facebook'
import { createSocialMediaAccount } from '@/lib/socialMedia'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/social-media?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/social-media?error=no_code`)
    }

    if (!state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/social-media?error=no_state`)
    }

    // Parse state to get entity information
    const stateData = JSON.parse(decodeURIComponent(state))
    const { entity_type, entity_id, entity_name } = stateData

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code)
    
    // Get long-lived token
    const longLivedToken = await getLongLivedToken(tokenResponse.access_token)
    
    // Get user's Facebook pages
    const pages = await getUserPages(longLivedToken.access_token)
    
    if (pages.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/social-media?error=no_pages`)
    }

    // Store the access token and pages data in a temporary way
    // We'll need to complete the account creation on the client side
    // For now, redirect with the necessary data
    const pagesData = pages.map(page => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token
    }))
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/social-media?success=facebook_connected&pages=${pages.length}&state=${encodeURIComponent(state)}&pagesData=${encodeURIComponent(JSON.stringify(pagesData))}`)

  } catch (err) {
    console.error('Facebook callback error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/social-media?error=callback_failed`)
  }
}
