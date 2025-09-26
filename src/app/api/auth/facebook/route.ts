import { NextRequest, NextResponse } from 'next/server'
import { generateFacebookAuthUrl } from '@/lib/facebook'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    
    if (!state) {
      return NextResponse.json({ error: 'State parameter is required' }, { status: 400 })
    }
    
    const authUrl = generateFacebookAuthUrl(state)
    
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Facebook auth error:', error)
    return NextResponse.json({ error: 'Failed to initiate Facebook authentication' }, { status: 500 })
  }
}
